1. Start services
- brew services start redis
- uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 in animation-engine/
- uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 in backend/
- python -m app.services.media_worker in a second backend/ terminal
2. Set backend env vars
- REDIS_URL=redis://localhost:6379/0
- R2_BUCKET=<your-bucket>
- R2_ENDPOINT=<your-r2-endpoint>
- R2_ACCESS_KEY_ID=<your-access-key>
- R2_SECRET_ACCESS_KEY=<your-secret-key>
- R2_PUBLIC_URL=<your-public-url>
- OBJECT_STORAGE_ENDPOINT=localhost:9000
- OBJECT_STORAGE_ACCESS_KEY=minioadmin
- OBJECT_STORAGE_SECRET_KEY=minioadmin
- OBJECT_STORAGE_SECURE=false
- OBJECT_STORAGE_BUCKET=mootion-media
- OBJECT_STORAGE_SIGNED_URL_EXPIRY_MINUTES=15
- BACKEND_PUBLIC_URL=http://localhost:8000
- MANIM_SERVICE_BASE_URL=http://localhost:8001
- MANIM_SERVICE_URL=http://localhost:8001/explain
3. Create a teacher, class, curriculum, and chapters
- Register/login as a teacher.
- Create a class.
- Bootstrap curriculum.
- Bootstrap chapters.
- Confirm GET /teachers/classes/{class_id}/chapters returns chapters with assets.
4. Trigger a video job
- Create an assignment with assignment_type=video.
- Confirm the assignment is created immediately with status=queued.
- Confirm a chapter_asset_generation_jobs row exists in the backend DB.
- Confirm the worker terminal picks up the job.
5. Verify the generated video
- Wait for the worker to finish.
- Call GET /teachers/classes/{class_id}/chapters/{chapter_id}.
- Confirm the concept video asset now has:
  - generation_status=ready
  - external_url pointing to http://localhost:8000/media/assets/{asset_id}/signed-url
6. Open playback
- Visit the returned external_url in the browser.
- It should return JSON with a signed URL, then use that URL for playback.
7. Check MinIO directly
- Open MinIO console at http://localhost:9000.
- Confirm the object exists in bucket mootion-media.
8. Test recovery
- Stop the worker while a job is queued.
- Restart the worker.
- Confirm queued jobs are picked up from Redis/DB and continue.
