import os
import sys

# Add backend to path so we can import app core models and services
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load env variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.models import User, ClassRoom, TeacherClassMembership, CurriculumPlan, Chapter
from app.core.security import hash_password
from app.repositories.auth_repository import get_user_by_login_id
from app.repositories.onboarding_repository import get_or_create_default_school
from app.services.curriculum_service import bootstrap_ncert_curriculum
from app.services.chapter_service import bootstrap_chapters_from_curriculum

def seed():
    db = SessionLocal()
    try:
        # 1. Get or create teacher user 'abc'
        teacher = get_user_by_login_id(db, "abc")
        if not teacher:
            print("Creating default teacher user 'abc'...")
            teacher = User(
                login_id="abc",
                role="teacher",
                full_name="Default Teacher",
                password_hash=hash_password("abc"),
                preferred_language="english",
                onboarding_completed=True,
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
        else:
            print("Default teacher user 'abc' already exists.")
            if not teacher.onboarding_completed:
                teacher.onboarding_completed = True
                db.commit()

        # Define NCERT scope
        scope = {
            "6": ["Science", "Mathematics"],
            "7": ["Science", "Mathematics"],
            "8": ["Science", "Mathematics"],
            "9": ["Science", "Mathematics"],
            "10": ["Science", "Mathematics"],
            "11": ["Physics", "Chemistry", "Mathematics", "Biology"],
            "12": ["Physics", "Chemistry", "Mathematics", "Biology"],
        }

        school = get_or_create_default_school(db)

        import uuid
        def _generate_code() -> str:
            return uuid.uuid4().hex[:8].upper()

        for grade, subjects in scope.items():
            for subject in subjects:
                # Check if classroom already exists for this school/grade/subject
                class_room = db.query(ClassRoom).filter(
                    ClassRoom.school_id == school.id,
                    ClassRoom.grade == grade,
                    ClassRoom.subject == subject
                ).first()

                if not class_room:
                    print(f"Creating classroom for Grade {grade} {subject}...")
                    class_room = ClassRoom(
                        school_id=school.id,
                        grade=grade,
                        subject=subject,
                        class_code=_generate_code(),
                        display_name=f"Class {grade} - {subject}",
                    )
                    db.add(class_room)
                    db.commit()
                    db.refresh(class_room)

                # Ensure teacher membership
                membership = db.query(TeacherClassMembership).filter(
                    TeacherClassMembership.teacher_id == teacher.id,
                    TeacherClassMembership.class_id == class_room.id
                ).first()

                if not membership:
                    print(f"Adding teacher membership for Grade {grade} {subject}...")
                    membership = TeacherClassMembership(
                        teacher_id=teacher.id,
                        class_id=class_room.id,
                        is_primary=True,
                    )
                    db.add(membership)
                    db.commit()

                # Ensure curriculum is bootstrapped
                curriculum = db.query(CurriculumPlan).filter(
                    CurriculumPlan.class_id == class_room.id
                ).first()

                if not curriculum:
                    print(f"Bootstrapping curriculum for Grade {grade} {subject}...")
                    try:
                        curriculum_res = bootstrap_ncert_curriculum(db, teacher, str(class_room.id))
                        curriculum_id = curriculum_res.curriculum_id
                    except Exception as e:
                        print(f"Error bootstrapping curriculum for Grade {grade} {subject}: {e}")
                        continue
                else:
                    curriculum_id = str(curriculum.id)

                # Ensure chapters are bootstrapped
                chapters = db.query(Chapter).filter(
                    Chapter.class_id == class_room.id
                ).all()

                if not chapters or len(chapters) == 0:
                    print(f"Bootstrapping chapters for Grade {grade} {subject}...")
                    try:
                        bootstrap_chapters_from_curriculum(db, teacher, str(class_room.id), curriculum_id)
                    except Exception as e:
                        print(f"Error bootstrapping chapters for Grade {grade} {subject}: {e}")
                        continue
        
        print("NCERT Seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
