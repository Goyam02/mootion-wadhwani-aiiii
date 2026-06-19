from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.models import Chapter, ChapterAsset, ChapterTopic, ChapterTopicAsset, CurriculumPlan, User
from app.repositories.chapter_repository import (
    create_chapter,
    create_chapter_asset,
    create_chapter_topic,
    create_chapter_topic_asset,
    get_assets_for_topic,
    get_assets_for_chapter,
    get_chapter,
    get_chapter_by_curriculum_node,
    get_topic,
    get_topic_asset_by_type,
    get_topics_for_chapter,
    list_chapters_for_class,
)
from app.repositories.curriculum_repository import get_curriculum_plan
from app.repositories.onboarding_repository import get_teacher_class_membership, get_student_class_membership
from app.schemas.chapter import (
    ChapterAssetGenerateRequest,
    ChapterAssetGenerateResponse,
    ChapterAssetResponse,
    ChapterBootstrapResponse,
    ChapterListItem,
    ChapterResponse,
    ChapterTopicAssetGenerateRequest,
    ChapterTopicAssetGenerateResponse,
    ChapterTopicAssetResponse,
    ChapterTopicResponse,
    SubtopicResponse
)
from app.services.assignment_service import _run_manim_generation, _run_model_finder_generation
from app.services.media_service import resolve_asset_media_url
from app.services.media_service import store_generated_manim_video
from app.simulation_engine.pipeline import SimulationPipeline
from app.core.models import SimulationRecord


DIRECT_GENERATION_ASSET_TYPES = {"concept_video", "simulation", "three_d_model"}
GENERATION_ESTIMATES_SECONDS = {
    "concept_video": 180,
    "simulation": 75,
    "three_d_model": 45,
}


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


