from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ChapterAssetResponse(BaseModel):
    asset_id: str
    asset_type: str
    provider: str
    integration_target: str
    title: str
    description: str | None
    generation_status: str
    external_url: str | None
    payload_json: dict[str, Any]


class ChapterTopicAssetResponse(BaseModel):
    asset_id: str
    asset_type: str
    provider: str
    integration_target: str
    title: str
    description: str | None
    generation_status: str
    external_url: str | None
    payload_json: dict[str, Any]


class ChapterTopicResponse(BaseModel):
    topic_id: str
    chapter_id: str
    source_node_id: str | None
    sequence_number: int
    title: str
    source_text: str | None
    status: str
    assets: list[ChapterTopicAssetResponse] = Field(default_factory=list)


class ChapterAssetGenerateRequest(BaseModel):
    instructions: str | None = None


class ChapterAssetGenerateResponse(BaseModel):
    chapter_id: str
    estimated_seconds: int
    asset: ChapterAssetResponse


class ChapterTopicAssetGenerateRequest(BaseModel):
    instructions: str | None = None


class ChapterTopicAssetGenerateResponse(BaseModel):
    chapter_id: str
    topic_id: str
    estimated_seconds: int
    asset: ChapterTopicAssetResponse


class SubtopicResponse(BaseModel):
    subtopic_id: str
    title: str
    order: int
    kind: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChapterResponse(BaseModel):
    chapter_id: str
    class_id: str
    curriculum_id: str
    source_node_id: str | None
    sequence_number: int
    title: str
    status: str
    assets: list[ChapterAssetResponse] = Field(default_factory=list)
    topics: list[ChapterTopicResponse] = Field(default_factory=list)
    subtopics: list[SubtopicResponse] = Field(default_factory=list)


class ChapterListItem(BaseModel):
    chapter_id: str
    class_id: str
    sequence_number: int
    title: str
    status: str
    asset_count: int
    topic_count: int = 0


class ChapterBootstrapResponse(BaseModel):
    class_id: str
    curriculum_id: str
    created_chapters: int
    created_topics: int = 0
