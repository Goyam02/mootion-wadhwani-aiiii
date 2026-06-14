# Backend Overview

Mootion's backend is a FastAPI modular monolith.

The intent is to keep the product easy to reason about while still leaving room for future generation services. The backend already knows how to call Manim, rank 3D models in-process, and queue assignment-driven work, but the actual surface area stays small and explicit.

## Why This Shape Exists

- Route handlers stay thin so the HTTP layer only handles validation and dependency wiring.
- Services own business rules so the behavior is testable without HTTP.
- Repositories own SQLAlchemy queries so data access stays centralized.
- `core` owns configuration, DB setup, auth, and shared dependencies.
- Curriculum, chapters, and assignments all use stable placeholder shapes so future AI features can fill the same structures instead of inventing new ones.

## Directory Map

- `backend/app/main.py` - app startup, middleware, router registration, DB bootstrap, background worker startup.
- `backend/app/api/` - HTTP route handlers.
- `backend/app/services/` - orchestration and domain logic.
- `backend/app/repositories/` - SQLAlchemy reads and writes.
- `backend/app/schemas/` - request and response contracts.
- `backend/app/core/` - config, database, auth helpers, dependency guards.

## Runtime Behavior

- The app currently uses `Base.metadata.create_all(bind=engine)` for local development bootstrap.
- A hidden default school is created internally at startup.
- The public product does not expose school selection or school metadata.
- A lightweight background worker starts on app startup and processes queued assignment generation jobs.

## Domain Areas

### Authentication and identity

- Password login.
- JWT access tokens.
- Refresh-token sessions.
- Google OAuth.
- Teacher and student roles share one login namespace.

### Onboarding and class structure

- Teachers set language preferences and create classes one by one.
- Students set language preferences and join classes by class code.
- Teachers and students can belong to multiple classes.

### Curriculum

- Curriculum is a roadmap tree with a flattened graph view.
- Teachers can create a manual tree or bootstrap an NCERT preset.
- Every save writes a new snapshot.
- Patch operations support add, update, delete, and same-parent-only move.

### Chapters

- Chapters are derived from curriculum nodes.
- Chapters are placeholders for the eventual learning experience.
- Chapter assets store placeholder content for video, simulation, 3D model, quiz, and AI activities.

### Assignments

- Assignments are class-wide.
- The teacher chooses one activity type.
- Activity generation is queued lazily when the assignment is created.
- Manim stays a remote call.
- Model-finder is copied in-process from the bloop-core logic.

## Execution Model

### HTTP request flow

1. Router receives the request.
2. Pydantic validates the payload.
3. Auth dependency loads the user and role.
4. Service enforces access and applies domain rules.
5. Repository persists the change.
6. Response schema is returned.

### Generation flow

1. Teacher creates an assignment.
2. The assignment is saved immediately.
3. Relevant chapter asset jobs are queued.
4. The background worker picks up jobs from the DB queue.
5. Manim jobs call the external Manim service.
6. Model-finder jobs query Sketchfab and rank candidates locally.
7. The asset record is updated with generation results or failure metadata.

## Important Design Rules

- Use FastAPI dependencies for auth, not custom decorators.
- Keep teacher and student flows separate at the API level.
- Keep the curriculum tree shape stable.
- Keep chapter assets as placeholders until assignment-driven generation occurs.
- Keep assignment types class-wide and simple.
- Do not expose the hidden school in the product experience.

## Where To Start

- `backend/app/main.py` for app composition.
- `backend/app/services/auth_service.py` for auth lifecycle.
- `backend/app/services/curriculum_service.py` for roadmap logic.
- `backend/app/services/chapter_service.py` for chapter scaffolding.
- `backend/app/services/assignment_service.py` for assignment queueing and generation.
