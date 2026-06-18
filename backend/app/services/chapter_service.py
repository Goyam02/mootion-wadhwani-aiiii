from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.models import Chapter, ChapterAsset, CurriculumPlan, User
from app.repositories.chapter_repository import (
    create_chapter,
    create_chapter_asset,
    get_assets_for_chapter,
    get_chapter,
    get_chapter_by_curriculum_node,
    list_chapters_for_class,
)
from app.repositories.curriculum_repository import get_curriculum_plan
from app.repositories.onboarding_repository import get_teacher_class_membership, get_student_class_membership
from app.schemas.chapter import ChapterAssetResponse, ChapterBootstrapResponse, ChapterListItem, ChapterResponse
from app.services.media_service import resolve_asset_media_url


PLACEHOLDER_ASSETS = [
    {
        "asset_type": "concept_video",
        "provider": "manim",
        "integration_target": "manim_generator",
        "title": "Concept Video",
        "description": "Placeholder for the AI-generated concept video.",
        "payload_json": {
            "pipeline": "manim",
            "reference_lookup": "model_finder",
            "render_mode": "video",
        },
    },
    {
        "asset_type": "simulation",
        "provider": "phet",
        "integration_target": "phet_embed",
        "title": "Interactive Simulation",
        "description": "Placeholder for the PHET-style interactive simulation.",
        "payload_json": {
            "render_mode": "html_embed",
            "simulation_source": "phet",
        },
    },
    {
        "asset_type": "three_d_model",
        "provider": "model_finder",
        "integration_target": "model_finder",
        "title": "3D Model",
        "description": "Placeholder for the AI-selected educational 3D model.",
        "payload_json": {
            "search_strategy": "model_finder",
            "render_mode": "embed",
        },
    },
    {
        "asset_type": "quiz",
        "provider": "quiz_generator",
        "integration_target": "quiz_builder",
        "title": "Quiz",
        "description": "Placeholder for the class quiz activity.",
        "payload_json": {
            "activity_type": "quiz",
            "render_mode": "question_set",
        },
    },
    {
        "asset_type": "explain_it",
        "provider": "mootion_ai",
        "integration_target": "voice_activity",
        "title": "Explain It",
        "description": "Placeholder for the Teach the AI activity.",
        "payload_json": {
            "activity_type": "explain_it",
            "mode": "voice",
        },
    },
    {
        "asset_type": "predict_it",
        "provider": "mootion_ai",
        "integration_target": "voice_activity",
        "title": "Predict It",
        "description": "Placeholder for the predict-observe-explain activity.",
        "payload_json": {
            "activity_type": "predict_it",
            "mode": "voice",
        },
    },
    {
        "asset_type": "spot_it",
        "provider": "mootion_ai",
        "integration_target": "voice_activity",
        "title": "Spot It",
        "description": "Placeholder for the real-world connection activity.",
        "payload_json": {
            "activity_type": "spot_it",
            "mode": "voice",
        },
    },
    {
        "asset_type": "connect_it",
        "provider": "mootion_ai",
        "integration_target": "voice_activity",
        "title": "Connect It",
        "description": "Placeholder for the concept-relationship activity.",
        "payload_json": {
            "activity_type": "connect_it",
            "mode": "voice",
        },
    },
]


