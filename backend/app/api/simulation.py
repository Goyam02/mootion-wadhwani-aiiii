from __future__ import annotations

import json
import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher, require_student, get_current_user
from app.core.models import SimulationRecord
from app.simulation_engine import (
    SimulationOrchestrator,
    SimulationSpecification,
    PipelineResult,
    SimulationPhase,
)

router = APIRouter(prefix="/simulations", tags=["simulations"])

orchestrator = SimulationOrchestrator()

SIMS_DATA = []
try:
    _sims_path = os.path.join(os.path.dirname(__file__), "../../../sim/sims.json")
    with open(_sims_path, "r") as f:
        SIMS_DATA = json.load(f)
except Exception as e:
    print(f"Error loading sims.json: {e}")

class ResolveRequest(BaseModel):
    topic: str
    grade_level: str | None = None

class ResolveResponse(BaseModel):
    type: str
    url: str | None = None
    simulation_id: str | None = None
    html: str | None = None
    title: str | None = None


class GenerateRequest(BaseModel):
    prompt: str


class SpecGenerateRequest(BaseModel):
    spec: dict


class SimulationResponse(BaseModel):
    simulation_id: str
    status: str
    html: str = ""
    spec: dict | None = None
    validation: dict | None = None
    quality_score: float = 0.0
    assessments: list[dict] = []
    error: str | None = None
    duration_ms: float = 0.0


def _save_result(db: Session, result: PipelineResult, prompt: str | None = None) -> None:
    record = db.query(SimulationRecord).filter(
        SimulationRecord.simulation_id == result.simulation_id
    ).one_or_none()
    if record:
        return

    record = SimulationRecord(
        simulation_id=result.simulation_id,
        prompt=prompt,
        spec_json=json.loads(result.spec.json()) if result.spec else None,
        html=result.html,
        validation_json=json.loads(result.validation.json()) if result.validation else None,
        quality_score=int(result.quality_score * 100),
        assessments_json=[ap.dict() for ap in result.assessments],
        phase=result.phase.value,
        error=result.error,
        duration_ms=int(result.duration_ms),
    )
    db.add(record)
    db.commit()


def _load_result(db: Session, simulation_id: str) -> PipelineResult | None:
    record = db.query(SimulationRecord).filter(
        SimulationRecord.simulation_id == simulation_id
    ).one_or_none()
    if not record:
        return None

    from app.simulation_engine.schemas import (
        SimulationSpecification, ValidationResult, AssessmentPrompt, SimulationPhase,
    )

    spec = None
    if record.spec_json:
        spec = SimulationSpecification(**record.spec_json)

    validation = None
    if record.validation_json:
        validation = ValidationResult(**record.validation_json)

    assessments = []
    if record.assessments_json:
        assessments = [AssessmentPrompt(**a) for a in record.assessments_json]

    return PipelineResult(
        simulation_id=record.simulation_id,
        spec=spec,
        html=record.html,
        validation=validation,
        quality_score=record.quality_score / 100.0,
        assessments=assessments,
        phase=SimulationPhase(record.phase),
        error=record.error,
        duration_ms=float(record.duration_ms),
    )


@router.post("/generate", response_model=SimulationResponse)
async def generate_simulation(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not request.prompt or len(request.prompt.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt must be at least 3 characters",
        )

    result = await orchestrator.generate_from_prompt(request.prompt)
    _save_result(db, result, prompt=request.prompt)

    return _result_to_response(result)


@router.post("/generate-from-spec", response_model=SimulationResponse)
async def generate_from_spec(
    request: SpecGenerateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        spec = SimulationSpecification(**request.spec)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid specification: {e}",
        )

    result = await orchestrator.generate_from_spec(spec)
    _save_result(db, result)

    return _result_to_response(result)


@router.post("/resolve", response_model=ResolveResponse)
async def resolve_simulation(
    request: ResolveRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    topic_lower = request.topic.lower().strip()
    
    # 1. Lookup by topic or alias
    for sim in SIMS_DATA:
        if sim.get("topic_key", "").lower() == topic_lower or any(a.lower() == topic_lower for a in sim.get("aliases", [])):
            # Basic grade filtering if grade_level is provided and sim has grade_range
            if request.grade_level and sim.get("grade_range"):
                if request.grade_level not in sim["grade_range"]:
                    continue
            return ResolveResponse(
                type="phet",
                url=sim["phet_url"],
                title=sim.get("title", request.topic.title())
            )
            
    # 2. AI generation fallback
    from app.core.config import settings
    result = await orchestrator.generate_from_prompt(request.topic)
    _save_result(db, result, prompt=request.topic)
    
    if result.phase.value == "failed" or result.error:
        return ResolveResponse(
            type="failed",
            simulation_id=result.simulation_id,
            html=None,
            title=f"AI Simulation: {request.topic.title()}",
            url=None
        )

    external_url = f"{settings.backend_public_url.rstrip('/')}/simulations/{result.simulation_id}/html" if result.phase.value == "completed" else None
    
    return ResolveResponse(
        type="ai",
        simulation_id=result.simulation_id,
        html=result.html,
        title=f"AI Simulation: {request.topic.title()}",
        url=external_url
    )


@router.get("/supported-subjects")
async def supported_subjects():
    return orchestrator.get_supported_subjects()


@router.get("/example-prompts")
async def example_prompts():
    return {"prompts": orchestrator.get_example_prompts()}


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: str,
    db: Session = Depends(get_db),
):
    result = orchestrator.get_result(simulation_id)
    if not result:
        result = _load_result(db, simulation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    return _result_to_response(result)


@router.get("/{simulation_id}/html")
async def get_simulation_html(
    simulation_id: str,
    db: Session = Depends(get_db),
):
    result = orchestrator.get_result(simulation_id)
    if not result:
        result = _load_result(db, simulation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    if result.phase != SimulationPhase.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_425_TOO_EARLY,
            detail=f"Simulation not ready (phase: {result.phase.value})",
        )

    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=result.html)


@router.post("/{simulation_id}/assess")
async def assess_simulation(
    simulation_id: str,
    db: Session = Depends(get_db),
):
    result = orchestrator.get_result(simulation_id)
    if not result:
        result = _load_result(db, simulation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )

    return {
        "simulation_id": simulation_id,
        "assessments": [
            ap.dict() for ap in result.assessments
        ],
        "spec": json.loads(result.spec.json()) if result.spec else None,
    }


def _result_to_response(result: PipelineResult) -> SimulationResponse:
    return SimulationResponse(
        simulation_id=result.simulation_id,
        status=result.phase.value,
        html=result.html,
        spec=json.loads(result.spec.json()) if result.spec else None,
        validation=json.loads(result.validation.json()) if result.validation else None,
        quality_score=result.quality_score,
        assessments=[ap.dict() for ap in result.assessments],
        error=result.error,
        duration_ms=result.duration_ms,
    )
