from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.models import Assignment, AssignmentRecipient, ChapterAssetGenerationJob


def create_assignment(db: Session, assignment: Assignment) -> Assignment:
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def create_assignment_recipient(db: Session, recipient: AssignmentRecipient) -> AssignmentRecipient:
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient


def create_generation_job(db: Session, job: ChapterAssetGenerationJob) -> ChapterAssetGenerationJob:
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_assignment(db: Session, assignment_id: str) -> Assignment | None:
    return db.get(Assignment, assignment_id)


def get_assignment_recipient(db: Session, assignment_id: str, student_id: str) -> AssignmentRecipient | None:
    statement = select(AssignmentRecipient).where(
        AssignmentRecipient.assignment_id == assignment_id,
        AssignmentRecipient.student_id == student_id,
    )
    return db.scalar(statement)


def get_assignment_jobs(db: Session, assignment_id: str) -> list[ChapterAssetGenerationJob]:
    statement = select(ChapterAssetGenerationJob).where(ChapterAssetGenerationJob.assignment_id == assignment_id)
    return list(db.scalars(statement).all())


def get_queued_generation_job(db: Session) -> ChapterAssetGenerationJob | None:
    statement = (
        select(ChapterAssetGenerationJob)
        .where(ChapterAssetGenerationJob.status == "queued")
        .order_by(ChapterAssetGenerationJob.queued_at.asc())
        .limit(1)
    )
    return db.scalar(statement)


def list_assignments_for_class(db: Session, class_id: str) -> list[Assignment]:
    statement = select(Assignment).where(Assignment.class_id == class_id).order_by(Assignment.created_at.desc())
    return list(db.scalars(statement).all())
