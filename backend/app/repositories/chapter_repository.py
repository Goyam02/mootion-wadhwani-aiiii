from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.models import Chapter, ChapterAsset


def create_chapter(db: Session, chapter: Chapter) -> Chapter:
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


def create_chapter_asset(db: Session, asset: ChapterAsset) -> ChapterAsset:
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def get_chapter(db: Session, chapter_id: str) -> Chapter | None:
    return db.get(Chapter, chapter_id)


def list_chapters_for_class(db: Session, class_id: str) -> list[Chapter]:
    statement = select(Chapter).where(Chapter.class_id == class_id).order_by(Chapter.sequence_number.asc())
    return list(db.scalars(statement).all())


def get_assets_for_chapter(db: Session, chapter_id: str) -> list[ChapterAsset]:
    statement = select(ChapterAsset).where(ChapterAsset.chapter_id == chapter_id).order_by(ChapterAsset.created_at.asc())
    return list(db.scalars(statement).all())


def get_chapter_by_curriculum_node(db: Session, curriculum_id: str, source_node_id: str) -> Chapter | None:
    statement = select(Chapter).where(Chapter.curriculum_id == curriculum_id, Chapter.source_node_id == source_node_id)
    return db.scalar(statement)


def get_asset_by_type(db: Session, chapter_id: str, asset_type: str) -> ChapterAsset | None:
    statement = select(ChapterAsset).where(ChapterAsset.chapter_id == chapter_id, ChapterAsset.asset_type == asset_type)
    return db.scalar(statement)
