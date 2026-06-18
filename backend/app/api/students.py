from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_student
from app.schemas.auth import UserResponse
from app.schemas.onboarding import (
    ClassSummaryResponse,
    StudentJoinClassRequest,
    StudentJoinClassResponse,
    StudentLanguageRequest,
    StudentLanguageResponse,
)
from app.schemas.student_actions import (
    StudentDoubtCreateRequest,
    StudentDoubtResponse,
    QuotaResponse,
    PlaygroundGenerateRequest,
    PlaygroundGenerateResponse,
    StudentDoubtReplyRequest,
)
from app.services.onboarding_service import join_student_class, list_student_classes, set_student_language
from app.schemas.chapter import ChapterListItem, ChapterResponse
from app.services.chapter_service import list_class_chapters, get_class_chapter
from app.services.student_actions_service import (
    submit_student_doubt,
    get_or_create_quota,
    generate_playground_item,
    list_student_doubts,
    resolve_student_doubt,
    student_reply_to_doubt,
    reopen_student_doubt,
)

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/me", response_model=UserResponse)
def student_me(user=Depends(require_student)):
    return UserResponse(
        user_id=str(user.id),
        login_id=user.login_id,
        role=user.role,
        full_name=user.full_name,
        preferred_language=user.preferred_language,
        onboarding_completed=user.onboarding_completed,
    )


@router.post("/join-class", response_model=StudentJoinClassResponse)
def student_join_class(
    request: StudentJoinClassRequest,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return join_student_class(db, user, request)


@router.get("/classes", response_model=list[ClassSummaryResponse])
def student_classes(user=Depends(require_student), db: Session = Depends(get_db)):
    return list_student_classes(db, user)


@router.post("/language", response_model=StudentLanguageResponse)
def student_language(
    request: StudentLanguageRequest,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return set_student_language(db, user, request)


@router.post("/doubts", response_model=StudentDoubtResponse)
def create_doubt(
    request: StudentDoubtCreateRequest,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return submit_student_doubt(
        db=db,
        student=user,
        class_id=request.class_id,
        query_text=request.query_text,
        topic=request.topic,
        tried_before=request.tried_before,
        attempt_text=request.attempt_text,
    )


@router.get("/quotas", response_model=QuotaResponse)
def get_quotas(
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    q = get_or_create_quota(db, str(user.id))
    return QuotaResponse(
        doubt_videos_used_today=q.doubt_videos_used_today,
        playground_items_used_week=q.playground_items_used_week,
    )


@router.post("/playground/generate", response_model=PlaygroundGenerateResponse)
def generate_playground(
    request: PlaygroundGenerateRequest,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return generate_playground_item(
        db=db,
        student=user,
        topic=request.topic,
        asset_type=request.asset_type,
    )


@router.get("/doubts", response_model=list[StudentDoubtResponse])
def get_student_doubts(
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return list_student_doubts(db, str(user.id))


@router.post("/doubts/{doubt_id}/resolve", response_model=StudentDoubtResponse)
def student_resolve_doubt(
    doubt_id: str,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return resolve_student_doubt(db, str(user.id), doubt_id)


@router.post("/doubts/{doubt_id}/reply", response_model=StudentDoubtResponse)
def student_reply_doubt(
    doubt_id: str,
    request: StudentDoubtReplyRequest,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return student_reply_to_doubt(db, user, doubt_id, request.response_text)


@router.post("/doubts/{doubt_id}/reopen", response_model=StudentDoubtResponse)
def student_reopen_doubt(
    doubt_id: str,
    user=Depends(require_student),
    db: Session = Depends(get_db),
):
    return reopen_student_doubt(db, str(user.id), doubt_id)


@router.get("/classes/{class_id}/chapters", response_model=list[ChapterListItem])
def student_chapters(class_id: str, user=Depends(require_student), db: Session = Depends(get_db)):
    return list_class_chapters(db, user, class_id)


@router.get("/classes/{class_id}/chapters/{chapter_id}", response_model=ChapterResponse)
def student_chapter_detail(class_id: str, chapter_id: str, user=Depends(require_student), db: Session = Depends(get_db)):
    return get_class_chapter(db, user, class_id, chapter_id)


