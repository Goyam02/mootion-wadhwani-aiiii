from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.models import ClassRoom, StudentClassMembership, TeacherClassMembership, TeacherSchoolMembership, User
from app.repositories.onboarding_repository import (
    create_class_room,
    create_student_class_membership,
    create_teacher_class_membership,
    create_teacher_school_membership,
    get_class_by_code,
    get_class_by_school_grade_subject,
    get_or_create_default_school,
    get_student_class_membership,
    get_student_classes,
    get_teacher_class_membership,
    get_teacher_classes,
    get_teacher_school_membership,
)
from app.schemas.onboarding import (
    ClassSummaryResponse,
    StudentJoinClassRequest,
    StudentJoinClassResponse,
    StudentLanguageRequest,
    StudentLanguageResponse,
    TeacherOnboardingCompleteRequest,
    TeacherOnboardingCompleteResponse,
    TeacherClassCreateRequest,
    TeacherClassCreateResponse,
    TeacherPreferenceOnboardingRequest,
    TeacherPreferenceOnboardingResponse,
)


ALLOWED_SUBJECTS = {"Physics", "Mathematics", "Chemistry", "Biology", "Computer Science", "Science"}


def _generate_code() -> str:
    return uuid.uuid4().hex[:8].upper()


def _unique_class_code(db: Session) -> str:
    code = _generate_code()
    while get_class_by_code(db, code):
        code = _generate_code()
    return code


def setup_teacher_preferences(
    db: Session,
    user: User,
    request: TeacherPreferenceOnboardingRequest,
) -> TeacherPreferenceOnboardingResponse:
    school = get_or_create_default_school(db)
    membership = get_teacher_school_membership(db, user.id)
    if not membership:
        create_teacher_school_membership(
            db,
            TeacherSchoolMembership(
                teacher_id=user.id,
                school_id=school.id,
            ),
        )

    user.preferred_language = request.preferred_language
    db.commit()

    return TeacherPreferenceOnboardingResponse(
        preferred_language=request.preferred_language,
    )


def create_teacher_class(
    db: Session,
    user: User,
    request: TeacherClassCreateRequest,
) -> TeacherClassCreateResponse:
    if request.subject not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid subject")

    school = get_or_create_default_school(db)
    membership = get_teacher_school_membership(db, user.id)
    if not membership:
        create_teacher_school_membership(
            db,
            TeacherSchoolMembership(
                teacher_id=user.id,
                school_id=school.id,
            ),
        )

    class_room = create_class_room(
        db,
        ClassRoom(
            school_id=school.id,
            grade=request.grade,
            subject=request.subject,
            class_code=_unique_class_code(db),
            display_name=f"Class {request.grade} - {request.subject}",
        ),
    )

    create_teacher_class_membership(
        db,
        TeacherClassMembership(
            teacher_id=user.id,
            class_id=class_room.id,
            is_primary=False,
        ),
    )

    return TeacherClassCreateResponse(
        class_id=str(class_room.id),
        class_code=class_room.class_code,
        display_name=class_room.display_name,
        grade=class_room.grade,
        subject=class_room.subject,
    )


def complete_teacher_onboarding(
    db: Session,
    user: User,
    request: TeacherOnboardingCompleteRequest,
) -> TeacherOnboardingCompleteResponse:
    user.onboarding_completed = True
    db.commit()
    return TeacherOnboardingCompleteResponse(
        onboarding_completed=True,
        ncert_requested=request.load_ncert,
    )


def join_student_class(
    db: Session,
    user: User,
    request: StudentJoinClassRequest,
) -> StudentJoinClassResponse:
    class_room = get_class_by_code(db, request.class_code)
    if not class_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    membership = get_student_class_membership(db, str(user.id), str(class_room.id))
    if not membership:
        create_student_class_membership(
            db,
            StudentClassMembership(
                student_id=user.id,
                class_id=class_room.id,
            ),
        )

    return StudentJoinClassResponse(
        class_id=str(class_room.id),
        class_code=class_room.class_code,
        display_name=class_room.display_name,
        joined=True,
    )


def set_student_language(
    db: Session,
    user: User,
    request: StudentLanguageRequest,
) -> StudentLanguageResponse:
    user.preferred_language = request.preferred_language
    user.onboarding_completed = True
    db.commit()
    return StudentLanguageResponse(preferred_language=request.preferred_language)


def list_teacher_classes(db: Session, user: User) -> list[ClassSummaryResponse]:
    classes = get_teacher_classes(db, str(user.id))
    return [
        ClassSummaryResponse(
            class_id=str(class_room.id),
            class_code=class_room.class_code,
            display_name=class_room.display_name,
            grade=class_room.grade,
            subject=class_room.subject,
        )
        for class_room in classes
    ]


def list_student_classes(db: Session, user: User) -> list[ClassSummaryResponse]:
    classes = get_student_classes(db, str(user.id))
    return [
        ClassSummaryResponse(
            class_id=str(class_room.id),
            class_code=class_room.class_code,
            display_name=class_room.display_name,
            grade=class_room.grade,
            subject=class_room.subject,
        )
        for class_room in classes
    ]
