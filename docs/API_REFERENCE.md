# API Reference

This document is the canonical backend contract for Mootion.

It covers every route exposed by the current FastAPI backend, including auth, onboarding, curriculum, chapters, assignments, media, simulations, student doubts, analytics, quotas, and the student-only `chat-with-ai` agent.

## Conventions

- Base URL in local development is usually `http://localhost:8000`.
- Authenticated requests must send `Authorization: Bearer <access_token>` unless the endpoint is explicitly public.
- Teacher-only endpoints use `require_teacher`.
- Student-only endpoints use `require_student`.
- IDs are serialized as strings.
- Dates and timestamps are returned as ISO 8601 strings or native JSON datetime serialization from FastAPI/Pydantic.
- Most error responses use the shape `{"detail": "..."}`.
- Validation errors from FastAPI/Pydantic use the standard `422` response with a `detail` array.

## Health

### `GET /`

Purpose:

- lightweight health check
- used for boot verification and deployment probes

Auth:

- none

Response:

```json
{ "status": "ok" }
```

## Auth

### `POST /auth/register`

Purpose:

- create a new teacher or student account

Auth:

- none

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `login_id` | yes | string | 3 to 64 characters |
| `full_name` | yes | string | 1 to 255 characters |
| `role` | yes | string | Must be `teacher` or `student` |
| `password` | yes | string | 8 to 128 characters |
| `preferred_language` | no | string | Defaults to `english` |

Sample request:

```json
{
  "login_id": "teacher.raj",
  "full_name": "Raj Sharma",
  "role": "teacher",
  "password": "StrongPass123",
  "preferred_language": "english"
}
```

Success response:

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "rft_...",
  "token_type": "bearer",
  "role": "teacher",
  "user_id": "2f7c7a53-ff5f-4f6e-a3fd-7a3d08df1d7d"
}
```

Common errors:

- `400` for invalid payload values
- `409` if the login ID already exists

### `POST /auth/login`

Purpose:

- login an existing user with username and password

Auth:

- none

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `login_id` | yes | string | 3 to 64 characters |
| `password` | yes | string | 1 to 128 characters |

Sample request:

```json
{
  "login_id": "student.ani",
  "password": "StrongPass123"
}
```

Success response:

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "rft_...",
  "token_type": "bearer",
  "role": "student",
  "user_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f"
}
```

Common errors:

- `401` if credentials are invalid

### `POST /auth/refresh`

Purpose:

- exchange a refresh token for a new access token and refresh token pair

Auth:

- none

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `refresh_token` | yes | string | Must be a valid refresh token previously issued by the backend |

Sample request:

```json
{
  "refresh_token": "rft_..."
}
```

Success response:

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "rft_...",
  "token_type": "bearer",
  "role": "student",
  "user_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f"
}
```

Common errors:

- `401` if the refresh token is invalid, expired, or revoked

### `POST /auth/logout`

Purpose:

- revoke the current refresh-token session

Auth:

- none, but the request body must contain the refresh token

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `refresh_token` | yes | string | The refresh token to revoke |

Sample request:

```json
{
  "refresh_token": "rft_..."
}
```

Success response:

```json
{ "ok": true }
```

### `POST /auth/google/start`

Purpose:

- start Google OAuth for either teacher or student login

Auth:

- none

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `role` | yes | string | Must be `teacher` or `student` |

Sample request:

```json
{
  "role": "student"
}
```

Success response:

```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### `GET /auth/google/callback`

Purpose:

- complete Google OAuth and issue the token bundle

Auth:

- none

Query parameters:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `code` | yes | string | OAuth authorization code |
| `state` | yes | string | OAuth state value issued at start |

