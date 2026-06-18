from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class StudentAttemptSubmitRequest(BaseModel):
    transcription_text: str
    language: str = "english"


class StudentAttemptResponse(BaseModel):
    attempt_id: str
    score_understanding: int
    score_reasoning: int
    score_expression: int
    ai_feedback: str


class StudentDoubtCreateRequest(BaseModel):
    class_id: str
    query_text: str
    topic: str | None = None
    tried_before: bool = False
    attempt_text: str | None = None


class StudentDoubtResponse(BaseModel):
    doubt_id: str
    student_id: str
    student_name: str
    class_id: str
    topic: str
    query_text: str
    tried_before: bool
    attempt_text: str | None
    clarification_video_url: str | None
    status: str
    response_text: str | None
    response_audio_url: str | None
    messages: list[dict] | None = None
    created_at: str
    teacher_name: str | None = None
    subject: str | None = None


class TeacherDoubtRespondRequest(BaseModel):
    response_text: str
    voice_note_file_url: str | None = None


class StudentDoubtReplyRequest(BaseModel):
    response_text: str


class QuotaResponse(BaseModel):
    doubt_videos_used_today: int
    doubt_videos_max: int = 5
    playground_items_used_week: int
    playground_items_max: int = 10


class PlaygroundGenerateRequest(BaseModel):
    topic: str
    asset_type: str  # "video" or "simulation"


class PlaygroundGenerateResponse(BaseModel):
    success: bool
    asset_type: str
    external_url: str | None
    error_message: str | None = None


class ClassAnalyticsOverview(BaseModel):
    average_scores: dict[str, float]
    task_completion_rate: float
    most_common_misconception: str | None
    misconception_count: int
    recent_activities: list[dict[str, Any]]
