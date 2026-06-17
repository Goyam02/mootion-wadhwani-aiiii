from __future__ import annotations

from io import BytesIO
from typing import Any

import httpx
from fastapi import HTTPException, status
from minio.error import S3Error
from app.core.config import settings
from app.core.models import ChapterAsset
from app.core.storage import get_minio_client


def build_media_url(asset_id: str) -> str:
    return f"{settings.backend_public_url.rstrip('/')}/media/assets/{asset_id}"


def resolve_asset_media_url(asset: ChapterAsset) -> str | None:
    if asset.storage_bucket and asset.storage_key:
        return build_media_url(str(asset.id))
    return asset.external_url


def build_asset_object_key(asset_id: str, job_id: str) -> str:
    return f"chapter-assets/{asset_id}/{job_id}.mp4"


def ensure_media_bucket() -> None:
    client = get_minio_client()
    if not client.bucket_exists(settings.minio_media_bucket):
        client.make_bucket(settings.minio_media_bucket)


def download_manim_video(video_id: str) -> tuple[bytes, str]:
    video_url = f"{settings.manim_service_base_url.rstrip('/')}/video/{video_id}"
    try:
        response = httpx.get(video_url, timeout=300.0)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to fetch Manim video: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Manim service returned {response.status_code} while downloading video.",
        )

    content_type = response.headers.get("content-type", "video/mp4")
    return response.content, content_type


def store_generated_manim_video(asset: ChapterAsset, job_id: str, video_id: str) -> dict[str, Any]:
    ensure_media_bucket()
    client = get_minio_client()
    video_bytes, content_type = download_manim_video(video_id)
    object_key = build_asset_object_key(str(asset.id), job_id)

    client.put_object(
        settings.minio_media_bucket,
        object_key,
        BytesIO(video_bytes),
        len(video_bytes),
        content_type=content_type,
    )

    asset.storage_bucket = settings.minio_media_bucket
    asset.storage_key = object_key
    asset.external_url = build_media_url(str(asset.id))

    return {
        "storage_bucket": settings.minio_media_bucket,
        "storage_key": object_key,
        "external_url": asset.external_url,
        "content_type": content_type,
    }


def stream_minio_object(bucket: str, key: str):
    client = get_minio_client()
    try:
        return client.get_object(bucket, key)
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found") from exc
