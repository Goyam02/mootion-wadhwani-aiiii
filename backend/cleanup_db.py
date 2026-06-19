import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.models import User, ClassRoom, TeacherClassMembership, StudentClassMembership, CurriculumPlan, Chapter, ChapterTopic

def cleanup():
    db = SessionLocal()
    try:
        print("Starting DB cleanup for all users...")
        
        # Group classrooms by (school_id, grade, subject)
        classrooms = db.query(ClassRoom).all()
        print(f"Found {len(classrooms)} classrooms in database.")

        seen = {}
        duplicates_removed = 0
        for classroom in classrooms:
            key = (classroom.school_id, classroom.grade, classroom.subject)
            if key in seen:
                # Duplicate classroom! Delete it and its dependencies
                print(f"Removing duplicate class {classroom.id} for Grade {classroom.grade} {classroom.subject}...")
                
                # Delete memberships
                memberships = db.query(TeacherClassMembership).filter(TeacherClassMembership.class_id == classroom.id).all()
                for m in memberships:
                    db.delete(m)
                
                # Delete student memberships
                student_memberships = db.query(StudentClassMembership).filter(StudentClassMembership.class_id == classroom.id).all()
                for sm in student_memberships:
                    db.delete(sm)

                # Delete curriculum plans
                curriculums = db.query(CurriculumPlan).filter(CurriculumPlan.class_id == classroom.id).all()
                for cur in curriculums:
                    db.delete(cur)
                
                # Delete chapters (topics and assets delete by cascade)
                chapters = db.query(Chapter).filter(Chapter.class_id == classroom.id).all()
                for chap in chapters:
                    db.delete(chap)
                
                # Delete classroom
                db.delete(classroom)
                duplicates_removed += 1
            else:
                seen[key] = classroom

        db.commit()
        print(f"Removed {duplicates_removed} duplicate classrooms.")

        # 2. For the remaining classrooms, ensure only ONE curriculum plan exists and fix sequence numbers
        for key, classroom in seen.items():
            # Get curriculum plans
            cur_plans = db.query(CurriculumPlan).filter(CurriculumPlan.class_id == classroom.id).all()
            if len(cur_plans) > 1:
                # Keep the first one, delete the rest
                print(f"Cleaning duplicate curriculum plans for Grade {classroom.grade} {classroom.subject}...")
                for extra in cur_plans[1:]:
                    db.delete(extra)
                db.commit()

            # Refresh curriculum plan
            curriculum = db.query(CurriculumPlan).filter(CurriculumPlan.class_id == classroom.id).first()
            if curriculum:
                # Get chapters
                chapters = db.query(Chapter).filter(
                    Chapter.class_id == classroom.id,
                    Chapter.curriculum_id == curriculum.id
                ).order_by(Chapter.sequence_number.asc()).all()

                # Clean up any extra chapters not matching curriculum or duplicate source_node_id
                seen_nodes = set()
                for chap in chapters:
                    if chap.source_node_id in seen_nodes:
                        print(f"Deleting duplicate chapter {chap.title}...")
                        db.delete(chap)
                    else:
                        seen_nodes.add(chap.source_node_id)
                db.commit()

                # Re-fetch chapters and fix sequence numbers
                chapters = db.query(Chapter).filter(
                    Chapter.class_id == classroom.id,
                    Chapter.curriculum_id == curriculum.id
                ).order_by(Chapter.sequence_number.asc()).all()

                for index, chap in enumerate(chapters):
                    new_seq = index + 1
                    if chap.sequence_number != new_seq:
                        print(f"Updating chapter {chap.title} sequence number from {chap.sequence_number} to {new_seq}...")
                        chap.sequence_number = new_seq
                db.commit()

        print("Cleanup completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
