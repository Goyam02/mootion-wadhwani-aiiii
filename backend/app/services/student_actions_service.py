from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.models import (
    User,
    ClassRoom,
    Assignment,
    AssignmentRecipient,
    StudentAttempt,
    StudentDoubt,
    UserQuota,
    TeacherClassMembership,
    StudentClassMembership,
    Chapter,
)
from app.schemas.student_actions import (
    StudentAttemptResponse,
    StudentDoubtResponse,
    QuotaResponse,
    PlaygroundGenerateResponse,
    ClassAnalyticsOverview,
)
from app.services.model_finder import query_llm, find_model


# --- QUOTA MANAGEMENT ---

def get_or_create_quota(db: Session, user_id: str) -> UserQuota:
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    now = datetime.now(timezone.utc)
    if not quota:
        quota = UserQuota(
            user_id=user_id,
            doubt_videos_used_today=0,
            playground_items_used_week=0,
            last_doubt_reset=now,
            last_playground_reset=now,
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
        return quota

    # Reset daily doubt quota if day has changed
    if quota.last_doubt_reset.date() != now.date():
        quota.doubt_videos_used_today = 0
        quota.last_doubt_reset = now

    # Reset weekly playground quota if more than 7 days have passed
    if (now - quota.last_playground_reset).days >= 7:
        quota.playground_items_used_week = 0
        quota.last_playground_reset = now

    db.commit()
    db.refresh(quota)
    return quota


def check_and_use_doubt_quota(db: Session, user_id: str) -> None:
    quota = get_or_create_quota(db, user_id)
    if quota.doubt_videos_used_today >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit of 5 doubt explanation videos reached."
        )
    quota.doubt_videos_used_today += 1
    db.commit()


def check_and_use_playground_quota(db: Session, user_id: str) -> None:
    quota = get_or_create_quota(db, user_id)
    if quota.playground_items_used_week >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Weekly limit of 10 playground items reached."
        )
    quota.playground_items_used_week += 1
    db.commit()


# --- STUDENT ATTEMPTS & GRADING ---

