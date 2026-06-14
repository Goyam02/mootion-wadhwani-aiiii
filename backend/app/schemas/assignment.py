from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AssignmentCreateRequest(BaseModel):
    chapter_id: str
    assignment_type: str
    title: str
    instructions: str | None = None


class AssignmentRecipientResponse(BaseModel):
    student_id: str


class AssignmentJobResponse(BaseModel):
    job_id: str
    asset_id: str
    asset_type: str
    provider: str
    integration_target: str
    status: str
    result_json: dict[str, Any] | None = None
    error_message: str | None = None


class AssignmentResponse(BaseModel):
    assignment_id: str
    class_id: str
    chapter_id: str
    assignment_type: str
    title: str
    instructions: str | None
    content_json: dict[str, Any]
    status: str
    recipients: list[AssignmentRecipientResponse] = Field(default_factory=list)
    jobs: list[AssignmentJobResponse] = Field(default_factory=list)


class AssignmentListItem(BaseModel):
    assignment_id: str
    class_id: str
    chapter_id: str
    assignment_type: str
    title: str
    status: str
    recipient_count: int
    job_count: int
