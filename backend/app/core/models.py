from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    login_id = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False)
    full_name = Column(String(255), nullable=False)

    password_hash = Column(Text, nullable=False)

    preferred_language = Column(
        String(20),
        nullable=False,
        default="english",
    )

    onboarding_completed = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    oauth_accounts = relationship(
        "OAuthAccount",
        backref="user",
        cascade="all, delete-orphan",
    )

    sessions = relationship(
        "Session",
        backref="user",
        cascade="all, delete-orphan",
    )


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_user_id",
            name="uq_provider_user",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    provider = Column(String(32), nullable=False, index=True)

    provider_user_id = Column(
        String(255),
        nullable=False,
    )

    email = Column(String(255), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    provider = Column(String(32), nullable=False)

    requested_role = Column(String(20), nullable=False)

    state = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    refresh_token_hash = Column(
        String(128),
        nullable=False,
        unique=True,
        index=True,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class School(Base):
    __tablename__ = "schools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(32), unique=True, index=True, nullable=False)
    created_by_teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TeacherSchoolMembership(Base):
    __tablename__ = "teacher_school_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ClassRoom(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    grade = Column(String(16), nullable=False)
    subject = Column(String(255), nullable=False)
    class_code = Column(String(32), unique=True, index=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TeacherClassMembership(Base):
    __tablename__ = "teacher_class_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StudentClassMembership(Base):
    __tablename__ = "student_class_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CurriculumPlan(Base):
    __tablename__ = "curriculum_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    title = Column(String(255), nullable=False)
    source_type = Column(String(32), nullable=False, default="manual")
    source_text = Column(Text, nullable=True)
    source_subject = Column(String(255), nullable=True)
    document_id = Column(String(255), nullable=True)
    curriculum_data = Column(JSON, nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CurriculumSnapshot(Base):
    __tablename__ = "curriculum_snapshots"

    __table_args__ = (
        UniqueConstraint("curriculum_id", "version", name="uq_curriculum_snapshot_version"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curriculum_id = Column(UUID(as_uuid=True), ForeignKey("curriculum_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    patch_operation = Column(String(32), nullable=False, default="create")
    patch_payload = Column(JSON, nullable=False)
    curriculum_data = Column(JSON, nullable=False)
    created_by_teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    curriculum_id = Column(UUID(as_uuid=True), ForeignKey("curriculum_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    source_node_id = Column(String(255), nullable=True)
    sequence_number = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="unset")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ChapterAsset(Base):
    __tablename__ = "chapter_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(32), nullable=False)
    provider = Column(String(32), nullable=False, default="placeholder")
    integration_target = Column(String(64), nullable=False, default="placeholder")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    payload_json = Column(JSON, nullable=False)
    generation_status = Column(String(20), nullable=False, default="placeholder")
    external_url = Column(String(500), nullable=True)
    storage_bucket = Column(String(128), nullable=True)
    storage_key = Column(String(512), nullable=True)
    last_generated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assignment_type = Column(String(32), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    content_json = Column(JSON, nullable=False, default=dict)
    status = Column(String(20), nullable=False, default="queued")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class AssignmentRecipient(Base):
    __tablename__ = "assignment_recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ChapterAssetGenerationJob(Base):
    __tablename__ = "chapter_asset_generation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_asset_id = Column(UUID(as_uuid=True), ForeignKey("chapter_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(32), nullable=False)
    provider = Column(String(32), nullable=False)
    integration_target = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False, default="queued")
    attempt_count = Column(Integer, nullable=False, default=0)
    payload_json = Column(JSON, nullable=False)
    result_json = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    queued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)


class StudentAttempt(Base):
    __tablename__ = "student_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    score_understanding = Column(Integer, nullable=False, default=0)
    score_reasoning = Column(Integer, nullable=False, default=0)
    score_expression = Column(Integer, nullable=False, default=0)
    transcription_text = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    attempt_language = Column(String(20), nullable=False, default="english")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StudentDoubt(Base):
    __tablename__ = "student_doubts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(255), nullable=False)
    query_text = Column(Text, nullable=False)
    tried_before = Column(Boolean, nullable=False, default=False)
    attempt_text = Column(Text, nullable=True)
    clarification_video_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # "pending", "resolved"
    response_text = Column(Text, nullable=True)
    response_audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserQuota(Base):
    __tablename__ = "user_quotas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    doubt_videos_used_today = Column(Integer, nullable=False, default=0)
    playground_items_used_week = Column(Integer, nullable=False, default=0)
    last_doubt_reset = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_playground_reset = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
