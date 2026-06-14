from __future__ import annotations

from copy import deepcopy
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.models import ClassRoom, CurriculumPlan, CurriculumSnapshot, User
from app.repositories.curriculum_repository import (
    create_curriculum_plan,
    create_curriculum_snapshot,
    get_curriculum_plan,
    list_curriculum_plans_for_class,
    list_curriculum_snapshots_for_curriculum,
    update_curriculum_plan,
)
from app.repositories.onboarding_repository import get_teacher_class_membership
from app.schemas.curriculum import (
    CurriculumCreateRequest,
    CurriculumListItem,
    CurriculumRoadmapData,
    CurriculumPatchRequest,
    CurriculumPatchResponse,
    CurriculumResponse,
    CurriculumUpdateRequest,
)
from app.services.curriculum_presets import build_ncert_curriculum


SUPPORTED_SOURCE_TYPES = {"manual", "syllabus", "document", "subject", "ncert"}


def _ensure_teacher_has_access(db: Session, user: User, class_id: str) -> None:
    membership = get_teacher_class_membership(db, str(user.id), class_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _build_graph(root: dict) -> tuple[list[dict], list[dict]]:
    nodes: list[dict] = []
    edges: list[dict] = []

    def walk(node: dict, parent_id: str | None = None) -> None:
        children = node.get("children", []) or []
        node["order"] = node.get("order", 0)
        nodes.append(
            {
                "id": node["id"],
                "title": node["title"],
                "kind": node.get("kind", "topic"),
                "order": node["order"],
                "metadata": node.get("metadata", {}),
            }
        )
        if parent_id is not None:
            edges.append(
                {
                    "id": f"{parent_id}-{node['id']}",
                    "source": parent_id,
                    "target": node["id"],
                    "kind": "contains",
                }
            )

        for index, child in enumerate(children):
            child["order"] = index
            walk(child, node["id"])

    walk(root)
    return nodes, edges


def _find_node_and_parent(node: dict, target_id: str, parent: dict | None = None) -> tuple[dict | None, dict | None]:
    if node.get("id") == target_id:
        return node, parent

    for child in node.get("children", []) or []:
        found, found_parent = _find_node_and_parent(child, target_id, node)
        if found:
            return found, found_parent

    return None, None


def _find_parent_node(root: dict, parent_id: str) -> dict:
    if root.get("id") == parent_id:
        return root

    node, _ = _find_node_and_parent(root, parent_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent node not found")
    return node


def _ensure_unique_node_id(root: dict, node_id: str) -> None:
    existing, _ = _find_node_and_parent(root, node_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Node id already exists")


def _sync_root_title(roadmap: dict) -> None:
    roadmap["root"]["title"] = roadmap["title"]


def _normalize_roadmap(roadmap: dict) -> CurriculumRoadmapData:
    _sync_root_title(roadmap)
    nodes, edges = _build_graph(roadmap["root"])
    roadmap["nodes"] = nodes
    roadmap["edges"] = edges
    return CurriculumRoadmapData.model_validate(roadmap)


def _curriculum_payload(curriculum: CurriculumPlan) -> dict:
    return deepcopy(curriculum.curriculum_data)


def _snapshot_curriculum(
    db: Session,
    curriculum: CurriculumPlan,
    patch_operation: str,
    patch_payload: dict,
) -> None:
    create_curriculum_snapshot(
        db,
        CurriculumSnapshot(
            curriculum_id=curriculum.id,
            version=curriculum.version,
            patch_operation=patch_operation,
            patch_payload=patch_payload,
            curriculum_data=curriculum.curriculum_data,
            created_by_teacher_id=curriculum.created_by_teacher_id,
        ),
    )


def _render_response(curriculum: CurriculumPlan) -> CurriculumResponse:
    curriculum_data = CurriculumRoadmapData.model_validate(curriculum.curriculum_data)
    return CurriculumResponse(
        curriculum_id=str(curriculum.id),
        class_id=str(curriculum.class_id),
        version=curriculum.version,
        title=curriculum.title,
        source_type=curriculum.source_type,
        source_text=curriculum.source_text,
        source_subject=curriculum.source_subject,
        document_id=curriculum.document_id,
        curriculum_data=curriculum_data,
        status=curriculum.status,
    )


def _get_class_room_for_teacher(db: Session, user: User, class_id: str):
    _ensure_teacher_has_access(db, user, class_id)
    class_room = db.get(ClassRoom, class_id)
    if not class_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return class_room


def _apply_patch_to_roadmap(roadmap: dict, request: CurriculumPatchRequest) -> dict:
    root = roadmap["root"]

    if request.operation == "add_node":
        if not request.parent_node_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="parent_node_id is required")

        parent_node = _find_parent_node(root, request.parent_node_id)
        new_node = {
            "id": request.payload.get("id") or uuid.uuid4().hex,
            "title": request.payload.get("title"),
            "kind": request.payload.get("kind", "topic"),
            "order": request.position if request.position is not None else len(parent_node.get("children", []) or []),
            "metadata": request.payload.get("metadata", {}),
            "children": request.payload.get("children", []),
        }
        if not new_node["title"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title is required")

        _ensure_unique_node_id(root, new_node["id"])

        children = list(parent_node.get("children", []) or [])
        insert_at = min(request.position if request.position is not None else len(children), len(children))
        children.insert(insert_at, new_node)
        parent_node["children"] = children

    elif request.operation == "update_node":
        if not request.target_node_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="target_node_id is required")

        target_node, _ = _find_node_and_parent(root, request.target_node_id)
        if not target_node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")

        allowed_keys = {"title", "kind", "metadata"}
        for key in allowed_keys:
            if key in request.payload:
                target_node[key] = request.payload[key]

        if target_node.get("id") == root.get("id") and "title" in request.payload:
            roadmap["title"] = request.payload["title"]

    elif request.operation == "delete_node":
        if not request.target_node_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="target_node_id is required")

        target_node, parent_node = _find_node_and_parent(root, request.target_node_id)
        if not target_node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
        if target_node.get("id") == root.get("id"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root node cannot be deleted")

        if not parent_node:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent node not found")

        parent_children = list(parent_node.get("children", []) or [])
        parent_node["children"] = [child for child in parent_children if child.get("id") != request.target_node_id]

    elif request.operation == "move_node":
        if not request.target_node_id or not request.parent_node_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="target_node_id and parent_node_id are required")

        target_node, current_parent = _find_node_and_parent(root, request.target_node_id)
        if not target_node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
        if not current_parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root node cannot be moved")

        current_parent_id = current_parent.get("id")
        if current_parent_id != request.parent_node_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nodes can only move within the same parent")

        siblings = list(current_parent.get("children", []) or [])
        source_index = next((index for index, child in enumerate(siblings) if child.get("id") == request.target_node_id), None)
        if source_index is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found in parent")

        node = siblings.pop(source_index)
        insert_at = request.position if request.position is not None else len(siblings)
        insert_at = max(0, min(insert_at, len(siblings)))
        siblings.insert(insert_at, node)
        current_parent["children"] = siblings

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported patch operation")

    return _normalize_roadmap(roadmap).model_dump()


def create_class_curriculum(
    db: Session,
    user: User,
    class_id: str,
    request: CurriculumCreateRequest,
) -> CurriculumResponse:
    _ensure_teacher_has_access(db, user, class_id)

    curriculum_payload = request.curriculum_data.model_copy(update={"title": request.title})

    if curriculum_payload.source_type not in SUPPORTED_SOURCE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported source type")

    if curriculum_payload.source_type != "manual":
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="AI curriculum generation is not enabled yet")

    curriculum = create_curriculum_plan(
        db,
        CurriculumPlan(
            class_id=class_id,
            created_by_teacher_id=user.id,
            version=1,
            title=curriculum_payload.title,
            source_type=curriculum_payload.source_type,
            source_text=curriculum_payload.source_text,
            source_subject=curriculum_payload.source_subject,
            document_id=curriculum_payload.document_id,
            curriculum_data=curriculum_payload.model_dump(),
            status=request.status,
        ),
    )

    _snapshot_curriculum(db, curriculum, "create", curriculum_payload.model_dump())

    return _render_response(curriculum)


