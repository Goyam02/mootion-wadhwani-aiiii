# Media Storage and Workers

Mootion now treats generated video as a backend-owned media job.

## Why This Exists

Frontend code should not call the animation engine directly for each video.

Instead:

- the backend creates a generation job
- Redis carries the job to a worker
- the worker calls the Manim service
- the worker uploads the rendered video to MinIO
- the backend serves the stored video from a stable media URL

## Runtime Pieces

- Redis for queued job delivery
- MinIO for persistent media storage
- one or more backend worker processes
- the external `animation-engine` service for Manim rendering

## Job Flow

1. A teacher creates an assignment for a chapter.
2. The backend creates `chapter_asset_generation_jobs` rows.
3. Each job is pushed to Redis.
4. A worker picks up the job.
5. The worker calls `POST /explain` on the animation engine.
6. The worker downloads the rendered MP4 from the engine's `/video/{video_id}` endpoint.
7. The worker uploads the MP4 to MinIO.
8. The worker stores the MinIO object key on the asset row.
9. The backend exposes the asset through `GET /media/assets/{asset_id}`.

## Why This Is Better Than Frontend Fetches

- no N-by-1 direct browser calls to the animation engine
- no browser auth issue when loading `<video src>`
- no loss of generated media when the animation engine container restarts
- no need to keep generated content inside the animation service
- the backend can retry or recover jobs from the database

## Media URL Contract

Generated assets return a backend media URL in chapter detail responses:

- `GET /teachers/classes/{class_id}/chapters/{chapter_id}`

If the asset has been stored in MinIO, the `external_url` field points to:

- `GET /media/assets/{asset_id}`

That endpoint streams the MP4 from MinIO.

## Worker Command

Run one or more worker processes with:

```bash
python -m app.services.media_worker
```

Run 2 to 3 copies of that process to increase throughput.

## Recovery Behavior

- queued jobs are re-enqueued from the database at backend startup
- stale `processing` jobs are reset to `queued` and re-enqueued
- the database remains the source of truth for job state
