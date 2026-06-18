from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher, require_teacher_or_student
from app.schemas.chapter import ChapterBootstrapResponse, ChapterListItem, ChapterResponse
from app.services.chapter_service import bootstrap_chapters_from_curriculum, get_class_chapter, list_class_chapters


router = APIRouter(prefix="/teachers/classes/{class_id}/chapters", tags=["chapters"])


class ChapterBootstrapRequest(BaseModel):
    curriculum_id: str


@router.post("/bootstrap", response_model=ChapterBootstrapResponse)
def bootstrap_chapters(
    class_id: str,
    request: ChapterBootstrapRequest,
    user=Depends(require_teacher),
    db: Session = Depends(get_db),
): 
    return bootstrap_chapters_from_curriculum(db, user, class_id, request.curriculum_id)


@router.get("", response_model=list[ChapterListItem])
def chapters(class_id: str, user=Depends(require_teacher_or_student), db: Session = Depends(get_db)):
    return list_class_chapters(db, user, class_id)


@router.get("/{chapter_id}", response_model=ChapterResponse)
def chapter_detail(class_id: str, chapter_id: str, user=Depends(require_teacher_or_student), db: Session = Depends(get_db)):
    return get_class_chapter(db, user, class_id, chapter_id)
