from __future__ import annotations

from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.models import Session as AuthSession, User
from app.core.security import create_access_token, create_refresh_token, hash_password, hash_refresh_token, verify_password
from app.repositories.auth_repository import (
    create_session,
    create_user,
    get_session_by_refresh_hash,
    get_user_by_login_id,
    get_user_by_id,
    revoke_session,
)
from app.schemas.auth import LoginRequest, OAuthStartRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.services.oauth.google import build_google_authorization_url, complete_google_oauth


def issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token()

    create_session(
        db,
        AuthSession(
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        ),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=str(user.id),
    )


def register_user(db: Session, request: RegisterRequest) -> TokenResponse:
    existing_user = get_user_by_login_id(db, request.login_id)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="login_id already exists")

    user = create_user(
        db,
        User(
            login_id=request.login_id,
            role=request.role,
            full_name=request.full_name,
            password_hash=hash_password(request.password),
            preferred_language=request.preferred_language,
        ),
    )
    return issue_tokens(db, user)


def login_user(db: Session, request: LoginRequest) -> TokenResponse:
    user = get_user_by_login_id(db, request.login_id)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return issue_tokens(db, user)


def refresh_user_tokens(db: Session, request: RefreshRequest) -> TokenResponse:
    session_row = get_session_by_refresh_hash(db, hash_refresh_token(request.refresh_token))
    if not session_row or session_row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Enforce refresh token expiry
    if session_row.expires_at and session_row.expires_at < datetime.now(timezone.utc):
        revoke_session(db, session_row)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = get_user_by_id(db, session_row.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    revoke_session(db, session_row)
    return issue_tokens(db, user)


def logout_user(db: Session, request: RefreshRequest) -> dict[str, bool]:
    session_row = get_session_by_refresh_hash(db, hash_refresh_token(request.refresh_token))
    if not session_row or session_row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Enforce refresh token expiry
    if session_row.expires_at and session_row.expires_at < datetime.now(timezone.utc):
        revoke_session(db, session_row)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    revoke_session(db, session_row)
    return {"ok": True}


def google_start_url(db: Session, request: OAuthStartRequest) -> str:
    return build_google_authorization_url(db, requested_role=request.role)


async def google_callback_login(db: Session, code: str, state: str) -> TokenResponse:
    user = await complete_google_oauth(db, code=code, state=state)
    return issue_tokens(db, user)
