from fastapi import APIRouter, HTTPException
import requests
from pydantic import BaseModel

router = APIRouter(prefix="/manim", tags=["Video generation endpoints"])

class ExplainRequest(BaseModel):
    topic: str
    level: str = "school"
    persona: str = "teacher"


@router.post("/explain")
async def explain(request: ExplainRequest):
    request_data = {
        "topic": request.topic,
        "level": request.level,
        "persona": request.persona,
    }

    try:
        response = requests.post(
            "http://manim-engine:8001/explain",
            json=request_data,
            timeout=300,
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to Manim service: {e}",
        )

    # ❗ Manim service error
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Manim service failed",
                "status_code": response.status_code,
                "response": response.text[:1000],
            },
        )

    # ❗ Non-JSON response
    try:
        return response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Manim service returned non-JSON response",
                "response": response.text[:1000],
            },
        )
