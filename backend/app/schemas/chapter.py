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


class ChapterResponse(BaseModel):
    chapter_id: str
    class_id: str
    curriculum_id: str
    source_node_id: str | None
    sequence_number: int
    title: str
    status: str
    assets: list[ChapterAssetResponse] = Field(default_factory=list)


class ChapterListItem(BaseModel):
    chapter_id: str
    class_id: str
    sequence_number: int
    title: str
    status: str
    asset_count: int


class ChapterBootstrapResponse(BaseModel):
    class_id: str
    curriculum_id: str
    created_chapters: int
