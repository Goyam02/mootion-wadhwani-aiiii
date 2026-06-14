from __future__ import annotations

from datetime import datetime, timezone, timedelta
from secrets import token_urlsafe
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.models import OAuthAccount, OAuthState, Session as AuthSession, User
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    login_id: str = Field(min_length=3, max_length=64)
    full_name: str = Field(min_length=1, max_length=255)
    role: str = Field(pattern="^(teacher|student)$")
    password: str = Field(min_length=8, max_length=128)
    preferred_language: str = Field(default="english")


class LoginRequest(BaseModel):
    login_id: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class RefreshRequest(BaseModel):
    refresh_token: str


class OAuthStartResponse(BaseModel):
    authorization_url: str


class OAuthCallbackResponse(TokenResponse):
    pass


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    db.add(
        AuthSession(
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            expires_at=expires_at,
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=str(user.id),
    )


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.login_id == request.login_id))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="login_id already exists")

    user = User(
        login_id=request.login_id,
        role=request.role,
        full_name=request.full_name,
        password_hash=hash_password(request.password),
        preferred_language=request.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_tokens(db, user)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.login_id == request.login_id))
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return _issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    session_row = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == hash_refresh_token(request.refresh_token)))
    if not session_row or session_row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.get(User, session_row.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session_row.revoked_at = datetime.now(timezone.utc)
    db.commit()

    return _issue_tokens(db, user)


@router.post("/logout")
def logout(request: RefreshRequest, db: Session = Depends(get_db)):
    session_row = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == hash_refresh_token(request.refresh_token)))
    if not session_row or session_row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    session_row.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.get("/google/start", response_model=OAuthStartResponse)
def google_start(db: Session = Depends(get_db)):
    if not settings.google_oauth_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

    state = token_urlsafe(32)
    db.add(
        OAuthState(
            provider="google",
            state=state,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
    )
    db.commit()

    params = urlencode(
        {
            "client_id": settings.google_oauth_client_id,
            "redirect_uri": settings.google_oauth_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    return OAuthStartResponse(authorization_url=f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback", response_model=OAuthCallbackResponse)
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

    state_row = db.scalar(select(OAuthState).where(OAuthState.provider == "google", OAuthState.state == state))
    if not state_row or state_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    token_payload = {
        "code": code,
        "client_id": settings.google_oauth_client_id,
        "client_secret": settings.google_oauth_client_secret,
        "redirect_uri": settings.google_oauth_redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        token_response = await client.post("https://oauth2.googleapis.com/token", data=token_payload)
        if token_response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token exchange failed")

        token_data = token_response.json()
        id_token = token_data.get("id_token")
        if not id_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google ID token missing")

        userinfo_response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google profile fetch failed")

    profile = userinfo_response.json()
    provider_user_id = profile.get("sub")
    email = profile.get("email")
    full_name = profile.get("name") or email or "Google User"

    oauth_account = db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.provider == "google",
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )

    if oauth_account:
        user = db.get(User, oauth_account.user_id)
    else:
        user = db.scalar(select(User).where(User.login_id == email)) if email else None
        if not user:
            user = User(
                login_id=email or provider_user_id,
                role="student",
                full_name=full_name,
                password_hash=hash_password(token_urlsafe(24)),
                preferred_language="english",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        db.add(
            OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=provider_user_id,
                email=email,
            )
        )
        db.commit()

    db.delete(state_row)
    db.commit()

    return _issue_tokens(db, user)
