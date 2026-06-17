from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./mootion.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_ttl_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_TTL_MINUTES", "60"))
    google_oauth_client_id: str | None = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    google_oauth_client_secret: str | None = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
    google_oauth_redirect_uri: str = os.getenv(
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://localhost:8000/auth/google/callback",
    )
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    manim_service_url: str = os.getenv("MANIM_SERVICE_URL", "http://localhost:8001/explain")
    manim_service_base_url: str = os.getenv("MANIM_SERVICE_BASE_URL", "http://localhost:8001")
    sketchfab_api_url: str | None = os.getenv("SKETCHFAB_API_URL")
    azure_openai_endpoint: str | None = os.getenv("AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: str | None = os.getenv("AZURE_OPENAI_API_KEY")
    azure_openai_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-5.4-mini")
    asset_generation_poll_interval_seconds: float = float(os.getenv("ASSET_GENERATION_POLL_INTERVAL_SECONDS", "1.0"))
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    media_job_queue_name: str = os.getenv("MEDIA_JOB_QUEUE_NAME", "mootion-media")
    backend_public_url: str = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    minio_secure: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    minio_media_bucket: str = os.getenv("MINIO_MEDIA_BUCKET", "mootion-media")
    media_job_stale_timeout_minutes: int = int(os.getenv("MEDIA_JOB_STALE_TIMEOUT_MINUTES", "120"))


settings = Settings()
