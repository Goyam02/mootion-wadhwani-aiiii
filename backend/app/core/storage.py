from __future__ import annotations

from functools import lru_cache

from minio import Minio

from app.core.config import settings


@lru_cache(maxsize=1)
def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def ensure_media_bucket() -> None:
    client = get_minio_client()
    if not client.bucket_exists(settings.minio_media_bucket):
        client.make_bucket(settings.minio_media_bucket)