def _ensure_teacher_has_access(db: Session, user: User, class_id: str) -> None:
    membership = get_teacher_class_membership(db, str(user.id), class_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _ensure_user_has_access(db: Session, user: User, class_id: str) -> None:
    if user.role == "teacher":
        membership = get_teacher_class_membership(db, str(user.id), class_id)
    elif user.role == "student":
        membership = get_student_class_membership(db, str(user.id), class_id)
    else:
        membership = None
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _chapter_to_response(db: Session, chapter: Chapter) -> ChapterResponse:
    assets = get_assets_for_chapter(db, str(chapter.id))
    return ChapterResponse(
        chapter_id=str(chapter.id),
        class_id=str(chapter.class_id),
        curriculum_id=str(chapter.curriculum_id),
        source_node_id=chapter.source_node_id,
        sequence_number=chapter.sequence_number,
        title=chapter.title,
        status=chapter.status,
        assets=[
            ChapterAssetResponse(
                asset_id=str(asset.id),
                asset_type=asset.asset_type,
                provider=asset.provider,
                integration_target=asset.integration_target,
                title=asset.title,
                description=asset.description,
                generation_status=asset.generation_status,
                external_url=resolve_asset_media_url(asset),
                payload_json=asset.payload_json,
            )
            for asset in assets
        ],
    )


def _create_placeholder_asset(db: Session, chapter: Chapter, asset_config: dict) -> None:
    create_chapter_asset(
        db,
        ChapterAsset(
            chapter_id=chapter.id,
            asset_type=asset_config["asset_type"],
            provider=asset_config["provider"],
            integration_target=asset_config["integration_target"],
            title=asset_config["title"],
            description=asset_config["description"],
            payload_json=asset_config["payload_json"] | {
                "placeholder": True,
                "chapter_id": str(chapter.id),
                "asset_type": asset_config["asset_type"],
                "provider": asset_config["provider"],
                "integration_target": asset_config["integration_target"],
            },
            generation_status="placeholder",
            external_url=None,
        ),
    )


def bootstrap_chapters_from_curriculum(db: Session, user: User, class_id: str, curriculum_id: str) -> ChapterBootstrapResponse:
    import uuid
    from sqlalchemy import select

    _ensure_teacher_has_access(db, user, class_id)

    curriculum = get_curriculum_plan(db, curriculum_id)
    if not curriculum or str(curriculum.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum not found")

    curriculum_data = curriculum.curriculum_data or {}
    root = curriculum_data.get("root") or {}
    children = root.get("children", []) or []

    # Batch retrieve existing chapters for this curriculum to avoid SELECT in a loop
    existing_chapters = db.scalars(
        select(Chapter).where(Chapter.curriculum_id == curriculum.id)
    ).all()
    existing_node_ids = {c.source_node_id for c in existing_chapters if c.source_node_id}

    created = 0
    for index, child in enumerate(children):
        node_id = child.get("id")
        if node_id in existing_node_ids:
            continue

        chapter_id = uuid.uuid4()
        chapter = Chapter(
            id=chapter_id,
            class_id=curriculum.class_id,
            curriculum_id=curriculum.id,
            source_node_id=node_id,
            sequence_number=index,
            title=child.get("title", f"Chapter {index + 1}"),
            status="unset",
        )
        db.add(chapter)

        for asset_config in PLACEHOLDER_ASSETS:
            asset = ChapterAsset(
                chapter_id=chapter_id,
                asset_type=asset_config["asset_type"],
                provider=asset_config["provider"],
                integration_target=asset_config["integration_target"],
                title=asset_config["title"],
                description=asset_config["description"],
                payload_json=asset_config["payload_json"] | {
                    "placeholder": True,
                    "chapter_id": str(chapter_id),
                    "asset_type": asset_config["asset_type"],
                    "provider": asset_config["provider"],
                    "integration_target": asset_config["integration_target"],
                },
                generation_status="placeholder",
                external_url=None,
            )
            db.add(asset)

        created += 1

    if created > 0:
        db.commit()

    return ChapterBootstrapResponse(
        class_id=str(class_id),
        curriculum_id=str(curriculum_id),
        created_chapters=created,
    )


def list_class_chapters(db: Session, user: User, class_id: str) -> list[ChapterListItem]:
    from sqlalchemy import func
    _ensure_user_has_access(db, user, class_id)
    chapters = list_chapters_for_class(db, class_id)
    if not chapters:
        return []

    chapter_ids = [chapter.id for chapter in chapters]

    # Batch retrieve asset counts using group_by
    asset_counts = dict(
        db.query(ChapterAsset.chapter_id, func.count(ChapterAsset.id))
        .filter(ChapterAsset.chapter_id.in_(chapter_ids))
        .group_by(ChapterAsset.chapter_id)
        .all()
    )

    return [
        ChapterListItem(
            chapter_id=str(chapter.id),
            class_id=str(chapter.class_id),
            sequence_number=chapter.sequence_number,
            title=chapter.title,
            status=chapter.status,
            asset_count=asset_counts.get(chapter.id, 0),
        )
        for chapter in chapters
    ]



def get_class_chapter(db: Session, user: User, class_id: str, chapter_id: str) -> ChapterResponse:
    _ensure_user_has_access(db, user, class_id)
    chapter = get_chapter(db, chapter_id)
    if not chapter or str(chapter.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return _chapter_to_response(db, chapter)
