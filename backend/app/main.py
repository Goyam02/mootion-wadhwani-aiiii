from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.assignments import router as assignments_router
from app.api.chapters import router as chapters_router
from app.api.curriculum import router as curriculum_router
from app.api.teachers import router as teacher_router
from app.api.students import router as student_router
from app.core.database import Base, SessionLocal, engine
from app.core import models  # noqa: F401
from app.repositories.onboarding_repository import get_or_create_default_school
from app.services.assignment_service import start_assignment_queue_worker, stop_assignment_queue_worker


Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    get_or_create_default_school(db)
finally:
    db.close()

app = FastAPI(title="Mootion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(assignments_router)
app.include_router(chapters_router)
app.include_router(curriculum_router)
app.include_router(teacher_router)
app.include_router(student_router)


@app.on_event("startup")
def _startup() -> None:
    start_assignment_queue_worker()


@app.on_event("shutdown")
def _shutdown() -> None:
    stop_assignment_queue_worker()
