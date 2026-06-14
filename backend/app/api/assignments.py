from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher
from app.schemas.assignment import AssignmentCreateRequest, AssignmentListItem, AssignmentResponse
from app.services.assignment_service import create_teacher_assignment, get_teacher_assignment, list_teacher_assignments


router = APIRouter(prefix="/teachers/classes/{class_id}/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentResponse)
def create_assignment(
    class_id: str,
    request: AssignmentCreateRequest,
    user=Depends(require_teacher),
    db: Session = Depends(get_db),
):
    return create_teacher_assignment(db, user, class_id, request)


@router.get("", response_model=list[AssignmentListItem])
def assignments(class_id: str, user=Depends(require_teacher), db: Session = Depends(get_db)):
    return list_teacher_assignments(db, user, class_id)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def assignment_detail(class_id: str, assignment_id: str, user=Depends(require_teacher), db: Session = Depends(get_db)):
    return get_teacher_assignment(db, user, class_id, assignment_id)