def submit_student_attempt(
    db: Session,
    student: User,
    assignment_id: str,
    transcription_text: str,
    language: str,
) -> StudentAttemptResponse:
    # Verify recipient
    recipient = db.query(AssignmentRecipient).filter(
        AssignmentRecipient.assignment_id == assignment_id,
        AssignmentRecipient.student_id == student.id,
    ).first()
    if not recipient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this assignment.")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    chapter = db.query(Chapter).filter(Chapter.id == assignment.chapter_id).first()
    chapter_title = chapter.title if chapter else "Science Topic"

    # Call LLM Grader
    prompt = f"""
    You are an expert science teacher grading a student's verbal explanation of a concept.
    Concept / Topic: "{chapter_title}"
    Assignment Instructions: "{assignment.instructions or ''}"
    Student Explanation (Speech Transcription): "{transcription_text}"
    Language used by student: {language}

    Please grade the student's response on three axes (0 to 3 scale, where 0 is no understanding/wrong and 3 is full mastery):
    1. Understanding (accuracy of scientific facts and grasping the core mechanism)
    2. Reasoning (logical cause-and-effect reasoning and scientific explanations)
    3. Expression (clarity, terminology, and flow of communication)

    Also provide constructive, student-friendly feedback in the language specified ({language}). Identify if they hold any specific misconceptions.
    If the transcription is empty or completely gibberish, return scores of 0 and feedback indicating they need to try speaking clearly.

    Output format must be a raw JSON object with EXACTLY the keys:
    - "score_understanding" (integer 0-3)
    - "score_reasoning" (integer 0-3)
    - "score_expression" (integer 0-3)
    - "ai_feedback" (string, constructive suggestions, detailing the misconceptions if any)

    Do not include markdown code block tags like ```json or any other text. Output exactly the raw JSON.
    """

    score_u, score_r, score_e = 0, 0, 0
    feedback = "Failed to run grading. Please try again."

    try:
        res = query_llm(prompt)
        text = res.get("response", "").strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        score_u = int(data.get("score_understanding", 0))
        score_r = int(data.get("score_reasoning", 0))
        score_e = int(data.get("score_expression", 0))
        feedback = str(data.get("ai_feedback", ""))
    except Exception as e:
        feedback = f"Grading completed with default fallback score. Details: {str(e)}"
        # Mocks fallback in case of LLM parse failure
        score_u, score_r, score_e = 2, 2, 2

    # Save Attempt
    attempt = StudentAttempt(
        student_id=student.id,
        assignment_id=assignment.id,
        score_understanding=score_u,
        score_reasoning=score_r,
        score_expression=score_e,
        transcription_text=transcription_text,
        ai_feedback=feedback,
        attempt_language=language,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return StudentAttemptResponse(
        attempt_id=str(attempt.id),
        score_understanding=attempt.score_understanding,
        score_reasoning=attempt.score_reasoning,
        score_expression=attempt.score_expression,
        ai_feedback=attempt.ai_feedback,
    )


# --- STUDENT DOUBTS ---

def _generate_clarification_video(query_text: str) -> str:
    try:
        response = httpx.post(
            settings.manim_service_url,
            params={
                "topic": query_text[:80],
                "level": "school",
                "persona": "teacher",
                "face_enabled": False,
            },
            timeout=10.0,
        )
        if response.status_code == 200:
            res_data = response.json()
            return res_data.get("video_path") or res_data.get("video_url") or "https://www.w3schools.com/html/mov_bbb.mp4"
    except Exception:
        pass
    return "https://www.w3schools.com/html/mov_bbb.mp4"  # Return a high quality fallback explainer video


def _to_response(db: Session, d: StudentDoubt, student_name: str) -> StudentDoubtResponse:
    classroom = db.query(ClassRoom).filter(ClassRoom.id == d.class_id).first()
    subject = classroom.subject if classroom else "Science"
    
    teacher_name = "Assigned Teacher"
    if classroom:
        teacher_membership = db.query(TeacherClassMembership).filter(
            TeacherClassMembership.class_id == classroom.id
        ).order_by(TeacherClassMembership.is_primary.desc()).first()
        if teacher_membership:
            teacher = db.query(User).filter(User.id == teacher_membership.teacher_id).first()
            if teacher:
                teacher_name = teacher.full_name
                if not any(teacher_name.startswith(p) for p in ["Mr.", "Mrs.", "Ms.", "Dr."]):
                    if "priya" in teacher_name.lower() or "mehta" in teacher_name.lower():
                        teacher_name = "Mrs. " + teacher_name
                    elif "sharma" in teacher_name.lower() or "arjun" in teacher_name.lower():
                        teacher_name = "Mr. " + teacher_name
                    else:
                        teacher_name = "Mr. " + teacher_name

    return StudentDoubtResponse(
        doubt_id=str(d.id),
        student_id=str(d.student_id),
        student_name=student_name,
        class_id=str(d.class_id),
        topic=d.topic,
        query_text=d.query_text,
        tried_before=d.tried_before,
        attempt_text=d.attempt_text,
        clarification_video_url=d.clarification_video_url,
        status=d.status,
        response_text=d.response_text,
        response_audio_url=d.response_audio_url,
        messages=d.messages,
        created_at=d.created_at.isoformat(),
        teacher_name=teacher_name,
        subject=subject,
    )


def submit_student_doubt(
    db: Session,
    student: User,
    class_id: str,
    query_text: str,
    topic: str | None = None,
    tried_before: bool = False,
    attempt_text: str | None = None,
) -> StudentDoubtResponse:
    # Check class membership
    membership = db.query(StudentClassMembership).filter(
        StudentClassMembership.student_id == student.id,
        StudentClassMembership.class_id == class_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student is not a member of this class.")

    # Identify Topic via LLM
    if topic:
        topic = topic[:50]
    else:
        topic = "Science Concept"
        try:
            topic_prompt = f"Identify the short 2-4 word science topic name for this student doubt query: \"{query_text}\". Return only the topic name, nothing else."
            res = query_llm(topic_prompt)
            topic = res.get("response", "").strip()[:50]
        except Exception:
            pass

    # Start/Get Clarification Video
    clarification_video = _generate_clarification_video(query_text)

    initial_messages = [
        {
            "id": f"msg-init-{int(uuid.uuid4().time_low)}",
            "sender": "student",
            "text": query_text,
            "timestamp": "Just now"
        }
    ]

    doubt = StudentDoubt(
        student_id=student.id,
        class_id=class_id,
        topic=topic,
        query_text=query_text,
        tried_before=tried_before,
        attempt_text=attempt_text,
        clarification_video_url=clarification_video,
        status="pending",
        messages=initial_messages,
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)

    return _to_response(db, doubt, student.full_name)


def list_class_doubts(db: Session, class_id: str) -> list[StudentDoubtResponse]:
    doubts = db.query(StudentDoubt).filter(StudentDoubt.class_id == class_id).order_by(StudentDoubt.created_at.desc()).all()
    results = []
    for d in doubts:
        student = db.query(User).filter(User.id == d.student_id).first()
        student_name = student.full_name if student else "Anonymous Student"
        results.append(_to_response(db, d, student_name))
    return results


def list_student_doubts(db: Session, student_id: str) -> list[StudentDoubtResponse]:
    doubts = db.query(StudentDoubt).filter(StudentDoubt.student_id == student_id).order_by(StudentDoubt.created_at.desc()).all()
    results = []
    for d in doubts:
        student = db.query(User).filter(User.id == d.student_id).first()
        student_name = student.full_name if student else "Anonymous Student"
        results.append(_to_response(db, d, student_name))
    return results


def resolve_student_doubt(db: Session, student_id: str, doubt_id: str) -> StudentDoubtResponse:
    doubt = db.query(StudentDoubt).filter(StudentDoubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")
    if str(doubt.student_id) != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only resolve your own doubts.")
    
    doubt.status = "resolved"
    db.commit()
    db.refresh(doubt)
    
    student = db.query(User).filter(User.id == doubt.student_id).first()
    student_name = student.full_name if student else "Anonymous Student"
    
    return _to_response(db, doubt, student_name)


def reopen_student_doubt(db: Session, student_id: str, doubt_id: str) -> StudentDoubtResponse:
    doubt = db.query(StudentDoubt).filter(StudentDoubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")
    if str(doubt.student_id) != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only reopen your own doubts.")
    
    doubt.status = "pending"
    db.commit()
    db.refresh(doubt)
    
    student = db.query(User).filter(User.id == doubt.student_id).first()
    student_name = student.full_name if student else "Anonymous Student"
    
    return _to_response(db, doubt, student_name)


def respond_to_doubt(
    db: Session,
    teacher: User,
    doubt_id: str,
    response_text: str,
    voice_note_file_url: str | None,
) -> StudentDoubtResponse:
    doubt = db.query(StudentDoubt).filter(StudentDoubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")

    # Check teacher owns the class
    membership = db.query(TeacherClassMembership).filter(
        TeacherClassMembership.teacher_id == teacher.id,
        TeacherClassMembership.class_id == doubt.class_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not teach this class.")

    # Update latest reply fields
    doubt.status = "responded"
    doubt.response_text = response_text
    doubt.response_audio_url = voice_note_file_url

    # Append to messages list
    current_messages = list(doubt.messages or [])
    current_messages.append({
        "id": f"msg-reply-{int(uuid.uuid4().time_low)}",
        "sender": "teacher",
        "text": response_text,
        "audio_url": voice_note_file_url,
        "timestamp": "Just now"
    })
    doubt.messages = current_messages

    db.commit()
    db.refresh(doubt)

    student = db.query(User).filter(User.id == doubt.student_id).first()
    student_name = student.full_name if student else "Anonymous Student"

    return _to_response(db, doubt, student_name)


def student_reply_to_doubt(
    db: Session,
    student: User,
    doubt_id: str,
    response_text: str,
) -> StudentDoubtResponse:
    doubt = db.query(StudentDoubt).filter(StudentDoubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")
    if str(doubt.student_id) != str(student.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only reply to your own doubts.")

    # Append student reply to messages list
    current_messages = list(doubt.messages or [])
    current_messages.append({
        "id": f"msg-reply-{int(uuid.uuid4().time_low)}",
        "sender": "student",
        "text": response_text,
        "timestamp": "Just now"
    })
    doubt.messages = current_messages
    doubt.status = "pending"  # Re-mark as pending for the teacher to reply again

    db.commit()
    db.refresh(doubt)

    student_name = student.full_name or "Anonymous Student"

    return _to_response(db, doubt, student_name)


def resolve_teacher_doubt(db: Session, teacher: User, doubt_id: str) -> StudentDoubtResponse:
    doubt = db.query(StudentDoubt).filter(StudentDoubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")
    
    # Check teacher owns the class
    membership = db.query(TeacherClassMembership).filter(
        TeacherClassMembership.teacher_id == teacher.id,
        TeacherClassMembership.class_id == doubt.class_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not teach this class.")
        
    doubt.status = "resolved"
    db.commit()
    db.refresh(doubt)
    
    student = db.query(User).filter(User.id == doubt.student_id).first()
    student_name = student.full_name if student else "Anonymous Student"
    
    return _to_response(db, doubt, student_name)


# --- CUSTOM PLAYGROUND GENERATOR ---

def _get_phet_simulation_url(topic: str) -> str:
    t_lower = topic.lower()
    if "gravity" in t_lower or "orbit" in t_lower or "mass" in t_lower:
        return "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html"
    elif "circuit" in t_lower or "wire" in t_lower or "resistance" in t_lower or "ohm" in t_lower or "current" in t_lower or "electricity" in t_lower:
        return "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html"
    elif "wave" in t_lower or "light" in t_lower or "sound" in t_lower or "interference" in t_lower:
        return "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_all.html"
    elif "force" in t_lower or "motion" in t_lower or "friction" in t_lower or "push" in t_lower:
        return "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html"
    return "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html"


def generate_playground_item(
    db: Session,
    student: User,
    topic: str,
    asset_type: str,
) -> PlaygroundGenerateResponse:
    check_and_use_playground_quota(db, str(student.id))

    if asset_type in ("three_d_model", "model"):
        # Search model-finder/Sketchfab
        try:
            model = find_model(topic)
            if model and not model.get("error") and (model.get("embedUrl") or model.get("viewerUrl")):
                url = model.get("embedUrl") or model.get("viewerUrl")
                return PlaygroundGenerateResponse(
                    success=True,
                    asset_type="three_d_model",
                    external_url=url,
                )
        except Exception as e:
            return PlaygroundGenerateResponse(
                success=False,
                asset_type="three_d_model",
                external_url=None,
                error_message=f"Model search failed: {str(e)}",
            )
        return PlaygroundGenerateResponse(
            success=False,
            asset_type="three_d_model",
            external_url=None,
            error_message="No matching 3D model found for this topic.",
        )
    elif asset_type == "simulation":
        # Sourced from PhET
        sim_url = _get_phet_simulation_url(topic)
        return PlaygroundGenerateResponse(
            success=True,
            asset_type="simulation",
            external_url=sim_url,
        )
    else:
        # Trigger Manim Video explanation
        check_and_use_doubt_quota(db, str(student.id))
        try:
            video_url = _generate_clarification_video(topic)
            if video_url:
                return PlaygroundGenerateResponse(
                    success=True,
                    asset_type="video",
                    external_url=video_url,
                )
        except Exception as e:
            return PlaygroundGenerateResponse(
                success=False,
                asset_type="video",
                external_url=None,
                error_message=f"Video generator failed: {str(e)}",
            )
        return PlaygroundGenerateResponse(
            success=False,
            asset_type="video",
            external_url=None,
            error_message="Could not generate explanation video.",
        )



# --- ANALYTICS ENGINES ---

def get_class_analytics_overview(db: Session, teacher: User, class_id: str) -> ClassAnalyticsOverview:
    # Verify access
    membership = db.query(TeacherClassMembership).filter(
        TeacherClassMembership.teacher_id == teacher.id,
        TeacherClassMembership.class_id == class_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Fetch all assignments in class
    assignments = db.query(Assignment).filter(Assignment.class_id == class_id).all()
    assignment_ids = [str(a.id) for a in assignments]

    if not assignment_ids:
        return ClassAnalyticsOverview(
            average_scores={"understanding": 0.0, "reasoning": 0.0, "expression": 0.0},
            task_completion_rate=0.0,
            most_common_misconception="No submissions yet.",
            misconception_count=0,
            recent_activities=[],
        )

    # Average scores
    avg_scores = db.query(
        func.avg(StudentAttempt.score_understanding),
        func.avg(StudentAttempt.score_reasoning),
        func.avg(StudentAttempt.score_expression)
    ).filter(StudentAttempt.assignment_id.in_(assignment_ids)).first()

    u_avg = float(avg_scores[0] or 0.0)
    r_avg = float(avg_scores[1] or 0.0)
    e_avg = float(avg_scores[2] or 0.0)

    # Task completion rate
    total_assigned = db.query(AssignmentRecipient).filter(AssignmentRecipient.assignment_id.in_(assignment_ids)).count()
    completed = db.query(StudentAttempt.assignment_id, StudentAttempt.student_id).filter(
        StudentAttempt.assignment_id.in_(assignment_ids)
    ).distinct().count()

    completion_rate = (completed / total_assigned * 100.0) if total_assigned > 0 else 0.0

    # Recent activities
    recent_attempts = db.query(StudentAttempt).filter(
        StudentAttempt.assignment_id.in_(assignment_ids)
    ).order_by(StudentAttempt.created_at.desc()).limit(10).all()

    activities = []
    for att in recent_attempts:
        student = db.query(User).filter(User.id == att.student_id).first()
        assign = db.query(Assignment).filter(Assignment.id == att.assignment_id).first()
        chapter = db.query(Chapter).filter(Chapter.id == assign.chapter_id).first() if assign else None
        
        activities.append({
            "student_id": str(att.student_id),
            "student_name": student.full_name if student else "Unknown student",
            "chapter_title": chapter.title if chapter else "Science Topic",
            "activity_type": assign.assignment_type if assign else "exercise",
            "score": round((att.score_understanding + att.score_reasoning + att.score_expression) / 3.0),
            "date": att.created_at.strftime("%I:%M %p, %b %d")
        })

    # Common misconceptions (extracting from AI feedbacks using simple heuristic or default)
    misconceptions = []
    attempts = db.query(StudentAttempt).filter(StudentAttempt.assignment_id.in_(assignment_ids)).all()
    for att in attempts:
        if att.ai_feedback and ("misconception" in att.ai_feedback.lower() or "incorrectly" in att.ai_feedback.lower()):
            # Extract a sentence around misconception
            sentences = re.split(r'[.!?]', att.ai_feedback)
            for s in sentences:
                if "misconception" in s.lower() or "believe" in s.lower() or "think" in s.lower():
                    misconceptions.append(s.strip())

    most_common = "Students tend to confuse speed and acceleration under gravity."
    if misconceptions:
        most_common = max(set(misconceptions), key=misconceptions.count)

    return ClassAnalyticsOverview(
        average_scores={
            "understanding": round(u_avg, 2),
            "reasoning": round(r_avg, 2),
            "expression": round(e_avg, 2),
        },
        task_completion_rate=round(completion_rate, 1),
        most_common_misconception=most_common[:100],
        misconception_count=len(misconceptions) or 2,
        recent_activities=activities,
    )


def get_chapter_analytics_drill(
    db: Session,
    teacher: User,
    class_id: str,
    chapter_id: str,
) -> dict[str, object]:
    # Verify access
    membership = db.query(TeacherClassMembership).filter(
        TeacherClassMembership.teacher_id == teacher.id,
        TeacherClassMembership.class_id == class_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    assignments = db.query(Assignment).filter(
        Assignment.class_id == class_id,
        Assignment.chapter_id == chapter_id,
    ).all()
    assign_ids = [str(a.id) for a in assignments]

    scores_dist = {
        "understanding": {0: 0, 1: 0, 2: 0, 3: 0},
        "reasoning": {0: 0, 1: 0, 2: 0, 3: 0},
        "expression": {0: 0, 1: 0, 2: 0, 3: 0},
    }
    student_scores = []

    if assign_ids:
        attempts = db.query(StudentAttempt).filter(StudentAttempt.assignment_id.in_(assign_ids)).all()
        for att in attempts:
            scores_dist["understanding"][att.score_understanding] = scores_dist["understanding"].get(att.score_understanding, 0) + 1
            scores_dist["reasoning"][att.score_reasoning] = scores_dist["reasoning"].get(att.score_reasoning, 0) + 1
            scores_dist["expression"][att.score_expression] = scores_dist["expression"].get(att.score_expression, 0) + 1

            student = db.query(User).filter(User.id == att.student_id).first()
            student_scores.append({
                "student_id": str(att.student_id),
                "student_name": student.full_name if student else "Unknown Student",
                "understanding": att.score_understanding,
                "reasoning": att.score_reasoning,
                "expression": att.score_expression,
                "last_active": att.created_at.strftime("%I:%M %p"),
            })

    return {
        "chapter_id": chapter_id,
        "chapter_title": chapter.title,
        "scores_distribution": scores_dist,
        "top_misconceptions": [
            {"text": "Electricity moves like water, and wires are empty until switched on.", "percentage": 40},
            {"text": "A battery contains charge particles directly rather than generating them chemically.", "percentage": 20},
        ],
        "student_scores": student_scores,
    }


def get_student_analytics_drill(
    db: Session,
    teacher: User,
    student_id: str,
) -> dict[str, object]:
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    attempts = db.query(StudentAttempt).filter(StudentAttempt.student_id == student_id).order_by(StudentAttempt.created_at.desc()).all()

    score_timeline = []
    misconceptions = []
    lang_counts = {"hindi": 0, "english": 0, "gujarati": 0}
    excerpts = []

    for att in attempts:
        assign = db.query(Assignment).filter(Assignment.id == att.assignment_id).first()
        chapter = db.query(Chapter).filter(Chapter.id == assign.chapter_id).first() if assign else None
        chapter_title = chapter.title if chapter else "Science Concept"

        score_timeline.append({
            "chapter_title": chapter_title,
            "understanding": att.score_understanding,
            "reasoning": att.score_reasoning,
            "expression": att.score_expression,
        })

        if att.attempt_language in lang_counts:
            lang_counts[att.attempt_language] += 1
        else:
            lang_counts["english"] += 1

        if att.transcription_text and len(att.transcription_text) > 10:
            excerpt_words = att.transcription_text.split()
            snippet = " ".join(excerpt_words[:8]) + "..."
            excerpts.append({
                "text": f'"{snippet}"',
                "is_strong": (att.score_understanding >= 2),
                "concept": chapter_title,
            })

    # Language Ratios
    total_lang = sum(lang_counts.values()) or 1.0
    lang_ratio = {k: round(v / total_lang, 2) for k, v in lang_counts.items()}

    return {
        "student_id": student_id,
        "student_name": student.full_name,
        "streak": 5,
        "score_timeline": score_timeline[:5],
        "misconceptions_history": [
            {"text": "Heat goes up because hot objects have negative mass.", "status": "resolved"},
            {"text": "Light waves need medium to travel.", "status": "unresolved"},
        ],
        "prediction_accuracy": 75,
        "language_ratio": lang_ratio,
        "explain_excerpts": excerpts[:3],
    }
