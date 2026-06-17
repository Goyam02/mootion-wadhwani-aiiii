from __future__ import annotations

from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.models import Assignment, AssignmentRecipient, Chapter, ChapterAsset, ChapterAssetGenerationJob, User
from app.repositories.assignment_repository import (
    create_assignment,
    create_assignment_recipient,
    create_generation_job,
    get_assignment,
    get_assignment_jobs,
    get_assignment_recipient,
    list_assignments_for_class,
    list_assignments_for_student,
)
from app.repositories.chapter_repository import get_assets_for_chapter, get_chapter
from app.repositories.onboarding_repository import get_student_class_membership, get_student_ids_for_class, get_teacher_class_membership
from app.schemas.assignment import (
    AssignmentCreateRequest,
    AssignmentJobResponse,
    AssignmentListItem,
    AssignmentRecipientResponse,
    AssignmentResponse,
    StudentAssignmentListItem,
    StudentAssignmentResponse,
)
from app.services.media_queue import enqueue_media_generation_job
from app.services.media_service import store_generated_manim_video
from app.services.model_finder import find_model, query_llm
import json


GENERATIONABLE_PROVIDERS = {"manim", "model_finder", "quiz_generator"}
ALLOWED_ASSIGNMENT_TYPES = {
    "video",
    "simulation",
    "model",
    "quiz",
    "explain_ai",
    "predict_ai",
    "spot_it",
    "connect_it",
}
ASSIGNMENT_TYPE_TO_ASSET_TYPE = {
    "video": "concept_video",
    "simulation": "simulation",
    "model": "three_d_model",
    "quiz": "quiz",
    "explain_ai": "explain_it",
    "predict_ai": "predict_it",
    "spot_it": "spot_it",
    "connect_it": "connect_it",
}