Success response:

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "rft_...",
  "token_type": "bearer",
  "role": "student",
  "user_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f"
}
```

### `GET /auth/me`

Purpose:

- fetch the current authenticated user profile

Auth:

- bearer token required

Success response:

```json
{
  "user_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "login_id": "student.ani",
  "role": "student",
  "full_name": "Anika Jain",
  "preferred_language": "english",
  "onboarding_completed": true
}
```

## Teachers

### `GET /teachers/me`

Purpose:

- fetch the current teacher profile

Auth:

- bearer token required
- teacher role required

Success response:

```json
{
  "user_id": "2f7c7a53-ff5f-4f6e-a3fd-7a3d08df1d7d",
  "login_id": "teacher.raj",
  "role": "teacher",
  "full_name": "Raj Sharma",
  "preferred_language": "english",
  "onboarding_completed": false
}
```

### `POST /teachers/onboarding/preferences`

Purpose:

- set teacher onboarding preferences
- currently only updates preferred language
- also ensures the teacher is attached to the hidden default school

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `preferred_language` | no | string | Defaults to `english` |

Sample request:

```json
{
  "preferred_language": "hindi"
}
```

Success response:

```json
{
  "preferred_language": "hindi"
}
```

### `POST /teachers/onboarding/complete`

Purpose:

- mark teacher onboarding as complete

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `load_ncert` | no | boolean | Defaults to `true`; currently returned as an acknowledgement flag |

Sample request:

```json
{
  "load_ncert": true
}
```

Success response:

```json
{
  "onboarding_completed": true,
  "ncert_requested": true
}
```

### `POST /teachers/classes`

Purpose:

- create a class for a grade and subject

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `grade` | yes | string | 1 to 16 characters |
| `subject` | yes | string | Must currently be one of `Physics`, `Mathematics`, `Chemistry`, `Biology`, `Computer Science` |

Sample request:

```json
{
  "grade": "8",
  "subject": "Physics"
}
```

Success response:

```json
{
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "class_code": "A1B2C3D4",
  "display_name": "Class 8 - Physics",
  "grade": "8",
  "subject": "Physics"
}
```

Common errors:

- `400` for unsupported subject

### `GET /teachers/classes`

Purpose:

- list classes visible to the teacher

Auth:

- bearer token required
- teacher role required

Success response:

```json
[
  {
    "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
    "class_code": "A1B2C3D4",
    "display_name": "Class 8 - Physics",
    "grade": "8",
    "subject": "Physics"
  }
]
```

### `GET /teachers/classes/{class_id}/analytics/overview`

Purpose:

- class-level analytics summary for teacher dashboards

Auth:

- bearer token required
- teacher role required

Response fields:

| Field | Type | Notes |
|---|---|---|
| `average_scores` | object | Keys: `understanding`, `reasoning`, `expression` |
| `task_completion_rate` | number | Percentage value, 0 to 100 |
| `most_common_misconception` | string | Short summary |
| `misconception_count` | integer | Count used by analytics UI |
| `recent_activities` | array | List of recent student activity objects |

Sample response:

```json
{
  "average_scores": {
    "understanding": 2.4,
    "reasoning": 2.1,
    "expression": 2.7
  },
  "task_completion_rate": 75,
  "most_common_misconception": "Students tend to confuse speed and acceleration under gravity.",
  "misconception_count": 2,
  "recent_activities": [
    {
      "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
      "student_name": "Anika Jain",
      "chapter_title": "Force and Energy",
      "activity_type": "explain_it",
      "score": 3,
      "date": "04:15 PM, Jun 18"
    }
  ]
}
```

### `GET /teachers/classes/{class_id}/chapters/{chapter_id}/analytics`

Purpose:

- chapter-level analytics drilldown for teacher dashboards

Auth:

- bearer token required
- teacher role required

Response shape:

| Field | Type | Notes |
|---|---|---|
| `chapter_id` | string | Chapter ID |
| `chapter_title` | string | Chapter title |
| `scores_distribution` | object | `understanding`, `reasoning`, `expression`, each with buckets `0` to `3` |
| `top_misconceptions` | array | `{text, percentage}` items |
| `student_scores` | array | Per-student score rows |

Sample response:

```json
{
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "chapter_title": "Electric Current",
  "scores_distribution": {
    "understanding": { "0": 0, "1": 2, "2": 8, "3": 6 },
    "reasoning": { "0": 1, "1": 3, "2": 7, "3": 5 },
    "expression": { "0": 0, "1": 1, "2": 9, "3": 6 }
  },
  "top_misconceptions": [
    { "text": "Electricity moves like water...", "percentage": 40 },
    { "text": "A battery contains charge particles directly...", "percentage": 20 }
  ],
  "student_scores": [
    {
      "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
      "student_name": "Anika Jain",
      "understanding": 3,
      "reasoning": 2,
      "expression": 3,
      "last_active": "04:10 PM"
    }
  ]
}
```

### `GET /teachers/students/{student_id}/analytics`

Purpose:

- student-level analytics drilldown for teacher dashboards

Auth:

- bearer token required
- teacher role required

Response shape:

| Field | Type | Notes |
|---|---|---|
| `student_id` | string | Student ID |
| `student_name` | string | Student full name |
| `streak` | integer | Current streak value returned by the service |
| `score_timeline` | array | Recent per-chapter scores |
| `misconceptions_history` | array | Current service returns `resolved` / `unresolved` statuses |
| `prediction_accuracy` | number | Percentage |
| `language_ratio` | object | Keys: `hindi`, `english`, `gujarati` |
| `explain_excerpts` | array | Short excerpts from student explanations |

Sample response:

```json
{
  "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "student_name": "Anika Jain",
  "streak": 5,
  "score_timeline": [
    {
      "chapter_title": "Electric Current",
      "understanding": 3,
      "reasoning": 2,
      "expression": 3
    }
  ],
  "misconceptions_history": [
    { "text": "Heat goes up because hot objects have negative mass.", "status": "resolved" },
    { "text": "Light waves need medium to travel.", "status": "unresolved" }
  ],
  "prediction_accuracy": 75,
  "language_ratio": {
    "hindi": 0.2,
    "english": 0.8,
    "gujarati": 0
  },
  "explain_excerpts": [
    { "text": "Electron flow is slow...", "is_strong": true, "concept": "Electric Current" }
  ]
}
```

### `GET /teachers/classes/{class_id}/doubts`

Purpose:

- list all student doubts for a class

Auth:

- bearer token required
- teacher role required

Response model:

- array of `StudentDoubtResponse`

### `POST /teachers/doubts/{doubt_id}/respond`

Purpose:

- post a teacher response to a student doubt

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `response_text` | yes | string | Teacher explanation text |
| `voice_note_file_url` | no | string or null | Optional audio attachment URL |

Sample request:

```json
{
  "response_text": "Think of current as the rate of charge flow...",
  "voice_note_file_url": null
}
```

Success response:

```json
{
  "doubt_id": "91c4bd99-c1e7-4a73-9d3b-cf9d6f8a0f74",
  "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "student_name": "Anika Jain",
  "topic": "Electric Current",
  "query_text": "Why is drift velocity slow but the bulb lights instantly?",
  "tried_before": true,
  "attempt_text": "I think electrons move quickly...",
  "clarification_video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
  "status": "resolved",
  "response_text": "Think of current as the rate of charge flow...",
  "response_audio_url": null,
  "created_at": "2026-06-18T10:15:00+00:00"
}
```

## Students

### `GET /students/me`

Purpose:

- fetch the current student profile

Auth:

- bearer token required
- student role required

Success response:

```json
{
  "user_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "login_id": "student.ani",
  "role": "student",
  "full_name": "Anika Jain",
  "preferred_language": "english",
  "onboarding_completed": true
}
```

### `POST /students/join-class`

Purpose:

- join a class by class code

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `class_code` | yes | string | 3 to 32 characters |

Sample request:

```json
{
  "class_code": "A1B2C3D4"
}
```

Success response:

```json
{
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "class_code": "A1B2C3D4",
  "display_name": "Class 8 - Physics",
  "joined": true
}
```

### `GET /students/classes`

Purpose:

- list classes the student belongs to

Auth:

- bearer token required
- student role required

Success response:

```json
[
  {
    "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
    "class_code": "A1B2C3D4",
    "display_name": "Class 8 - Physics",
    "grade": "8",
    "subject": "Physics"
  }
]
```

### `POST /students/language`

Purpose:

- set the student language preference and mark onboarding complete

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `preferred_language` | no | string | Defaults to `english` |

Sample request:

```json
{
  "preferred_language": "gujarati"
}
```

Success response:

```json
{
  "preferred_language": "gujarati"
}
```

### `POST /students/doubts`

Purpose:

- submit a doubt for teacher review

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `class_id` | yes | string | The class the doubt belongs to |
| `query_text` | yes | string | Student question |
| `tried_before` | no | boolean | Defaults to `false` |
| `attempt_text` | no | string or null | Student's own attempt or explanation |

Sample request:

```json
{
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "query_text": "Why does the bulb light instantly if electrons move slowly?",
  "tried_before": true,
  "attempt_text": "I think the battery pushes charges through the wire."
}
```

Success response:

```json
{
  "doubt_id": "91c4bd99-c1e7-4a73-9d3b-cf9d6f8a0f74",
  "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "student_name": "Anika Jain",
  "topic": "Electric Current",
  "query_text": "Why does the bulb light instantly if electrons move slowly?",
  "tried_before": true,
  "attempt_text": "I think the battery pushes charges through the wire.",
  "clarification_video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
  "status": "pending",
  "response_text": null,
  "response_audio_url": null,
  "created_at": "2026-06-18T10:15:00+00:00"
}
```

Notes:

- The backend consumes the student doubt quota when this endpoint is called.
- The backend also attempts to generate a clarification video URL.

### `GET /students/quotas`

Purpose:

- fetch current student quota usage

Auth:

- bearer token required
- student role required

Success response:

```json
{
  "doubt_videos_used_today": 2,
  "doubt_videos_max": 5,
  "playground_items_used_week": 4,
  "playground_items_max": 10
}
```

### `POST /students/playground/generate`

Purpose:

- generate a private student playground asset

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `topic` | yes | string | Topic to generate around |
| `asset_type` | yes | string | Current backend accepts `video`, `simulation`, `model`, or `three_d_model` |

Sample request:

```json
{
  "topic": "Ohm's law",
  "asset_type": "simulation"
}
```

Success response examples:

```json
{
  "success": true,
  "asset_type": "simulation",
  "external_url": "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html",
  "error_message": null
}
```

```json
{
  "success": true,
  "asset_type": "three_d_model",
  "external_url": "https://sketchfab.com/...",
  "error_message": null
}
```

## Curriculum

### `POST /teachers/classes/{class_id}/curriculum`

Purpose:

- create a manual curriculum tree for a class

Auth:

- bearer token required
- teacher role required

Current backend behavior:

- the create endpoint currently accepts `source_type: manual` only
- any other source type returns `501 Not Implemented`

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `title` | yes | string | Curriculum title |
| `curriculum_data` | yes | object | `CurriculumRoadmapData` |
| `status` | no | string | Defaults to `draft`; allowed values `draft`, `active`, `archived` |

`CurriculumRoadmapData` fields:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `version` | no | string | Defaults to `1.0` |
| `title` | yes | string | Root title, must match curriculum title |
| `subject` | no | string or null | Optional subject label |
| `grade` | no | string or null | Optional grade label |
| `source_type` | no | string | Defaults to `manual` |
| `source_text` | no | string or null | Optional source text |
| `source_subject` | no | string or null | Optional source subject |
| `document_id` | no | string or null | Optional linked document id |
| `root` | yes | object | Root tree node |
| `nodes` | no | array | Graph nodes are derived from `root` when possible |
| `edges` | no | array | Graph edges are derived from `root` when possible |

`CurriculumTreeNode` fields:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `id` | yes | string | Unique node id |
| `title` | yes | string | 1 to 255 characters |
| `kind` | no | string | `module`, `unit`, `topic`, `subtopic`, or `lesson` |
| `order` | no | integer | Defaults to `0` |
| `metadata` | no | object | Arbitrary node metadata |
| `children` | no | array | Nested child nodes |

Sample request:

```json
{
  "title": "Physics Core",
  "curriculum_data": {
    "title": "Physics Core",
    "subject": "Physics",
    "grade": "8",
    "source_type": "manual",
    "root": {
      "id": "root",
      "title": "Physics Core",
      "kind": "module",
      "order": 0,
      "metadata": {},
      "children": [
        {
          "id": "unit_1",
          "title": "Force and Motion",
          "kind": "unit",
          "order": 0,
          "metadata": {},
          "children": []
        }
      ]
    }
  },
  "status": "draft"
}
```

Success response:

```json
{
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "version": 1,
  "title": "Physics Core",
  "source_type": "manual",
  "source_text": null,
  "source_subject": null,
  "document_id": null,
  "curriculum_data": {
    "version": "1.0",
    "title": "Physics Core",
    "subject": "Physics",
    "grade": "8",
    "source_type": "manual",
    "source_text": null,
    "source_subject": null,
    "document_id": null,
    "root": {
      "id": "root",
      "title": "Physics Core",
      "kind": "module",
      "order": 0,
      "metadata": {},
      "children": []
    },
    "nodes": [
      { "id": "root", "title": "Physics Core", "kind": "module", "order": 0, "metadata": {} }
    ],
    "edges": []
  },
  "status": "draft"
}
```

### `POST /teachers/classes/{class_id}/curriculum/bootstrap`

Purpose:

- create an NCERT preset curriculum for the class

Auth:

- bearer token required
- teacher role required

Behavior:

- uses the class grade and subject to build a preset curriculum tree
- supported subjects in presets are Physics, Mathematics, Chemistry, Biology, and Computer Science

Success response:

```json
{
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "version": 1,
  "title": "NCERT Physics - Class 8",
  "source_type": "ncert",
  "source_text": "NCERT preset scaffold for Class 8 Physics",
  "source_subject": "Physics",
  "document_id": null,
  "curriculum_data": { "...": "..." },
  "status": "draft"
}
```

### `GET /teachers/classes/{class_id}/curriculum`

Purpose:

- list all curricula for a class

Auth:

- bearer token required
- teacher role required

Response model:

- array of `CurriculumListItem`

### `GET /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Purpose:

- fetch one curriculum tree and version

Auth:

- bearer token required
- teacher role required

Response model:

- `CurriculumResponse`

### `PUT /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Purpose:

- replace curriculum metadata/tree

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `title` | no | string or null | Optional new title |
| `curriculum_data` | no | object or null | Optional full `CurriculumRoadmapData` replacement |
| `status` | no | string or null | `draft`, `active`, or `archived` |

Notes:

- if `curriculum_data` is supplied, the backend rewrites the payload title to match the request title when present
- the curriculum version increments on update
- a snapshot is stored after every update

### `PATCH /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Purpose:

- apply a tree patch and create a versioned snapshot

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `operation` | yes | string | `add_node`, `update_node`, `delete_node`, or `move_node` |
| `expected_version` | yes | integer | Must match the current curriculum version |
| `target_node_id` | no | string or null | Required for `update_node`, `delete_node`, and `move_node` |
| `parent_node_id` | no | string or null | Required for `add_node` and `move_node` |
| `position` | no | integer or null | Optional insertion index |
| `payload` | no | object | Operation-specific payload |

Operation rules:

- `add_node` requires `parent_node_id` and `payload.title`
- `update_node` requires `target_node_id`
- `delete_node` requires `target_node_id`
- `move_node` requires `target_node_id` and `parent_node_id`
- `move_node` only allows moves within the same parent; moving across parents returns `400`
- version mismatch returns `409`