def list_class_curricula(db: Session, user: User, class_id: str) -> list[CurriculumListItem]:
    _ensure_teacher_has_access(db, user, class_id)
    curricula = list_curriculum_plans_for_class(db, class_id)
    return [
        CurriculumListItem(
            curriculum_id=str(curriculum.id),
            class_id=str(curriculum.class_id),
            version=curriculum.version,
            title=curriculum.title,
            source_type=curriculum.source_type,
            status=curriculum.status,
        )
        for curriculum in curricula
    ]


def get_class_curriculum(db: Session, user: User, class_id: str, curriculum_id: str) -> CurriculumResponse:
    _ensure_teacher_has_access(db, user, class_id)
    curriculum = get_curriculum_plan(db, curriculum_id)
    if not curriculum or str(curriculum.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum not found")

    return _render_response(curriculum)


def update_class_curriculum(
    db: Session,
    user: User,
    class_id: str,
    curriculum_id: str,
    request: CurriculumUpdateRequest,
) -> CurriculumResponse:
    _ensure_teacher_has_access(db, user, class_id)
    curriculum = get_curriculum_plan(db, curriculum_id)
    if not curriculum or str(curriculum.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum not found")

    if request.title is not None:
        curriculum.title = request.title
    if request.curriculum_data is not None:
        curriculum.curriculum_data = request.curriculum_data.model_copy(update={"title": request.title or request.curriculum_data.title}).model_dump()
    if request.status is not None:
        curriculum.status = request.status

    curriculum.version += 1

    curriculum = update_curriculum_plan(db, curriculum)

    _snapshot_curriculum(db, curriculum, "update", request.model_dump())

    return _render_response(curriculum)


def patch_class_curriculum(
    db: Session,
    user: User,
    class_id: str,
    curriculum_id: str,
    request: CurriculumPatchRequest,
) -> CurriculumPatchResponse:
    _ensure_teacher_has_access(db, user, class_id)
    curriculum = get_curriculum_plan(db, curriculum_id)
    if not curriculum or str(curriculum.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum not found")

    if curriculum.version != request.expected_version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Curriculum version mismatch")

    roadmap = _curriculum_payload(curriculum)
    updated_roadmap = _apply_patch_to_roadmap(roadmap, request)

    curriculum.curriculum_data = updated_roadmap
    curriculum.title = updated_roadmap["title"]
    curriculum.source_type = updated_roadmap["source_type"]
    curriculum.source_text = updated_roadmap.get("source_text")
    curriculum.source_subject = updated_roadmap.get("source_subject")
    curriculum.document_id = updated_roadmap.get("document_id")
    curriculum.version += 1

    curriculum = update_curriculum_plan(db, curriculum)
    _snapshot_curriculum(db, curriculum, request.operation, request.model_dump())

    return CurriculumPatchResponse(
        curriculum_id=str(curriculum.id),
        class_id=str(curriculum.class_id),
        version=curriculum.version,
        title=curriculum.title,
        source_type=curriculum.source_type,
        source_text=curriculum.source_text,
        source_subject=curriculum.source_subject,
        document_id=curriculum.document_id,
        curriculum_data=CurriculumRoadmapData.model_validate(curriculum.curriculum_data),
        status=curriculum.status,
    )


def bootstrap_ncert_curriculum(
    db: Session,
    user: User,
    class_id: str,
) -> CurriculumResponse:
    class_room = _get_class_room_for_teacher(db, user, class_id)

    title = f"NCERT {class_room.subject} - Class {class_room.grade}"
    try:
        curriculum_data = build_ncert_curriculum(title=title, grade=class_room.grade, subject=class_room.subject)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    curriculum = create_curriculum_plan(
        db,
        CurriculumPlan(
            class_id=class_room.id,
            created_by_teacher_id=user.id,
            version=1,
            title=curriculum_data.title,
            source_type=curriculum_data.source_type,
            source_text=curriculum_data.source_text,
            source_subject=curriculum_data.source_subject,
            document_id=curriculum_data.document_id,
            curriculum_data=curriculum_data.model_dump(),
            status="draft",
        ),
    )

    _snapshot_curriculum(db, curriculum, "bootstrap_ncert", curriculum_data.model_dump())
    return _render_response(curriculum)