def _ensure_teacher_has_access(db: Session, user: User, class_id: str) -> None:
    membership = get_teacher_class_membership(db, str(user.id), class_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _chapter_asset_to_job_response(job: ChapterAssetGenerationJob) -> AssignmentJobResponse:
    return AssignmentJobResponse(
        job_id=str(job.id),
        asset_id=str(job.chapter_asset_id),
        asset_type=job.asset_type,
        provider=job.provider,
        integration_target=job.integration_target,
        status=job.status,
        result_json=job.result_json,
        error_message=job.error_message,
    )


def _assignment_to_response(db: Session, assignment: Assignment) -> AssignmentResponse:
    recipients = [
        AssignmentRecipientResponse(student_id=str(recipient.student_id))
        for recipient in db.query(AssignmentRecipient).filter(AssignmentRecipient.assignment_id == assignment.id).all()
    ]
    jobs = [_chapter_asset_to_job_response(job) for job in get_assignment_jobs(db, str(assignment.id))]
    return AssignmentResponse(
        assignment_id=str(assignment.id),
        class_id=str(assignment.class_id),
        chapter_id=str(assignment.chapter_id),
        assignment_type=assignment.assignment_type,
        title=assignment.title,
        instructions=assignment.instructions,
        content_json=assignment.content_json,
        status=assignment.status,
        recipients=recipients,
        jobs=jobs,
    )


def _create_generation_jobs(db: Session, assignment: Assignment, chapter: Chapter) -> int:
    created = 0
    assets = get_assets_for_chapter(db, str(chapter.id))
    expected_asset_type = ASSIGNMENT_TYPE_TO_ASSET_TYPE.get(assignment.assignment_type)

    for asset in assets:
        if expected_asset_type and asset.asset_type != expected_asset_type:
            continue
        if asset.provider not in GENERATIONABLE_PROVIDERS:
            continue

        existing_job = (
            db.query(ChapterAssetGenerationJob)
            .filter(
                ChapterAssetGenerationJob.assignment_id == assignment.id,
                ChapterAssetGenerationJob.chapter_asset_id == asset.id,
            )
            .one_or_none()
        )
        if existing_job:
            continue

        payload_json = {
            "assignment_id": str(assignment.id),
            "class_id": str(assignment.class_id),
            "chapter_id": str(chapter.id),
            "assignment_type": assignment.assignment_type,
            "chapter_title": chapter.title,
            "assignment_title": assignment.title,
            "instructions": assignment.instructions,
            "asset_type": asset.asset_type,
            "provider": asset.provider,
            "integration_target": asset.integration_target,
            "payload_json": asset.payload_json,
        }

        generation_job = create_generation_job(
            db,
            ChapterAssetGenerationJob(
                assignment_id=assignment.id,
                chapter_asset_id=asset.id,
                asset_type=asset.asset_type,
                provider=asset.provider,
                integration_target=asset.integration_target,
                status="queued",
                payload_json=payload_json,
            ),
        )
        asset.generation_status = "queued"
        try:
            enqueue_media_generation_job(str(generation_job.id))
        except Exception:
            # The DB row is the source of truth; the queue can be rebuilt on startup.
            pass
        created += 1

    db.commit()
    return created


def _refresh_assignment_status(db: Session, assignment_id: str) -> None:
    jobs = get_assignment_jobs(db, assignment_id)
    if not jobs:
        assignment = get_assignment(db, assignment_id)
        if assignment:
            assignment.status = "ready"
            db.commit()
        return

    statuses = {job.status for job in jobs}
    assignment = get_assignment(db, assignment_id)
    if not assignment:
        return

    if statuses <= {"ready"}:
        assignment.status = "ready"
    elif "failed" in statuses:
        assignment.status = "failed"
    elif "processing" in statuses:
        assignment.status = "processing"
    else:
        assignment.status = "queued"
    db.commit()


def create_teacher_assignment(
    db: Session,
    user: User,
    class_id: str,
    request: AssignmentCreateRequest,
) -> AssignmentResponse:
    _ensure_teacher_has_access(db, user, class_id)

    if request.assignment_type not in ALLOWED_ASSIGNMENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid assignment type")

    chapter = get_chapter(db, request.chapter_id)
    if not chapter or str(chapter.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    recipient_ids = get_student_ids_for_class(db, class_id)

    content_json = {
        "placeholder": True,
        "assignment_type": request.assignment_type,
        "activity": request.assignment_type,
        "chapter_id": str(chapter.id),
        "chapter_title": chapter.title,
    }

    assignment = create_assignment(
        db,
        Assignment(
            class_id=chapter.class_id,
            chapter_id=chapter.id,
            created_by_teacher_id=user.id,
            assignment_type=request.assignment_type,
            title=request.title,
            instructions=request.instructions,
            content_json=content_json,
            status="queued",
        ),
    )

    for student_id in recipient_ids:
        if not get_assignment_recipient(db, str(assignment.id), student_id):
            create_assignment_recipient(
                db,
                AssignmentRecipient(
                    assignment_id=assignment.id,
                    student_id=student_id,
                ),
            )

    _create_generation_jobs(db, assignment, chapter)
    if not get_assignment_jobs(db, str(assignment.id)):
        assignment.status = "ready"
        db.commit()
    _refresh_assignment_status(db, str(assignment.id))
    db.refresh(assignment)
    return _assignment_to_response(db, assignment)


def list_teacher_assignments(db: Session, user: User, class_id: str) -> list[AssignmentListItem]:
    from sqlalchemy import func
    _ensure_teacher_has_access(db, user, class_id)
    assignments = list_assignments_for_class(db, class_id)
    if not assignments:
        return []

    assignment_ids = [assignment.id for assignment in assignments]

    # Batch retrieve job and recipient counts using group_by
    job_counts = dict(
        db.query(ChapterAssetGenerationJob.assignment_id, func.count(ChapterAssetGenerationJob.id))
        .filter(ChapterAssetGenerationJob.assignment_id.in_(assignment_ids))
        .group_by(ChapterAssetGenerationJob.assignment_id)
        .all()
    )

    recipient_counts = dict(
        db.query(AssignmentRecipient.assignment_id, func.count(AssignmentRecipient.id))
        .filter(AssignmentRecipient.assignment_id.in_(assignment_ids))
        .group_by(AssignmentRecipient.assignment_id)
        .all()
    )

    response: list[AssignmentListItem] = []
    for assignment in assignments:
        response.append(
            AssignmentListItem(
                assignment_id=str(assignment.id),
                class_id=str(assignment.class_id),
                chapter_id=str(assignment.chapter_id),
                assignment_type=assignment.assignment_type,
                title=assignment.title,
                status=assignment.status,
                recipient_count=recipient_counts.get(assignment.id, 0),
                job_count=job_counts.get(assignment.id, 0),
            )
        )
    return response


def get_teacher_assignment(db: Session, user: User, class_id: str, assignment_id: str) -> AssignmentResponse:
    _ensure_teacher_has_access(db, user, class_id)
    assignment = get_assignment(db, assignment_id)
    if not assignment or str(assignment.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return _assignment_to_response(db, assignment)


def _student_assignment_to_response(db: Session, assignment: Assignment) -> StudentAssignmentResponse:
    jobs = [_chapter_asset_to_job_response(job) for job in get_assignment_jobs(db, str(assignment.id))]
    return StudentAssignmentResponse(
        assignment_id=str(assignment.id),
        class_id=str(assignment.class_id),
        chapter_id=str(assignment.chapter_id),
        assignment_type=assignment.assignment_type,
        title=assignment.title,
        instructions=assignment.instructions,
        content_json=assignment.content_json,
        status=assignment.status,
        jobs=jobs,
    )


def list_student_assignments(db: Session, user: User, class_id: str) -> list[StudentAssignmentListItem]:
    from sqlalchemy import func
    membership = get_student_class_membership(db, str(user.id), class_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Direct DB filtering by class_id
    assignments = db.query(Assignment).filter(Assignment.class_id == class_id).order_by(Assignment.created_at.desc()).all()
    if not assignments:
        return []

    assignment_ids = [assignment.id for assignment in assignments]

    # Batch retrieve job counts
    job_counts = dict(
        db.query(ChapterAssetGenerationJob.assignment_id, func.count(ChapterAssetGenerationJob.id))
        .filter(ChapterAssetGenerationJob.assignment_id.in_(assignment_ids))
        .group_by(ChapterAssetGenerationJob.assignment_id)
        .all()
    )

    return [
        StudentAssignmentListItem(
            assignment_id=str(assignment.id),
            class_id=str(assignment.class_id),
            chapter_id=str(assignment.chapter_id),
            assignment_type=assignment.assignment_type,
            title=assignment.title,
            status=assignment.status,
            job_count=job_counts.get(assignment.id, 0),
        )
        for assignment in assignments
    ]



def get_student_assignment(db: Session, user: User, class_id: str, assignment_id: str) -> StudentAssignmentResponse:
    membership = get_student_class_membership(db, str(user.id), class_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    assignment = get_assignment(db, assignment_id)
    if not assignment or str(assignment.class_id) != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    return _student_assignment_to_response(db, assignment)


def _run_manim_generation(asset: ChapterAsset, payload_json: dict) -> dict[str, object]:
    response = httpx.post(
        settings.manim_service_url,
        params={
            "topic": payload_json.get("chapter_title") or asset.title,
            "level": "school",
            "persona": "teacher",
            "face_enabled": False,
        },
        timeout=300.0,
    )
    response.raise_for_status()
    return response.json()


def _run_model_finder_generation(asset: ChapterAsset, payload_json: dict) -> dict[str, object]:
    query = payload_json.get("chapter_title") or asset.title
    return find_model(str(query))


def _apply_generation_result(db: Session, job: ChapterAssetGenerationJob, result: dict[str, object], status: str) -> None:
    asset = db.get(ChapterAsset, job.chapter_asset_id)
    if not asset:
        raise RuntimeError("Chapter asset not found")

    job.result_json = result
    job.status = status
    job.finished_at = datetime.now(timezone.utc)

    if status == "ready":
        asset.generation_status = "ready"
        asset.last_generated_at = datetime.now(timezone.utc)
        asset.payload_json = {**asset.payload_json, "generated": True, "result": result}

        if job.provider == "manim":
            video_id = str(result.get("video_id") or "").strip()
            if not video_id:
                raise RuntimeError("Manim generation did not return a video_id")
            storage_result = store_generated_manim_video(asset, str(job.id), video_id)
            job.result_json = {**result, **storage_result}
            asset.payload_json = {**asset.payload_json, "storage": storage_result}
        elif job.provider == "model_finder":
            asset.external_url = str(result.get("embedUrl") or result.get("viewerUrl") or "") or None
        elif job.provider == "quiz_generator":
            asset.payload_json = {**asset.payload_json, "quiz": result.get("questions", [])}
    else:
        asset.generation_status = "failed"
        asset.payload_json = {**asset.payload_json, "generated": False, "result": result}

    db.commit()


def _run_quiz_generation(asset: ChapterAsset, payload_json: dict) -> dict[str, object]:
    topic = payload_json.get("chapter_title") or asset.title
    prompt = f"""
    You are a science teacher. Generate a quiz containing exactly 3 multiple-choice questions for school students on the topic: "{topic}".
    For each question, provide 4 options and specify the index of the correct option (0-based).
    Return ONLY a valid JSON array of objects with the following keys:
    - "question" (string)
    - "options" (array of 4 strings)
    - "correctAnswer" (integer, 0 to 3)

    Do not include markdown tags like ```json or any other text. Output exactly the raw JSON array.
    """
    try:
        res = query_llm(prompt)
        text = res.get("response", "").strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        questions = json.loads(text)
        return {"questions": questions}
    except Exception as e:
        return {"error": f"Failed to generate quiz: {str(e)}"}


def process_generation_job(db: Session, job: ChapterAssetGenerationJob) -> None:
    asset = db.get(ChapterAsset, job.chapter_asset_id)
    if not asset:
        job.status = "failed"
        job.error_message = "Chapter asset not found"
        job.finished_at = datetime.now(timezone.utc)
        db.commit()
        return

    job.status = "processing"
    job.started_at = datetime.now(timezone.utc)
    job.attempt_count += 1
    db.commit()

    try:
        if job.provider == "manim":
            result = _run_manim_generation(asset, job.payload_json)
        elif job.provider == "model_finder":
            result = _run_model_finder_generation(asset, job.payload_json)
        elif job.provider == "quiz_generator":
            result = _run_quiz_generation(asset, job.payload_json)
        else:
            raise RuntimeError(f"Unsupported provider: {job.provider}")

        if result.get("error"):
            job.error_message = str(result.get("error"))
            _apply_generation_result(db, job, result, "failed")
        elif result.get("message") in {"No models found.", "No suitable model found."}:
            job.error_message = str(result.get("message"))
            _apply_generation_result(db, job, result, "failed")
        else:
            _apply_generation_result(db, job, result, "ready")
    except Exception as exc:
        job.error_message = str(exc)
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        asset.generation_status = "failed"
        asset.payload_json = {**asset.payload_json, "generated": False, "error": str(exc)}
        db.commit()