Sample `add_node` request:

```json
{
  "operation": "add_node",
  "expected_version": 1,
  "parent_node_id": "root",
  "position": 0,
  "payload": {
    "title": "Force and Motion",
    "kind": "unit",
    "metadata": { "lesson_count": 3 }
  }
}
```

Success response:

```json
{
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "version": 2,
  "title": "Physics Core",
  "source_type": "manual",
  "source_text": null,
  "source_subject": null,
  "document_id": null,
  "curriculum_data": { "...": "..." },
  "status": "draft"
}
```

## Chapters

### `POST /teachers/classes/{class_id}/chapters/bootstrap`

Purpose:

- convert curriculum root children into chapter rows and create placeholder assets

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `curriculum_id` | yes | string | Curriculum to bootstrap from |

Sample request:

```json
{
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d"
}
```

Success response:

```json
{
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d",
  "created_chapters": 4
}
```

### `GET /teachers/classes/{class_id}/chapters`

Purpose:

- list chapters for a class

Auth:

- bearer token required
- teacher role required

Response model:

- array of `ChapterListItem`

Chapter list fields:

| Field | Type | Notes |
|---|---|---|
| `chapter_id` | string | Chapter ID |
| `class_id` | string | Class ID |
| `sequence_number` | integer | Chapter order |
| `title` | string | Chapter title |
| `status` | string | Usually `unset`, `generated`, `active`, or `data_ready` |
| `asset_count` | integer | Number of assets attached to the chapter |

### `GET /teachers/classes/{class_id}/chapters/{chapter_id}`

Purpose:

- fetch one chapter with its assets

Auth:

- bearer token required
- teacher role required

Response model:

- `ChapterResponse`

Chapter asset fields:

| Field | Type | Notes |
|---|---|---|
| `asset_id` | string | Asset ID |
| `asset_type` | string | `concept_video`, `simulation`, `three_d_model`, `quiz`, `explain_it`, `predict_it`, `spot_it`, or `connect_it` |
| `provider` | string | Generation provider name |
| `integration_target` | string | Frontend/runtime integration target |
| `title` | string | Asset title |
| `description` | string or null | Asset description |
| `generation_status` | string | `placeholder`, `queued`, `processing`, `ready`, `failed` |
| `external_url` | string or null | Signed playback URL or external embed URL |
| `payload_json` | object | Provider-specific metadata and generated content |

Sample response excerpt:

```json
{
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "curriculum_id": "6b9a7d9a-4d8f-4c43-9a54-8f67ed0f8c1d",
  "source_node_id": "unit_1",
  "sequence_number": 0,
  "title": "Force and Motion",
  "status": "unset",
  "assets": [
    {
      "asset_id": "a1088c13-a663-4b2c-850e-243f4d874dbc",
      "asset_type": "concept_video",
      "provider": "manim",
      "integration_target": "manim_generator",
      "title": "Concept Video",
      "description": "Placeholder for the AI-generated concept video.",
      "generation_status": "placeholder",
      "external_url": null,
      "payload_json": {
        "placeholder": true,
        "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211"
      }
    }
  ]
}
```

## Assignments

### `POST /teachers/classes/{class_id}/assignments`

Purpose:

- create a class-wide assignment for a chapter
- automatically creates recipients for all students in the class
- automatically queues generation jobs for applicable chapter assets

Auth:

- bearer token required
- teacher role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `chapter_id` | yes | string | Chapter to attach the assignment to |
| `assignment_type` | yes | string | One of `video`, `simulation`, `model`, `quiz`, `explain_ai`, `predict_ai`, `spot_it`, `connect_it` |
| `title` | yes | string | Assignment title |
| `instructions` | no | string or null | Optional teacher instructions |

Sample request:

```json
{
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "assignment_type": "quiz",
  "title": "Quiz on Force and Motion",
  "instructions": "Answer carefully and review the chapter first."
}
```

Success response:

```json
{
  "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "assignment_type": "quiz",
  "title": "Quiz on Force and Motion",
  "instructions": "Answer carefully and review the chapter first.",
  "content_json": {
    "placeholder": true,
    "assignment_type": "quiz",
    "activity": "quiz",
    "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
    "chapter_title": "Force and Motion"
  },
  "status": "queued",
  "recipients": [
    { "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f" }
  ],
  "jobs": [
    {
      "job_id": "32b0b079-3f73-4d2c-99ba-358c149af30a",
      "asset_id": "a1088c13-a663-4b2c-850e-243f4d874dbc",
      "asset_type": "quiz",
      "provider": "quiz_generator",
      "integration_target": "quiz_builder",
      "status": "queued",
      "result_json": null,
      "error_message": null
    }
  ]
}
```

### `GET /teachers/classes/{class_id}/assignments`

Purpose:

- list teacher-visible assignments for a class

Auth:

- bearer token required
- teacher role required

Response model:

- array of `AssignmentListItem`

List fields:

| Field | Type | Notes |
|---|---|---|
| `assignment_id` | string | Assignment ID |
| `class_id` | string | Class ID |
| `chapter_id` | string | Chapter ID |
| `assignment_type` | string | Assignment type |
| `title` | string | Assignment title |
| `status` | string | `queued`, `processing`, `ready`, `failed` |
| `recipient_count` | integer | Number of students assigned |
| `job_count` | integer | Number of generation jobs |

### `GET /teachers/classes/{class_id}/assignments/{assignment_id}`

Purpose:

- fetch one teacher-visible assignment and its jobs

Auth:

- bearer token required
- teacher role required

Response model:

- `AssignmentResponse`

### `GET /students/classes/{class_id}/assignments`

Purpose:

- list assignments visible to a student for one class

Auth:

- bearer token required
- student role required

Response model:

- array of `StudentAssignmentListItem`

Student assignment list fields:

| Field | Type | Notes |
|---|---|---|
| `assignment_id` | string | Assignment ID |
| `class_id` | string | Class ID |
| `chapter_id` | string | Chapter ID |
| `assignment_type` | string | Assignment type |
| `title` | string | Assignment title |
| `status` | string | `queued`, `processing`, `ready`, `failed` |
| `job_count` | integer | Number of generation jobs |

### `GET /students/classes/{class_id}/assignments/{assignment_id}`

Purpose:

- fetch one student-visible assignment for a class

Auth:

- bearer token required
- student role required

Response model:

- `StudentAssignmentResponse`

### `POST /students/classes/{class_id}/assignments/{assignment_id}/submit`

Purpose:

- submit a spoken or transcribed attempt for grading

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `transcription_text` | yes | string | Student explanation text |
| `language` | no | string | Defaults to `english` |

Sample request:

```json
{
  "transcription_text": "Current is the flow of electric charge through a conductor.",
  "language": "english"
}
```

Success response:

```json
{
  "attempt_id": "2f0b2f2e-1dfb-4a20-a8d8-8f57b6a5ec3d",
  "score_understanding": 3,
  "score_reasoning": 2,
  "score_expression": 3,
  "ai_feedback": "Good explanation. You identified charge flow correctly..."
}
```

## Media

### `GET /media/assets/{asset_id}`

Purpose:

- compatibility playback endpoint for generated media
- redirects to a signed object-storage URL when stored media exists
- falls back to `external_url` when there is no object-storage asset yet

Auth:

- none

Behavior:

- returns `302` redirect on success
- returns `404` if the asset does not exist or has no media available

### `GET /media/assets/{asset_id}/signed-url`

Purpose:

- return a signed object-storage URL for the asset

Auth:

- bearer token required

Access control:

- teachers can fetch signed URLs for assets in classes they teach
- students can fetch signed URLs for assets in classes they belong to

Response model:

```json
{
  "asset_id": "a1088c13-a663-4b2c-850e-243f4d874dbc",
  "signed_url": "https://...",
  "expires_in_minutes": 15
}
```

## Simulations

### `POST /simulations/generate`

Purpose:

- generate a simulation from a free-form prompt

Auth:

- bearer token required
- any authenticated user can call it

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `prompt` | yes | string | Must be at least 3 characters |

Sample request:

```json
{
  "prompt": "Explain projectile motion with adjustable angle and velocity"
}
```

Response model:

| Field | Type | Notes |
|---|---|---|
| `simulation_id` | string | Generated ID |
| `status` | string | Simulation phase, usually `completed` or `failed` |
| `html` | string | Generated HTML |
| `spec` | object or null | Simulation specification |
| `validation` | object or null | Validation result |
| `quality_score` | number | 0 to 1 in the API response |
| `assessments` | array | Assessment prompts |
| `error` | string or null | Error message if generation failed |
| `duration_ms` | number | Runtime duration |

Sample response:

```json
{
  "simulation_id": "d8a4d2cc-6ec9-4f14-b4a8-3ff2bbf7fd60",
  "status": "completed",
  "html": "<html>...</html>",
  "spec": { "subject": "physics", "topic": "projectile motion", "simulation_type": "projectile_motion" },
  "validation": { "passed": true, "score": 0.92, "checks": [], "errors": [], "warnings": [] },
  "quality_score": 0.88,
  "assessments": [
    { "id": "a1", "type": "mcq", "question": "What happens when angle increases?", "hint": "Think about horizontal range.", "difficulty": "medium", "learning_goal": "Understand trajectory changes" }
  ],
  "error": null,
  "duration_ms": 2450
}
```

### `POST /simulations/generate-from-spec`

Purpose:

- generate a simulation from a structured specification

Auth:

- bearer token required
- any authenticated user can call it

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `spec` | yes | object | Must match `SimulationSpecification` |

Minimal spec fields:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `subject` | yes | string | `physics`, `chemistry`, `biology`, or `mathematics` |
| `topic` | yes | string | Simulation topic |
| `simulation_type` | yes | string | See simulation schema enum |
| `title` | yes | string | Human-readable title |

Optional spec fields:

| Field | Type | Notes |
|---|---|---|
| `learning_objectives` | array | Default empty |
| `entities` | array | Default empty |
| `parameters` | array | Default empty |
| `equations` | array | Default empty |
| `constraints` | array | Default empty |
| `visualizations` | array | Default empty |
| `graphs` | array | Default empty |
| `assessment_prompts` | array | Default empty |
| `canvas_width` | integer | Default `600` |
| `canvas_height` | integer | Default `400` |
| `background_color` | string | Default `#0f172a` |
| `grid_enabled` | boolean | Default `true` |
| `interaction_mode` | string | Default `direct` |
| `grade_level` | string | Default `high_school` |
| `duration_minutes` | integer | Default `10` |
| `raw_spec` | object | Default empty |

Sample request:

```json
{
  "spec": {
    "subject": "physics",
    "topic": "projectile motion",
    "simulation_type": "projectile_motion",
    "title": "Projectile Motion Explorer"
  }
}
```

### `GET /simulations/supported-subjects`

Purpose:

- list supported simulation subjects and topics

Auth:

- none

Sample response:

```json
[
  {
    "id": "physics",
    "name": "Physics",
    "topics": ["kinematics", "projectile_motion", "forces", "energy", "electricity", "waves"],
    "icon": "atom"
  }
]
```

### `GET /simulations/example-prompts`

Purpose:

- return example prompts for the simulation engine

Auth:

- none

Response:

```json
{
  "prompts": [
    "Explain projectile motion",
    "Show me membrane transport"
  ]
}
```

### `GET /simulations/{simulation_id}`

Purpose:

- fetch a simulation result by ID

Auth:

- none

Response model:

- same shape as `POST /simulations/generate`

### `GET /simulations/{simulation_id}/html`

Purpose:

- fetch the generated simulation HTML as `text/html`

Auth:

- none

Behavior:

- returns `425 Too Early` if the simulation is not completed yet

### `POST /simulations/{simulation_id}/assess`

Purpose:

- return assessment prompts for a generated simulation

Auth:

- none

Response:

```json
{
  "simulation_id": "d8a4d2cc-6ec9-4f14-b4a8-3ff2bbf7fd60",
  "assessments": [
    {
      "id": "a1",
      "type": "mcq",
      "question": "What happens when angle increases?",
      "hint": "Think about horizontal range.",
      "difficulty": "medium",
      "learning_goal": "Understand trajectory changes"
    }
  ],
  "spec": { "subject": "physics", "topic": "projectile motion", "simulation_type": "projectile_motion" }
}
```

## Student Doubts

### `POST /students/doubts`

Purpose:

- create a teacher-visible doubt record

Auth:

- bearer token required
- student role required

Request model:

- `StudentDoubtCreateRequest`

Sample response:

```json
{
  "doubt_id": "91c4bd99-c1e7-4a73-9d3b-cf9d6f8a0f74",
  "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "student_name": "Anika Jain",
  "topic": "Electric Current",
  "query_text": "Why does the bulb light instantly if electrons move slowly?",
  "tried_before": true,
  "attempt_text": "I think the battery pushes charges through the wire.",
  "clarification_video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
  "status": "pending",
  "response_text": null,
  "response_audio_url": null,
  "created_at": "2026-06-18T10:15:00+00:00"
}
```

### `GET /teachers/classes/{class_id}/doubts`

Purpose:

- list class doubts for the teacher dashboard

Auth:

- bearer token required
- teacher role required

Response model:

- array of `StudentDoubtResponse`

### `POST /teachers/doubts/{doubt_id}/respond`

Purpose:

- resolve a doubt with teacher text or voice-note attachment

Auth:

- bearer token required
- teacher role required

Request model:

- `TeacherDoubtRespondRequest`

Response model:

- `StudentDoubtResponse` with `status` set to `resolved`

Notes:

- the teacher must belong to the class that owns the doubt
- `response_audio_url` is optional

## Student AI Chat

This is the new student-only agentic tutor.

It is separate from the teacher-facing doubt workflow.

The chat engine can inherit class, chapter, and assignment context, but it is not limited to that context.

The agent can autonomously use tools such as explanation video generation, 3D model lookup, quiz generation, and simulation generation.

Video generation is intentionally gated by the planner policy so it is used for complex questions or when the student explicitly asks for a video or animation.

### `POST /chat-with-ai/chats`

Purpose:

- create a private student AI chat thread

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `title` | no | string or null | Optional custom thread title |
| `class_id` | no | string or null | Optional context seed |
| `chapter_id` | no | string or null | Optional context seed |
| `assignment_id` | no | string or null | Optional context seed |

Context rules:

- all context fields are optional
- if `chapter_id` or `assignment_id` is provided, the backend inherits the related class context and validates membership
- if nothing is provided, the thread is fully general-purpose and context-free
- the title auto-fills from the first user message if omitted or blank

Sample request without context:

```json
{
  "title": "General science help"
}
```

Sample request with inherited context:

```json
{
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8"
}
```

Success response:

```json
{
  "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
  "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
  "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
  "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
  "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8",
  "title": "Force and Motion help",
  "status": "active",
  "context_json": {
    "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
    "class_display_name": "Class 8 - Physics",
    "grade": "8",
    "subject": "Physics",
    "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
    "chapter_title": "Force and Motion",
    "chapter_status": "unset",
    "chapter_assets": [],
    "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8",
    "assignment_title": "Quiz on Force and Motion",
    "assignment_type": "quiz",
    "assignment_instructions": "Answer carefully and review the chapter first."
  },
  "message_count": 0,
  "created_at": "2026-06-18T10:15:00+00:00",
  "updated_at": "2026-06-18T10:15:00+00:00"
}
```

### `GET /chat-with-ai/chats`

Purpose:

- list the current student's AI chat threads

Auth:

- bearer token required
- student role required

Response model:

- array of `ChatThreadListItem`

Thread list fields:

| Field | Type | Notes |
|---|---|---|
| `chat_id` | string | Thread ID |
| `title` | string or null | Thread title |
| `class_id` | string or null | Inherited class context |
| `chapter_id` | string or null | Inherited chapter context |
| `assignment_id` | string or null | Inherited assignment context |
| `status` | string | Currently `active` |
| `message_count` | integer | Total messages, including tool messages |
| `last_message_preview` | string or null | Preview of most recent message |
| `created_at` | datetime | Creation time |
| `updated_at` | datetime | Last update time |

Sample response:

```json
[
  {
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "title": "Force and Motion help",
    "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
    "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
    "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8",
    "status": "active",
    "message_count": 4,
    "last_message_preview": "I also generated a quiz for you.",
    "created_at": "2026-06-18T10:15:00+00:00",
    "updated_at": "2026-06-18T10:16:30+00:00"
  }
]
```

### `GET /chat-with-ai/chats/{chat_id}`

Purpose:

- fetch one AI chat thread and its context

Auth:

- bearer token required
- student role required

Response model:

- `ChatThreadResponse`

### `GET /chat-with-ai/chats/{chat_id}/messages`

Purpose:

- fetch ordered message history for a thread

Auth:

- bearer token required
- student role required

Message roles:

- `user`
- `assistant`
- `tool`

Message fields:

| Field | Type | Notes |
|---|---|---|
| `message_id` | string | Message ID |
| `chat_id` | string | Parent chat ID |
| `role` | string | `user`, `assistant`, or `tool` |
| `content` | string | Message text |
| `tool_name` | string or null | Tool that produced the message, if any |
| `tool_input_json` | object or null | Tool input details |
| `tool_output_json` | object or null | Tool output details |
| `asset_type` | string or null | Generated asset type, if any |
| `asset_json` | object or null | Tool result payload |
| `created_at` | datetime | Message time |

Sample response:

```json
[
  {
    "message_id": "8f2b5b71-4cc0-43e4-9c8a-1d55e8f1bc22",
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "role": "user",
    "content": "Can you explain why the bulb lights instantly?",
    "tool_name": null,
    "tool_input_json": null,
    "tool_output_json": null,
    "asset_type": null,
    "asset_json": null,
    "created_at": "2026-06-18T10:16:00+00:00"
  },
  {
    "message_id": "f1dfdd57-b2b7-4f9a-8e6e-2f5f7d6b8d4f",
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "role": "tool",
    "content": "quiz tool completed.",
    "tool_name": "quiz",
    "tool_input_json": { "message": "Can you explain why the bulb lights instantly?", "context": { "chapter_title": "Force and Motion" } },
    "tool_output_json": { "questions": [] },
    "asset_type": "quiz",
    "asset_json": { "questions": [] },
    "created_at": "2026-06-18T10:16:05+00:00"
  },
  {
    "message_id": "6b1ae0e4-f802-4d0e-aade-e3c5dffdf2ea",
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "role": "assistant",
    "content": "Here’s a quick explanation, and I also generated a short quiz for practice.",
    "tool_name": null,
    "tool_input_json": null,
    "tool_output_json": { "tool_summaries": [] },
    "asset_type": null,
    "asset_json": { "generated_assets": [] },
    "created_at": "2026-06-18T10:16:06+00:00"
  }
]
```

### `POST /chat-with-ai/chats/{chat_id}/messages`

Purpose:

- send a message to the AI tutor
- let the backend plan and execute tools autonomously
- store the full turn in the thread history

Auth:

- bearer token required
- student role required

Request body:

| Field | Required | Type | Notes |
|---|---:|---|---|
| `content` | yes | string | Student message text |

Sample request:

```json
{
  "content": "Can you explain why the bulb lights instantly? Also show me a short video if needed."
}
```

Tool policy:

- the backend first plans whether a tool is needed
- it prefers text answers for simple questions
- it may call `video` only when the question is complex or explicitly asks for a video or animation
- it may call `model` when a 3D model would help visualize the concept
- it may call `quiz` when the user asks for practice or testing
- it may call `simulation` when an interactive demonstration helps

Success response:

