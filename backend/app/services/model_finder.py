from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
import tempfile
from pathlib import Path

import httpx
from openai import OpenAI

from app.core.config import settings


BASE_PROMPT = """
You are evaluating 3D models for an educational STEM learning platform.

The goal is NOT to find the prettiest model.
The goal is NOT to find the best 3D-printing model.
The goal is NOT to find the highest quality render.

The goal is to find the model that would help a student best understand the queried concept.

Evaluate the thumbnail and infer the likely educational usefulness of the underlying 3D model.

You may make reasonable inferences from:

- visual style
- realism
- presentation
- visible annotations
- scientific appearance
- model complexity
- educational cues

Do not make extreme assumptions, but do estimate how likely the model is to be useful for teaching and learning.

Prioritize:

1. Relevance to the query
   - Does the model clearly represent the requested concept?

2. Educational value
   - Would a teacher likely choose this model for instruction?
   - Would a student learn meaningful concepts from it?
   - Does it appear useful for explaining the concept?

3. Scientific realism
   - Prefer realistic scientific, anatomical, biological, chemical, physical, or engineering representations.
   - Prefer real-world accuracy over artistic style.

4. Educational intent
   - Does the model appear designed for learning, exploration, explanation, or scientific communication?
   - Does it resemble educational software, scientific visualization, or instructional content?

5. Completeness
   - Prefer models that likely contain important structures, systems, layers, components, or relationships.

6. Clarity
   - The concept should be easy to identify.

Strongly penalize:

- Decorative objects
- Artistic interpretations
- Toys
- Props
- Sculptures
- Jewelry
- Logos
- Stylized assets
- Game assets
- Meme assets
- 3D-print showcase models
- Asset marketplace renders
- Portfolio renders
- Product renders
- Wireframes
- Mesh demonstrations
- Topology demonstrations

Educational Context Rules:

Visible evidence of educational context is a strong positive signal.

Examples include:

- labels
- annotations
- highlighted structures
- medical interfaces
- educational overlays
- scientific diagrams
- instructional presentation
- system visualizations
- explanatory visual elements

Never score solely on realism.

A highly realistic model can still receive a moderate score if it appears intended primarily for:

- rendering
- portfolio presentation
- asset marketplaces
- 3D printing
- visual showcase

rather than education.

Examples:

Query: anatomical heart

Example A:
A realistic anatomical heart displayed inside a medical learning interface with annotations, highlighted structures, labels, educational overlays, or visible teaching tools.

Assessment:
Exceptional educational value.
Likely designed for learning and exploration.
Score range: 90-100

Example B:
A realistic anatomical heart rendered as a generic standalone 3D asset on a plain background.

Assessment:
Relevant and useful.
Likely educational but lacks evidence of teaching-focused design.
Score range: 70-89

Example C:
A grey anatomical heart that appears optimized for 3D printing, manufacturing, asset marketplaces, or rendering showcases.

Assessment:
Relevant to the query but educational intent is weak.
Likely a generic asset rather than a learning tool.
Score range: 50-75

Example D:
A stylized, decorative, artistic, low-poly, cartoon, toy-like, or symbolic heart.

Assessment:
Poor educational value.
Score range: 0-40

Query: human skeleton

Example A:
A labeled anatomical skeleton, skeletal system visualization, educational anatomy model, or medical illustration.

Assessment:
Exceptional educational value.
Score range: 90-100

Example B:
A realistic skeleton rendered as a generic standalone asset.

Assessment:
Useful but lacks evidence of educational design.
Score range: 65-85

Example C:
A Halloween decoration, game asset, cartoon skeleton, or decorative sculpture.

Assessment:
Poor educational value.
Score range: 0-50

Important:

The objective is not to identify the most visually impressive model.

The objective is to identify the model most likely to help a student learn.

When two models are equally realistic, prefer the model that appears more educational.

When uncertain, ask:
"Which model would a biology, chemistry, physics, engineering, or medical teacher be more likely to use in class?"

Score according to the answer to that question.

Only assign scores above 90 when the model appears exceptionally valuable for education.
""".strip()


