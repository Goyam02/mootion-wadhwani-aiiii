from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.models import (
    ClassRoom,
    School,
    StudentClassMembership,
    TeacherClassMembership,
    TeacherSchoolMembership,
)


DEFAULT_SCHOOL_NAME = "Mootion Default School"
DEFAULT_SCHOOL_CODE = "MOOTION"


def get_school_by_code(db: Session, code: str) -> School | None:
    return db.scalar(select(School).where(School.code == code))


def get_default_school(db: Session) -> School | None:
    return db.scalar(select(School).where(School.code == DEFAULT_SCHOOL_CODE))


def create_school(db: Session, school: School) -> School:
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


def get_or_create_default_school(db: Session) -> School:
    school = get_default_school(db)
    if school:
        return school

    school = School(name=DEFAULT_SCHOOL_NAME, code=DEFAULT_SCHOOL_CODE, created_by_teacher_id=None)
    return create_school(db, school)


def create_teacher_school_membership(db: Session, membership: TeacherSchoolMembership) -> TeacherSchoolMembership:
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_teacher_school_membership(db: Session, teacher_id: str) -> TeacherSchoolMembership | None:
    return db.scalar(select(TeacherSchoolMembership).where(TeacherSchoolMembership.teacher_id == teacher_id))


def create_class_room(db: Session, class_room: ClassRoom) -> ClassRoom:
    db.add(class_room)
    db.commit()
    db.refresh(class_room)
    return class_room


def get_class_by_school_grade_subject(db: Session, school_id: str, grade: str, subject: str) -> ClassRoom | None:
    return db.scalar(
        select(ClassRoom).where(
            ClassRoom.school_id == school_id,
            ClassRoom.grade == grade,
            ClassRoom.subject == subject,
        )
    )


def get_class_by_code(db: Session, class_code: str) -> ClassRoom | None:
    return db.scalar(select(ClassRoom).where(ClassRoom.class_code == class_code))


def create_teacher_class_membership(db: Session, membership: TeacherClassMembership) -> TeacherClassMembership:
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_teacher_class_membership(db: Session, teacher_id: str, class_id: str) -> TeacherClassMembership | None:
    return db.scalar(
        select(TeacherClassMembership).where(
            TeacherClassMembership.teacher_id == teacher_id,
            TeacherClassMembership.class_id == class_id,
        )
    )


def get_student_class_membership(db: Session, student_id: str, class_id: str) -> StudentClassMembership | None:
    return db.scalar(
        select(StudentClassMembership).where(
            StudentClassMembership.student_id == student_id,
            StudentClassMembership.class_id == class_id,
        )
    )


def create_student_class_membership(db: Session, membership: StudentClassMembership) -> StudentClassMembership:
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_teacher_classes(db: Session, teacher_id: str) -> list[ClassRoom]:
    statement = (
        select(ClassRoom)
        .join(TeacherClassMembership, TeacherClassMembership.class_id == ClassRoom.id)
        .where(TeacherClassMembership.teacher_id == teacher_id)
        .order_by(ClassRoom.created_at.desc())
    )
    return list(db.scalars(statement).all())


def get_student_classes(db: Session, student_id: str) -> list[ClassRoom]:
    statement = (
        select(ClassRoom)
        .join(StudentClassMembership, StudentClassMembership.class_id == ClassRoom.id)
        .where(StudentClassMembership.student_id == student_id)
        .order_by(ClassRoom.created_at.desc())
    )
    return list(db.scalars(statement).all())


def get_student_ids_for_class(db: Session, class_id: str) -> list[str]:
    statement = select(StudentClassMembership.student_id).where(StudentClassMembership.class_id == class_id)
    return [str(student_id) for student_id in db.scalars(statement).all()]
