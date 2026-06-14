from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CurriculumTreeNode(BaseModel):
    id: str
    title: str = Field(min_length=1, max_length=255)
    kind: str = Field(default="topic", pattern="^(module|unit|topic|subtopic|lesson)$")
    order: int = Field(default=0, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)
    children: list["CurriculumTreeNode"] = Field(default_factory=list)


class CurriculumGraphNode(BaseModel):
    id: str
    title: str = Field(min_length=1, max_length=255)
    kind: str = Field(default="topic", pattern="^(module|unit|topic|subtopic|lesson)$")
    order: int = Field(default=0, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CurriculumGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    kind: str = Field(default="contains", pattern="^(contains|prerequisite|related_to)$")


class CurriculumRoadmapData(BaseModel):
    version: str = Field(default="1.0")
    title: str = Field(min_length=1, max_length=255)
    subject: str | None = None
    grade: str | None = None
    source_type: str = Field(default="manual", pattern="^(manual|syllabus|document|subject|ncert)$")
    source_text: str | None = None
    source_subject: str | None = None
    document_id: str | None = None
    root: CurriculumTreeNode
    nodes: list[CurriculumGraphNode] = Field(default_factory=list)
    edges: list[CurriculumGraphEdge] = Field(default_factory=list)


class CurriculumCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    curriculum_data: CurriculumRoadmapData
    status: str = Field(default="draft", pattern="^(draft|active|archived)$")


class CurriculumUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    curriculum_data: CurriculumRoadmapData | None = None
    status: str | None = Field(default=None, pattern="^(draft|active|archived)$")


class CurriculumPatchRequest(BaseModel):
    operation: str = Field(pattern="^(add_node|update_node|delete_node|move_node)$")
    expected_version: int = Field(ge=1)
    target_node_id: str | None = None
    parent_node_id: str | None = None
    position: int | None = Field(default=None, ge=0)
    payload: dict[str, Any] = Field(default_factory=dict)


class CurriculumPatchResponse(BaseModel):
    curriculum_id: str
    class_id: str
    version: int
    title: str
    source_type: str
    source_text: str | None
    source_subject: str | None
    document_id: str | None
    curriculum_data: CurriculumRoadmapData
    status: str


class CurriculumResponse(BaseModel):
    curriculum_id: str
    class_id: str
    version: int
    title: str
    source_type: str
    source_text: str | None
    source_subject: str | None
    document_id: str | None
    curriculum_data: CurriculumRoadmapData
    status: str


class CurriculumListItem(BaseModel):
    curriculum_id: str
    class_id: str
    version: int
    title: str
    source_type: str
    status: str