def build_rank_prompt(query: str) -> str:
    return f"""
{BASE_PROMPT}

The user is searching for:

QUERY:
{query}

You will be shown a thumbnail for a candidate model.

Evaluate how well this candidate matches the query.

Return ONLY valid JSON.

Do not include markdown.
Do not include explanations.
Do not wrap the JSON in code fences.

Example:

{{
    "reason": "Highly realistic anatomical heart model.",
    "score": 87
}}

Scoring guide:

90-100:
Excellent match. Highly relevant, visually clear, educationally useful.

70-89:
Good match. Relevant but may have minor issues.

50-69:
Partially relevant. Usable but not ideal.

20-49:
Weak match. Significant relevance or quality issues.

0-19:
Poor match. Irrelevant or misleading.
""".strip()


def _image_to_data_uri(image_path: str) -> str:
    mime_type, _ = mimetypes.guess_type(image_path)
    mime_type = mime_type or "image/jpeg"

    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"


def query_llm(prompt: str, image_paths: list[str] | None = None) -> dict[str, str]:
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        raise RuntimeError("Azure OpenAI is not configured")

    client = OpenAI(base_url=settings.azure_openai_endpoint, api_key=settings.azure_openai_api_key)
    content: list[dict[str, object]] = [{"type": "text", "text": prompt}]

    if image_paths:
        for image_path in image_paths:
            content.append({"type": "image_url", "image_url": {"url": _image_to_data_uri(image_path)}})

    response = client.chat.completions.create(
        model=settings.azure_openai_deployment,
        temperature=0.2,
        messages=[{"role": "user", "content": content}],
    )

    return {
        "model": settings.azure_openai_deployment,
        "response": response.choices[0].message.content or "",
    }


def download_thumbnail(url: str, save_dir: str = "thumbnails") -> str:
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{os.urandom(8).hex()}.jpg"
    filepath = os.path.join(save_dir, filename)

    response = httpx.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10.0)
    response.raise_for_status()

    with open(filepath, "wb") as f:
        f.write(response.content)

    return filepath


def agent_model_rank(query: str, models: list[dict]) -> tuple[dict, int] | None:
    if not models:
        return None

    best_model = None
    best_score = -1

    with tempfile.TemporaryDirectory() as temp_dir:
        for model in models:
            try:
                thumbnail_images = model.get("thumbnails", {}).get("images", [])
                if not thumbnail_images:
                    raise ValueError("No thumbnail images available")

                thumbnail_index = min(3, len(thumbnail_images) - 1)
                thumbnail_url = thumbnail_images[thumbnail_index]["url"]
                thumbnail_path = download_thumbnail(thumbnail_url, save_dir=temp_dir)

                prompt = build_rank_prompt(query=query)
                response = query_llm(prompt, image_paths=[thumbnail_path])
                match = re.search(r"\{.*\}", response["response"], re.DOTALL)
                if not match:
                    raise ValueError("No JSON found")

                result = json.loads(match.group())
                score = int(result.get("score", 0))

                if score > best_score:
                    best_score = score
                    best_model = model
            except Exception:
                continue

    if not best_model:
        return None
    return best_model, best_score


def find_model(query: str) -> dict[str, object]:
    if not settings.sketchfab_api_url:
        return {"error": "Sketchfab API URL is not configured"}

    try:
        response = httpx.get(
            settings.sketchfab_api_url,
            params={"q": query, "sort_by": "-relevance", "type": "models"},
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])

        if not results:
            return {"message": "No models found."}

        ranked = agent_model_rank(query=query, models=results[:5])
        if not ranked:
            return {"message": "No suitable model found."}

        best_model, best_score = ranked
        return {
            "name": best_model.get("name"),
            "uid": best_model.get("uid"),
            "embedUrl": best_model.get("embedUrl"),
            "viewerUrl": best_model.get("viewerUrl"),
            "score": best_score,
        }
    except Exception as exc:
        return {"error": str(exc)}
