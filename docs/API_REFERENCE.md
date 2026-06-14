# API Reference

This is a contract-style reference for the current Mootion backend endpoints.

## How To Read This File

For each endpoint, ask:

- what job does it do?
- when should the frontend call it?
- what data does it expect?
- what does it return?

The detailed behavior is documented in the domain docs:

- `AUTH_AND_RBAC.md`
- `ONBOARDING_AND_CLASSES.md`
- `CURRICULUM_MANUAL_FLOW.md`
- `CURRICULUM_PATCHING.md`
- `CHAPTERS.md`
- `ASSIGNMENTS.md`

## General Request Conventions

- Authenticated endpoints require `Authorization: Bearer <access_token>`.
- Teacher-only endpoints use `require_teacher`.
- Student-only endpoints use `require_student`.
- Curriculum patches require `expected_version`.

## Health

### `GET /`

Why it exists:

- lightweight server health check
- useful for deployment and local boot verification

## Auth

### `POST /auth/register`

Create a new teacher or student account.

See `AUTH_AND_RBAC.md` for the login bundle and identity model.

### `POST /auth/login`

Password login for an existing account.

### `POST /auth/refresh`

Exchange a refresh token for a new access token and refresh token pair.

### `POST /auth/logout`

Revoke the current refresh-token session.

### `POST /auth/google/start`

Start Google OAuth and tell the backend whether the user is coming in as a teacher or student.

### `GET /auth/google/callback`

Finish Google OAuth and return the token bundle.

### `GET /auth/me`

Return the current authenticated user profile.

## Teachers

### `GET /teachers/me`

Teacher profile endpoint.

### `POST /teachers/onboarding/preferences`

Set teacher onboarding preferences, currently language.

### `POST /teachers/onboarding/complete`

Mark teacher onboarding complete.

### `POST /teachers/classes`

Create a class for a grade and subject.

### `GET /teachers/classes`

List classes visible to the teacher.

## Students

### `GET /students/me`

Student profile endpoint.

### `POST /students/join-class`

Join a class by class code.

### `GET /students/classes`

List classes the student belongs to.

### `POST /students/language`

Set student language preference and mark onboarding complete.

## Curriculum

### `POST /teachers/classes/{class_id}/curriculum`

Create a manual curriculum tree for the class.

### `POST /teachers/classes/{class_id}/curriculum/bootstrap`

Create an NCERT preset curriculum for the class.

### `GET /teachers/classes/{class_id}/curriculum`

List all curricula for the class.

### `GET /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Fetch one curriculum tree and version.

### `PUT /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Replace curriculum metadata/tree.

### `PATCH /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Apply a tree patch and create a new snapshot.

## Chapters

### `POST /teachers/classes/{class_id}/chapters/bootstrap`

Turn curriculum root children into chapter rows with placeholder assets.

See `CHAPTERS.md` for the detailed purpose and usage.

### `GET /teachers/classes/{class_id}/chapters`

List chapters for the class.

### `GET /teachers/classes/{class_id}/chapters/{chapter_id}`

Fetch chapter details, including assets and generation metadata.

## Assignments

### `POST /teachers/classes/{class_id}/assignments`

Create a class-wide assignment for a chapter and queue activity generation.

### `GET /teachers/classes/{class_id}/assignments`

List assignments for the class.

### `GET /teachers/classes/{class_id}/assignments/{assignment_id}`

Fetch one assignment and its job state.

## Practical Flow

1. Authenticate.
2. Teacher creates or joins a class.
3. Teacher creates or bootstraps curriculum.
4. Teacher bootstraps chapters from the curriculum.
5. Teacher creates a class-wide assignment for one chapter and one activity type.
6. The backend queues generation jobs.
7. The frontend polls assignment and chapter detail to show the result.