```json
{
  "chat": {
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "student_id": "b4f2c5a4-2b84-4f06-b3d5-c682c2e1cd7f",
    "class_id": "4e474d04-bc15-4dd8-8f1f-4966d86f0d9d",
    "chapter_id": "c1b37a56-ff54-4d33-a2cc-44f1d88ab211",
    "assignment_id": "3f5e3f0c-ff0c-4d0a-8d07-6a7b8de9d9f8",
    "title": "Force and Motion help",
    "status": "active",
    "context_json": { "chapter_title": "Force and Motion" },
    "message_count": 6,
    "created_at": "2026-06-18T10:15:00+00:00",
    "updated_at": "2026-06-18T10:16:30+00:00"
  },
  "user_message": {
    "message_id": "8f2b5b71-4cc0-43e4-9c8a-1d55e8f1bc22",
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "role": "user",
    "content": "Can you explain why the bulb lights instantly? Also show me a short video if needed.",
    "tool_name": null,
    "tool_input_json": null,
    "tool_output_json": null,
    "asset_type": null,
    "asset_json": null,
    "created_at": "2026-06-18T10:16:00+00:00"
  },
  "assistant_message": {
    "message_id": "6b1ae0e4-f802-4d0e-aade-e3c5dffdf2ea",
    "chat_id": "9d8db25d-6a76-462d-8d25-d00de3c27f5b",
    "role": "assistant",
    "content": "Here’s a quick explanation, and I also generated a short quiz for practice.",
    "tool_name": null,
    "tool_input_json": null,
    "tool_output_json": { "tool_summaries": [ { "tool_name": "quiz", "status": "ready" } ] },
    "asset_type": null,
    "asset_json": { "generated_assets": [] },
    "created_at": "2026-06-18T10:16:06+00:00"
  },
  "tool_calls": [
    {
      "tool_name": "quiz",
      "status": "ready",
      "reason": "Practice would help reinforce the concept.",
      "output_json": {
        "questions": [
          {
            "question": "Which statement best describes electric current?",
            "options": ["...", "...", "...", "..."],
            "correctAnswer": 1
          }
        ]
      }
    }
  ],
  "generated_assets": [
    {
      "asset_type": "quiz",
      "title": "Quiz on Force and Motion",
      "description": "Practice would help reinforce the concept.",
      "external_url": null,
      "payload_json": { "questions": [] }
    }
  ]
}
```

Response notes:

- `tool_calls` can contain zero or more entries
- `generated_assets` can contain zero or more entries
- the assistant message is always persisted, even when tools fail
- tool failures are recorded in the thread history as `tool` messages with `status: failed`

### `DELETE /chat-with-ai/chats/{chat_id}`

Purpose:

- delete a private student AI chat thread

Auth:

- bearer token required
- student role required

Success response:

```json
{ "deleted": true }
```

## Quotas and Playground

### `GET /students/quotas`

See the Students section for the response shape.

### `POST /students/playground/generate`

See the Students section for the request and response shape.

## Practical Flows

### Teacher setup flow

1. Register or log in as a teacher.
2. Call `POST /teachers/onboarding/preferences`.
3. Call `POST /teachers/onboarding/complete`.
4. Create a class with `POST /teachers/classes`.
5. Bootstrap a curriculum with `POST /teachers/classes/{class_id}/curriculum/bootstrap` or create a manual curriculum.
6. Bootstrap chapters with `POST /teachers/classes/{class_id}/chapters/bootstrap`.
7. Create assignments with `POST /teachers/classes/{class_id}/assignments`.

### Student setup flow

1. Register or log in as a student.
2. Join a class with `POST /students/join-class`.
3. Set the preferred language with `POST /students/language`.
4. Fetch assignments with `GET /students/classes/{class_id}/assignments`.
5. Submit attempts with `POST /students/classes/{class_id}/assignments/{assignment_id}/submit`.
6. Submit doubts with `POST /students/doubts`.
7. Use `chat-with-ai` for private tutoring and tool-driven help.

### Assignment generation flow

1. Teacher creates an assignment.
2. The backend creates recipients for all class students.
3. The backend queues generation jobs for supported chapter assets.
4. The worker processes those jobs and updates assignment/job status.
5. The frontend reads assignment and chapter details to show the generated content.

### Student doubt flow

1. Student submits a doubt with `POST /students/doubts`.
2. The backend stores the doubt and a clarification video URL.
3. Teacher lists class doubts with `GET /teachers/classes/{class_id}/doubts`.
4. Teacher replies with `POST /teachers/doubts/{doubt_id}/respond`.
5. The doubt moves to `resolved`.

### Student AI chat flow

1. Student creates a chat thread with or without class/chapter/assignment context.
2. Student sends a message with `POST /chat-with-ai/chats/{chat_id}/messages`.
3. The backend reuses history, plans tool usage, and executes tools as needed.
4. The assistant reply is returned together with any generated assets.
5. The full turn is stored in the thread history.

## Error Handling

### Common HTTP statuses

| Status | Meaning |
|---|---|
| `400` | Invalid request data or invalid state transition |
| `401` | Missing or invalid auth token |
| `403` | Authenticated but not allowed to access the resource |
| `404` | Resource not found |
| `409` | Version conflict or duplicate state |
| `422` | Schema validation error |
| `425` | Simulation not ready yet |
| `429` | Quota exceeded |
| `500` | Unexpected server failure |

### Typical error body

```json
{
  "detail": "Forbidden"
}
```

### Notes on current backend behavior

- `POST /teachers/classes/{class_id}/curriculum` currently supports manual curricula only and returns `501` for other source types.
- `PATCH /teachers/classes/{class_id}/curriculum/{curriculum_id}` requires an exact `expected_version` match.
- `GET /media/assets/{asset_id}` is a redirect endpoint, not a JSON endpoint.
- `GET /media/assets/{asset_id}/signed-url` performs access control checks before returning the signed URL.
- `GET /simulations/{simulation_id}`, `GET /simulations/{simulation_id}/html`, and `POST /simulations/{simulation_id}/assess` are public in the current code.
- The student AI chat is student-only and does not replace the teacher-facing doubt system.