TOPIC_PLACEHOLDER_ASSETS = [
    {
        "asset_type": "concept_video",
        "provider": "manim",
        "integration_target": "manim_generator",
        "title": "Concept Video",
        "description": "AI-generated explainer video for this topic.",
        "payload_json": {
            "pipeline": "manim",
            "reference_lookup": "model_finder",
            "render_mode": "video",
        },
    },
    {
        "asset_type": "simulation",
        "provider": "simulation",
        "integration_target": "simulation_engine",
        "title": "Interactive Simulation",
        "description": "Interactive simulation for this topic.",
        "payload_json": {
            "render_mode": "html_embed",
            "simulation_source": "simulation_engine",
        },
    },
    {
        "asset_type": "three_d_model",
        "provider": "model_finder",
        "integration_target": "model_finder",
        "title": "3D Model",
        "description": "Interactive 3D model for this topic.",
        "payload_json": {
            "search_strategy": "model_finder",
            "render_mode": "embed",
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
    topics = get_topics_for_chapter(db, str(chapter.id))

    subtopics = []
    if chapter.source_node_id and chapter.curriculum_id:
        curriculum = get_curriculum_plan(db, str(chapter.curriculum_id))
        if curriculum and curriculum.curriculum_data:
            root = curriculum.curriculum_data.get("root") or {}
            
            def find_node(node: dict, target_id: str) -> dict | None:
                if node.get("id") == target_id:
                    return node
                for child in node.get("children", []) or []:
                    res = find_node(child, target_id)
                    if res:
                        return res
                return None

            chapter_node = find_node(root, chapter.source_node_id)
            if chapter_node:
                children = chapter_node.get("children", []) or []
                for index, child in enumerate(children):
                    subtopics.append(
                        SubtopicResponse(
                            subtopic_id=child.get("id") or "",
                            title=child.get("title") or "",
                            order=child.get("order") if child.get("order") is not None else index,
                            kind=child.get("kind") or "topic",
                            metadata=child.get("metadata") or {},
                        )
                    )

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
        topics=[_topic_to_response(db, topic) for topic in topics],
        subtopics=subtopics,
    )


def _topic_asset_to_response(asset: ChapterTopicAsset) -> ChapterTopicAssetResponse:
    return ChapterTopicAssetResponse(
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


def _topic_to_response(db: Session, topic: ChapterTopic) -> ChapterTopicResponse:
    assets = get_assets_for_topic(db, str(topic.id))
    return ChapterTopicResponse(
        topic_id=str(topic.id),
        chapter_id=str(topic.chapter_id),
        source_node_id=topic.source_node_id,
        sequence_number=topic.sequence_number,
        title=topic.title,
        source_text=topic.source_text,
        status=topic.status,
        assets=[_topic_asset_to_response(asset) for asset in assets],
    )


def _asset_to_response(asset: ChapterAsset) -> ChapterAssetResponse:
    return ChapterAssetResponse(
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


def _generation_estimate_seconds(asset_type: str) -> int:
    return GENERATION_ESTIMATES_SECONDS.get(asset_type, 60)


def _persist_simulation_result(db: Session, result, prompt: str | None = None) -> None:
    record = db.query(SimulationRecord).filter(SimulationRecord.simulation_id == result.simulation_id).one_or_none()
    if record:
        return

    record = SimulationRecord(
        simulation_id=result.simulation_id,
        prompt=prompt,
        spec_json=json.loads(result.spec.json()) if result.spec else None,
        html=result.html,
        validation_json=json.loads(result.validation.json()) if result.validation else None,
        quality_score=int(result.quality_score * 100),
        assessments_json=[ap.dict() for ap in result.assessments],
        phase=result.phase.value,
        error=result.error,
        duration_ms=int(result.duration_ms),
    )
    db.add(record)
    db.commit()


def _generate_simulation_result(prompt: str):
    pipeline = SimulationPipeline()
    return pipeline.run(prompt)


def _apply_direct_generation_result(db: Session, asset: ChapterAsset, result: dict | object, prompt: str) -> None:
    generated_at = datetime.now(timezone.utc)

    if asset.asset_type == "concept_video":
        video_id = str(result.get("video_id") or "").strip() if isinstance(result, dict) else ""
        if not video_id:
            raise RuntimeError("Manim generation did not return a video_id")
        storage_result = store_generated_manim_video(asset, f"direct-{uuid.uuid4()}", video_id)
        asset.payload_json = {
            **asset.payload_json,
            "placeholder": False,
            "generated": True,
            "result": result,
            "storage": storage_result,
        }
        asset.generation_status = "ready"
        asset.last_generated_at = generated_at
        return

    if asset.asset_type == "three_d_model":
        embed_url = ""
        if isinstance(result, dict):
            embed_url = str(result.get("embedUrl") or result.get("viewerUrl") or "")
        asset.external_url = embed_url or None
        asset.payload_json = {**asset.payload_json, "placeholder": False, "generated": True, "result": result}
        asset.generation_status = "ready"
        asset.last_generated_at = generated_at
        return

    if asset.asset_type == "simulation":
        simulation_id = getattr(result, "simulation_id", None)
        if not simulation_id:
            raise RuntimeError("Simulation generation did not return a simulation_id")
        _persist_simulation_result(db, result, prompt=prompt)
        asset.external_url = f"{settings.backend_public_url.rstrip('/')}/simulations/{simulation_id}/html"
        asset.payload_json = {
            **asset.payload_json,
            "placeholder": False,
            "generated": True,
            "result": {
                "simulation_id": simulation_id,
                "phase": getattr(result.phase, "value", None),
                "quality_score": getattr(result, "quality_score", None),
                "error": getattr(result, "error", None),
            },
        }
        asset.generation_status = "ready"
        asset.last_generated_at = generated_at
        return

    if asset.asset_type == "quiz":
        questions = result.get("questions", []) if isinstance(result, dict) else []
        asset.payload_json = {**asset.payload_json, "placeholder": False, "generated": True, "quiz": questions, "result": result}
        asset.generation_status = "ready"
        asset.last_generated_at = generated_at
        return

    raise RuntimeError(f"Unsupported provider: {asset.provider}")


def generate_chapter_asset(
    db: Session,
    user: User,
    class_id: str,
    chapter_id: str,
    asset_id: str,
    request: ChapterAssetGenerateRequest,
) -> ChapterAssetGenerateResponse:
    _ensure_teacher_has_access(db, user, class_id)

    chapter = get_chapter(db, chapter_id)
    if not chapter or str(chapter.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    asset = db.get(ChapterAsset, asset_id)
    if not asset or str(asset.chapter_id) != chapter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter asset not found")

    if asset.asset_type not in DIRECT_GENERATION_ASSET_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This asset type cannot be generated from the chapter workspace.")

    if asset.generation_status in {"queued", "processing"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Generation is already in progress for this asset.")

    prompt = (request.instructions or "").strip()
    generation_prompt = chapter.title
    payload_json = {
        **(asset.payload_json or {}),
        "chapter_id": str(chapter.id),
        "chapter_title": chapter.title,
        "asset_type": asset.asset_type,
        "provider": asset.provider,
        "integration_target": asset.integration_target,
        "instructions": prompt,
        "generation_prompt": generation_prompt,
        "teacher_notes": prompt,
    }

    asset.generation_status = "processing"
    asset.payload_json = {**asset.payload_json, "generation_prompt": generation_prompt, "teacher_notes": prompt, "generation_status": "processing"}
    db.commit()

    try:
        if asset.asset_type == "concept_video":
            result = _run_manim_generation(asset, payload_json)
        elif asset.asset_type == "three_d_model":
            result = _run_model_finder_generation(asset, payload_json)
        elif asset.asset_type == "simulation":
            sim_prompt = f"Teach me {chapter.title}. {prompt}".strip()
            result = _generate_simulation_result(sim_prompt)
        elif asset.asset_type == "quiz":
            from app.services.assignment_service import _run_quiz_generation

            result = _run_quiz_generation(asset, payload_json)
        else:
            raise RuntimeError(f"Unsupported provider: {asset.provider}")

        if asset.asset_type == "three_d_model" and isinstance(result, dict):
            if result.get("error") or result.get("message") in {"No models found.", "No suitable model found."}:
                raise RuntimeError(str(result.get("error") or result.get("message") or "No model found."))

        if asset.asset_type == "simulation":
            if getattr(result, "error", None) or getattr(getattr(result, "phase", None), "value", None) != "completed" or not getattr(result, "html", ""):
                raise RuntimeError(str(getattr(result, "error", None) or "Simulation generation did not complete successfully."))

        if asset.asset_type == "quiz" and isinstance(result, dict) and result.get("error"):
            raise RuntimeError(str(result.get("error")))

        _apply_direct_generation_result(db, asset, result, prompt=generation_prompt)
        db.commit()
        print("[media-worker] Asset update committed to DB", flush=True)
    except Exception as exc:
        asset.generation_status = "failed"
        asset.payload_json = {**asset.payload_json, "generated": False, "error": str(exc)}
        db.commit()
        print("[media-worker] Asset update committed to DB", flush=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    db.refresh(asset)
    return ChapterAssetGenerateResponse(
        chapter_id=str(chapter.id),
        estimated_seconds=_generation_estimate_seconds(asset.asset_type),
        asset=_asset_to_response(asset),
    )


def _topic_asset_to_direct_response(asset: ChapterTopicAsset) -> ChapterTopicAssetResponse:
    return ChapterTopicAssetResponse(
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


def generate_topic_asset(
    db: Session,
    user: User,
    class_id: str,
    chapter_id: str,
    topic_id: str,
    asset_id: str,
    request: ChapterTopicAssetGenerateRequest,
) -> ChapterTopicAssetGenerateResponse:
    _ensure_teacher_has_access(db, user, class_id)

    chapter = get_chapter(db, chapter_id)
    if not chapter or str(chapter.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    topic = get_topic(db, topic_id)
    if not topic or str(topic.chapter_id) != chapter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    asset = db.get(ChapterTopicAsset, asset_id)
    if not asset or str(asset.topic_id) != topic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic asset not found")

    if asset.asset_type not in DIRECT_GENERATION_ASSET_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This asset type cannot be generated from the topic workspace.")

    if asset.generation_status in {"queued", "processing"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Generation is already in progress for this asset.")

    notes = (request.instructions or "").strip()
    payload_json = {
        **(asset.payload_json or {}),
        "chapter_id": str(chapter.id),
        "chapter_title": chapter.title,
        "topic_id": str(topic.id),
        "topic_title": topic.title,
        "source_text": topic.source_text,
        "asset_type": asset.asset_type,
        "provider": asset.provider,
        "integration_target": asset.integration_target,
        "generation_prompt": topic.title,
        "instructions": notes,
        "teacher_notes": notes,
    }

    asset.generation_status = "processing"
    asset.payload_json = {**asset.payload_json, "generation_prompt": topic.title, "teacher_notes": notes, "generation_status": "processing", "placeholder": True}
    db.commit()

    try:
        if asset.asset_type == "concept_video":
            result = _run_manim_generation(asset, payload_json)
        elif asset.asset_type == "three_d_model":
            result = _run_model_finder_generation(asset, payload_json)
        elif asset.asset_type == "simulation":
            sim_prompt = f"Teach me {topic.title}. {notes}".strip()
            result = _generate_simulation_result(sim_prompt)
        else:
            raise RuntimeError(f"Unsupported asset type: {asset.asset_type}")

        if asset.asset_type == "three_d_model" and isinstance(result, dict):
            if result.get("error") or result.get("message") in {"No models found.", "No suitable model found."}:
                raise RuntimeError(str(result.get("error") or result.get("message") or "No model found."))

        if asset.asset_type == "simulation":
            if getattr(result, "error", None) or getattr(getattr(result, "phase", None), "value", None) != "completed" or not getattr(result, "html", ""):
                raise RuntimeError(str(getattr(result, "error", None) or "Simulation generation did not complete successfully."))

        _apply_direct_generation_result(db, asset, result, prompt=topic.title)
        db.commit()
    except Exception as exc:
        asset.generation_status = "failed"
        asset.payload_json = {**asset.payload_json, "generated": False, "error": str(exc)}
        db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    db.refresh(asset)
    return ChapterTopicAssetGenerateResponse(
        chapter_id=str(chapter.id),
        topic_id=str(topic.id),
        estimated_seconds=_generation_estimate_seconds(asset.asset_type),
        asset=_topic_asset_to_direct_response(asset),
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


def _create_placeholder_topic_asset(db: Session, chapter: Chapter, topic: ChapterTopic, asset_config: dict) -> None:
    create_chapter_topic_asset(
        db,
        ChapterTopicAsset(
            topic_id=topic.id,
            asset_type=asset_config["asset_type"],
            provider=asset_config["provider"],
            integration_target=asset_config["integration_target"],
            title=asset_config["title"],
            description=asset_config["description"],
            payload_json=asset_config["payload_json"] | {
                "placeholder": True,
                "chapter_id": str(chapter.id),
                "chapter_title": chapter.title,
                "topic_id": str(topic.id),
                "topic_title": topic.title,
                "topic_source_text": topic.source_text,
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

    # Batch retrieve existing chapters/topics for this curriculum to avoid SELECT in a loop
    existing_chapters = db.scalars(
        select(Chapter).where(Chapter.curriculum_id == curriculum.id)
    ).all()
    existing_node_ids = {c.source_node_id for c in existing_chapters if c.source_node_id}
    existing_topics = db.query(ChapterTopic).join(Chapter, ChapterTopic.chapter_id == Chapter.id).filter(Chapter.curriculum_id == curriculum.id).all()

    created = 0
    created_topics = 0
    for index, child in enumerate(children):
        node_id = child.get("id")
        if node_id in existing_node_ids:
            chapter = next((c for c in existing_chapters if c.source_node_id == node_id), None)
            if not chapter:
                continue
        else:
            chapter_id = uuid.uuid4()
            chapter = Chapter(
                id=chapter_id,
                class_id=curriculum.class_id,
                curriculum_id=curriculum.id,
                source_node_id=node_id,
                sequence_number=index + 1,
                title=child.get("title", f"Chapter {index + 1}"),
                status="unset",
            )
            db.add(chapter)
            created += 1

        topic_nodes = child.get("children", []) or []
        for topic_index, topic_node in enumerate(topic_nodes):
            topic_node_id = topic_node.get("id")
            topic = next((t for t in existing_topics if t.source_node_id == topic_node_id), None)

            if not topic:
                topic = ChapterTopic(
                    id=uuid.uuid4(),
                    chapter_id=chapter.id,
                    source_node_id=topic_node_id,
                    sequence_number=topic_index + 1,
                    title=topic_node.get("title", f"Topic {topic_index + 1}"),
                    source_text=topic_node.get("metadata", {}).get("source_text") or topic_node.get("title"),
                    status="unset",
                )
                db.add(topic)
                db.flush()
                existing_topics.append(topic)
                created_topics += 1

            for asset_config in TOPIC_PLACEHOLDER_ASSETS:
                if get_topic_asset_by_type(db, str(topic.id), asset_config["asset_type"]):
                    continue
                _create_placeholder_topic_asset(db, chapter, topic, asset_config)

    if created > 0 or created_topics > 0:
        db.commit()

    return ChapterBootstrapResponse(
        class_id=str(class_id),
        curriculum_id=str(curriculum_id),
        created_chapters=created,
        created_topics=created_topics,
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
    topic_counts = dict(
        db.query(ChapterTopic.chapter_id, func.count(ChapterTopic.id))
        .filter(ChapterTopic.chapter_id.in_(chapter_ids))
        .group_by(ChapterTopic.chapter_id)
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
            topic_count=topic_counts.get(chapter.id, 0),
        )
        for chapter in chapters
    ]



def get_class_chapter(db: Session, user: User, class_id: str, chapter_id: str) -> ChapterResponse:
    _ensure_user_has_access(db, user, class_id)
    chapter = get_chapter(db, chapter_id)
    if not chapter or str(chapter.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return _chapter_to_response(db, chapter)
