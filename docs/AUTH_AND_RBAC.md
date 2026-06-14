# Auth and RBAC

This document describes how identity, login, and role enforcement work in Mootion.

## Identity Model

- One internal `login_id` namespace is used for both teachers and students.
- `users` stores the canonical user profile.
- `oauth_accounts` stores linked external identity providers.
- `sessions` stores refresh-token sessions.

### User fields that matter

- `login_id` - the internal unique login.
- `role` - `teacher` or `student`.
- `full_name` - display name.
- `preferred_language` - onboarding preference.
- `onboarding_completed` - whether the user finished onboarding.

## Login Paths

### Password login

Endpoints:

- `POST /auth/register`
- `POST /auth/login`

These are the simplest flows for local development and direct account creation.

#### `POST /auth/register`

Use this when you want to create a brand-new account.

Request:

```json
{
  "login_id": "teacher_01",
  "full_name": "Asha Mehta",
  "role": "teacher",
  "password": "strong-password",
  "preferred_language": "english"
}
```

Response:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "role": "teacher",
  "user_id": "..."
}
```

#### `POST /auth/login`

Use this when the account already exists.

Request:

```json
{
  "login_id": "teacher_01",
  "password": "strong-password"
}
```

Response is the same token bundle as register.

### Google OAuth login

Endpoints:

- `POST /auth/google/start`
- `GET /auth/google/callback`

The start request includes the intended role:

- `teacher`
- `student`

That role is stored in OAuth state and used when the callback creates or links an account.

#### Why this exists

Teachers and students both use Google sign-in, but the app still needs to know which product path to put them in.

#### `POST /auth/google/start`

Request:

```json
{
  "role": "teacher"
}
```

Response:

```json
{
  "authorization_url": "https://accounts.google.com/..."
}
```

#### `GET /auth/google/callback`

The callback receives `code` and `state` from Google, exchanges the code, and returns the same token bundle as password login.

## Sessions

- Access tokens are JWTs.
- Refresh tokens are random strings.
- Refresh tokens are hashed with SHA-256 before storage.
- Refreshing a token revokes the old session and issues a new one.
- Logging out revokes the refresh-token session.

### Why refresh tokens are stored hashed

If the database is leaked, the raw refresh tokens are not directly reusable.

## RBAC Dependencies

The backend uses FastAPI dependencies rather than custom decorators.

- `get_current_user` - loads the authenticated user from the access token.
- `require_teacher` - only allows users with the teacher role.
- `require_student` - only allows users with the student role.

These are placed directly in route signatures, so the access rules are obvious from the endpoint definition.

## Current Auth Endpoints

### `GET /auth/me`

Use this to fetch the currently authenticated profile.

Why it exists:

- the frontend needs a simple way to know who is signed in
- it confirms auth state after refresh

Response includes:

- `user_id`
- `login_id`
- `role`
- `full_name`
- `preferred_language`
- `onboarding_completed`

### `POST /auth/refresh`

Use this when the access token expires and you still have a valid refresh token.

### `POST /auth/logout`

Use this to revoke the refresh token session.

## Notes

- Swagger can authorize using the access token as a bearer token.
- No custom auth decorators are used.
- Role checks are always explicit in route signatures.
