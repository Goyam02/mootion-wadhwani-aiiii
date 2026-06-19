from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, status
from openai import AzureOpenAI
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.models import (
    Assignment,
    Chapter,
    ChapterAsset,
    ClassRoom,
    SimulationRecord,
    StudentAiChatMessage,
    StudentAiChatThread,
    User,
)
from app.repositories.chapter_repository import get_assets_for_chapter
from app.repositories.onboarding_repository import get_student_class_membership
from app.schemas.chat_ai import (
    ChatGeneratedAssetResponse,
    ChatMessageResponse,
    ChatSendMessageResponse,
    ChatThreadCreateRequest,
    ChatThreadListItem,
    ChatThreadResponse,
    ChatToolCallResponse,
)
from app.services.model_finder import find_model, query_llm
from app.simulation_engine import SimulationOrchestrator


TOOL_NAMES = {"video", "model", "quiz", "simulation"}
EXPLICIT_VIDEO_TERMS = ("video", "animation", "show me", "visualize", "visualise", "watch")
EXPLICIT_MODEL_TERMS = ("model", "3d", "3-d", "diagram", "structure", "look like", "universe")
EXPLICIT_QUIZ_TERMS = ("quiz", "test me", "practice", "mcq", "questions")
EXPLICIT_SIMULATION_TERMS = ("simulation", "simulate", "what happens if", "experiment", "interactive")

_SIMULATION_ORCHESTRATOR = SimulationOrchestrator()


def _get_client() -> AzureOpenAI:
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        raise RuntimeError("Azure OpenAI is not configured")

    endpoint = settings.azure_openai_endpoint.rstrip("/")
    if endpoint.endswith("/openai/v1"):
        endpoint = endpoint[:-10]
    elif endpoint.endswith("/openai"):
        endpoint = endpoint[:-7]

    return AzureOpenAI(
        api_version=settings.azure_openai_api_version,
        azure_endpoint=endpoint,
        api_key=settings.azure_openai_api_key,
    )


def _extract_json(text: str) -> dict[str, Any] | list[Any] | None:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    if not cleaned:
        return None

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    object_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if object_match:
        try:
            return json.loads(object_match.group(0))
        except Exception:
            pass

    array_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group(0))
        except Exception:
            pass

    return None


def _truncate(text: str, limit: int = 80) -> str:
    clean = " ".join(text.strip().split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 3].rsplit(" ", 1)[0] + "..."


def _title_from_message(message: str) -> str:
    return _truncate(message, 60)


def _message_to_response(message: StudentAiChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        message_id=str(message.id),
        chat_id=str(message.chat_id),
        role=message.role,
        content=message.content,
        tool_name=message.tool_name,
        tool_input_json=message.tool_input_json,
        tool_output_json=message.tool_output_json,
        asset_type=message.asset_type,
        asset_json=message.asset_json,
        created_at=message.created_at,
    )


def _thread_to_response(db: Session, thread: StudentAiChatThread) -> ChatThreadResponse:
    message_count = db.query(func.count(StudentAiChatMessage.id)).filter(StudentAiChatMessage.chat_id == thread.id).scalar() or 0
    return ChatThreadResponse(
        chat_id=str(thread.id),
        student_id=str(thread.student_id),
        class_id=str(thread.class_id) if thread.class_id else None,
        chapter_id=str(thread.chapter_id) if thread.chapter_id else None,
        assignment_id=str(thread.assignment_id) if thread.assignment_id else None,
        title=thread.title,
        status=thread.status,
        context_json=thread.context_json or {},
        message_count=int(message_count),
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


def _list_item_from_thread(db: Session, thread: StudentAiChatThread) -> ChatThreadListItem:
    last_message = (
        db.query(StudentAiChatMessage)
        .filter(StudentAiChatMessage.chat_id == thread.id)
        .order_by(StudentAiChatMessage.created_at.desc())
        .first()
    )
    message_count = db.query(func.count(StudentAiChatMessage.id)).filter(StudentAiChatMessage.chat_id == thread.id).scalar() or 0
    return ChatThreadListItem(
        chat_id=str(thread.id),
        title=thread.title,
        class_id=str(thread.class_id) if thread.class_id else None,
        chapter_id=str(thread.chapter_id) if thread.chapter_id else None,
        assignment_id=str(thread.assignment_id) if thread.assignment_id else None,
        status=thread.status,
        message_count=int(message_count),
        last_message_preview=_truncate(last_message.content, 90) if last_message else None,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


def _ensure_thread_access(thread: StudentAiChatThread, student: User) -> None:
    if str(thread.student_id) != str(student.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")


def _resolve_context(
    db: Session,
    student: User,
    class_id: str | None,
    chapter_id: str | None,
    assignment_id: str | None,
) -> tuple[str | None, dict[str, Any]]:
    resolved_class_id = class_id
    class_room = None
    chapter = None
    assignment = None

    if assignment_id:
        assignment = db.get(Assignment, assignment_id)
        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        resolved_class_id = resolved_class_id or str(assignment.class_id)

    if chapter_id:
        chapter = db.get(Chapter, chapter_id)
        if not chapter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
        resolved_class_id = resolved_class_id or str(chapter.class_id)

    if resolved_class_id:
        membership = get_student_class_membership(db, str(student.id), resolved_class_id)
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        class_room = db.get(ClassRoom, resolved_class_id)

    if chapter and resolved_class_id and str(chapter.class_id) != resolved_class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter does not belong to the selected class")

    if assignment and resolved_class_id and str(assignment.class_id) != resolved_class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment does not belong to the selected class")

    chapter_assets: list[dict[str, Any]] = []
    if chapter:
        assets = get_assets_for_chapter(db, str(chapter.id))
        chapter_assets = [
            {
                "asset_type": asset.asset_type,
                "title": asset.title,
                "generation_status": asset.generation_status,
                "external_url": asset.external_url,
            }
            for asset in assets
        ]

    context: dict[str, Any] = {
        "class_id": resolved_class_id,
        "class_display_name": class_room.display_name if class_room else None,
        "grade": class_room.grade if class_room else None,
        "subject": class_room.subject if class_room else None,
        "chapter_id": str(chapter.id) if chapter else chapter_id,
        "chapter_title": chapter.title if chapter else None,
        "chapter_status": chapter.status if chapter else None,
        "chapter_assets": chapter_assets,
        "assignment_id": str(assignment.id) if assignment else assignment_id,
        "assignment_title": assignment.title if assignment else None,
        "assignment_type": assignment.assignment_type if assignment else None,
        "assignment_instructions": assignment.instructions if assignment else None,
    }
    return resolved_class_id, context


def _build_default_title(context: dict[str, Any]) -> str:
    for key in ("assignment_title", "chapter_title", "class_display_name", "subject"):
        value = context.get(key)
        if value:
            return _truncate(f"{value} help", 60)
    return "AI chat"


def _history_text(messages: list[StudentAiChatMessage], limit: int = 10) -> str:
    history: list[str] = []
    for message in messages[-limit:]:
        history.append(f"{message.role.capitalize()}: {message.content}")
    return "\n".join(history)


def _is_explicit(term_list: tuple[str, ...], text: str) -> bool:
    lowered = text.lower()
    return any(term in lowered for term in term_list)


def _complexity_score(text: str, context: dict[str, Any]) -> int:
    lowered = text.lower()
    score = 0
    if len(lowered.split()) >= 20:
        score += 1
    if any(term in lowered for term in ("why", "how", "compare", "difference", "explain", "cause", "relationship")):
        score += 1
    if lowered.count(" and ") >= 2 or lowered.count(" but ") >= 1:
        score += 1
    if context.get("chapter_title") and context["chapter_title"].lower() in lowered:
        score += 1
    return score


def _plan_tool_calls(message: str, context: dict[str, Any], history: str) -> dict[str, Any]:
    complexity = _complexity_score(message, context)
    explicit_video = _is_explicit(EXPLICIT_VIDEO_TERMS, message)
    explicit_model = _is_explicit(EXPLICIT_MODEL_TERMS, message)
    explicit_quiz = _is_explicit(EXPLICIT_QUIZ_TERMS, message)
    explicit_simulation = _is_explicit(EXPLICIT_SIMULATION_TERMS, message)

    fallback_plan = {
        "tool_calls": [],
        "use_text_answer": True,
        "response_style": "detailed" if complexity >= 2 else "concise",
    }

    # Force tool calls if the message starts with a slash command
    msg_lower = message.strip().lower()
    if msg_lower.startswith("/video"):
        fallback_plan["tool_calls"].append({"tool_name": "video", "reason": "Explicit video slash command."})
        fallback_plan["use_text_answer"] = False
        return fallback_plan
    elif msg_lower.startswith("/universe"):
        fallback_plan["tool_calls"].append({"tool_name": "model", "reason": "Explicit universe slash command."})
        fallback_plan["use_text_answer"] = False
        return fallback_plan
    elif msg_lower.startswith("/quiz"):
        fallback_plan["tool_calls"].append({"tool_name": "quiz", "reason": "Explicit quiz slash command."})
        fallback_plan["use_text_answer"] = False
        return fallback_plan
    elif msg_lower.startswith("/simulation"):
        fallback_plan["tool_calls"].append({"tool_name": "simulation", "reason": "Explicit simulation slash command."})
        fallback_plan["use_text_answer"] = False
        return fallback_plan

    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        if explicit_video or complexity >= 2:
            fallback_plan["tool_calls"].append({"tool_name": "video", "reason": "Video support is useful here."})
        if explicit_model:
            fallback_plan["tool_calls"].append({"tool_name": "model", "reason": "Student asked for a model."})
        if explicit_quiz:
            fallback_plan["tool_calls"].append({"tool_name": "quiz", "reason": "Student asked for practice."})
        if explicit_simulation:
            fallback_plan["tool_calls"].append({"tool_name": "simulation", "reason": "Student asked for a simulation."})
        return fallback_plan

    prompt = f"""
You are a tutor-agent planner for a student-only educational chat.

Current context:
{json.dumps(context, indent=2, ensure_ascii=False)}

Conversation history:
{history or "(none)"}

Latest student message:
{message}

Available tools:
- video: generate a short explanation video
- model: find a relevant 3D model
- quiz: generate a 3-question quiz
- simulation: generate an interactive simulation

Policy:
- Use video only when the student explicitly asks for a video/animation OR the question is genuinely complex and benefits from visuals.
- Prefer text answers for simple questions.
- Use model/simulation/quiz only when clearly helpful or explicitly requested.
- Keep the final response student-friendly and concise unless more detail is needed.

Return ONLY valid JSON with this shape:
{{
  "use_text_answer": true,
  "response_style": "concise|detailed|interactive",
  "tool_calls": [
    {{
      "tool_name": "video|model|quiz|simulation",
      "reason": "short reason"
    }}
  ]
}}

Do not wrap in markdown.
Do not include any extra text.
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=settings.azure_openai_deployment,
            temperature=0.1,
            messages=[
                {"role": "system", "content": "You plan tool usage for a student AI tutor."},
                {"role": "user", "content": prompt},
            ],
        )
        raw = (response.choices[0].message.content or "").strip()
        parsed = _extract_json(raw)
        if isinstance(parsed, dict):
            tool_calls = parsed.get("tool_calls") or []
            filtered: list[dict[str, Any]] = []
            for tool_call in tool_calls:
                tool_name = str(tool_call.get("tool_name") or "").strip()
                if tool_name not in TOOL_NAMES:
                    continue
                if tool_name == "video" and not (explicit_video or complexity >= 2):
                    continue
                if tool_name == "model" and not (explicit_model or any(term in message.lower() for term in ("structure", "parts", "look like", "shape", "diagram", "3d"))):
                    continue
                if tool_name == "quiz" and not explicit_quiz:
                    continue
                if tool_name == "simulation" and not (explicit_simulation or complexity >= 2):
                    continue
                filtered.append({
                    "tool_name": tool_name,
                    "reason": str(tool_call.get("reason") or ""),
                })
            parsed["tool_calls"] = filtered[:3]
            parsed["use_text_answer"] = bool(parsed.get("use_text_answer", True))
            parsed["response_style"] = str(parsed.get("response_style") or "concise")
            return parsed
    except Exception:
        pass

    if explicit_video or complexity >= 2:
        fallback_plan["tool_calls"].append({"tool_name": "video", "reason": "This question benefits from a visual explanation."})
    if explicit_model:
        fallback_plan["tool_calls"].append({"tool_name": "model", "reason": "A 3D model will help visualize the idea."})
    if explicit_quiz:
        fallback_plan["tool_calls"].append({"tool_name": "quiz", "reason": "Practice would help reinforce the topic."})
    if explicit_simulation:
        fallback_plan["tool_calls"].append({"tool_name": "simulation", "reason": "An interactive simulation fits this request."})
    return fallback_plan


def _generate_quiz(topic: str, language: str = "english") -> dict[str, Any]:
    prompt = f"""
You are a science teacher.
Generate a quiz containing exactly 3 multiple-choice questions for school students on the topic: "{topic}".

Return ONLY a valid JSON array of 3 objects with the following keys:
- "question" (string)
- "options" (array of 4 strings)
- "correctAnswer" (integer, 0 to 3)

Keep the language simple and the questions age-appropriate.
Do not include markdown, commentary, or code fences.
"""
    res = query_llm(prompt)
    parsed = _extract_json(res.get("response", ""))
    if isinstance(parsed, list):
        return {"questions": parsed}
    raise RuntimeError("Quiz generation returned invalid JSON")


def _persist_simulation_result(db: Session, result: Any, prompt: str) -> None:
    record = db.query(SimulationRecord).filter(SimulationRecord.simulation_id == result.simulation_id).one_or_none()
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


def _extract_command_topic(command_prefix: str, message: str, context: dict[str, Any]) -> str:
    msg_strip = message.strip()
    if msg_strip.lower().startswith(command_prefix):
        topic = re.sub(rf"^{command_prefix}\s*", "", msg_strip, flags=re.IGNORECASE).strip()
        if topic:
            return topic
    return str(context.get("chapter_title") or context.get("assignment_title") or message)


def _run_video_tool(message: str, context: dict[str, Any]) -> dict[str, Any]:
    topic = _extract_command_topic("/video", message, context)
    response = httpx.post(
        settings.manim_service_url,
        params={
            "topic": _truncate(str(topic), 120),
            "level": "school",
            "persona": "teacher",
            "face_enabled": False,
        },
        timeout=300.0,
    )
    response.raise_for_status()
    data = response.json()

    # Upload generated video to Cloudflare R2
    video_id = data.get("video_id")
    external_url = None
    if video_id:
        try:
            from app.services.media_service import download_manim_video
            from app.core.storage import get_object_storage_client, presigned_media_url
            from io import BytesIO
            
            print(f"[chat-ai] Downloading generated Manim video bytes for video_id: {video_id}...", flush=True)
            video_bytes, content_type = download_manim_video(video_id)
            
            object_key = f"chat-assets/videos/{video_id}.mp4"
            client = get_object_storage_client()
            bucket = settings.object_storage_bucket
            
            print(f"[chat-ai] Uploading chat video to R2 (bucket={bucket}, key={object_key})...", flush=True)
            client.put_object(
                bucket,
                object_key,
                BytesIO(video_bytes),
                len(video_bytes),
                content_type=content_type
            )
            print(f"[chat-ai] Chat video upload complete.", flush=True)
            external_url = presigned_media_url(bucket, object_key)
            print(f"[chat-ai] Generated external url: {external_url}", flush=True)
        except Exception as upload_exc:
            print(f"[chat-ai] Warning: Failed to upload generated video to R2: {upload_exc}", flush=True)
            
    if not external_url:
        external_url = data.get("video_url") or data.get("video_path") or data.get("url")

    return {
        "asset_type": "video",
        "title": "Explanation video",
        "external_url": external_url,
        "payload_json": data,
    }


def _run_model_tool(message: str, context: dict[str, Any]) -> dict[str, Any]:
    msg_strip = message.strip().lower()
    prefix = "/model" if msg_strip.startswith("/model") else "/universe"
    query = _extract_command_topic(prefix, message, context)
    data = find_model(query)
    if data.get("error") or data.get("message") in {"No models found.", "No suitable model found."}:
        raise RuntimeError(str(data.get("error") or data.get("message") or "No model found"))
    return {
        "asset_type": "three_d_model",
        "title": data.get("name") or "3D model",
        "external_url": data.get("embedUrl") or data.get("viewerUrl"),
        "payload_json": data,
    }


def _run_quiz_tool(message: str, context: dict[str, Any]) -> dict[str, Any]:
    topic = _extract_command_topic("/quiz", message, context)
    data = _generate_quiz(topic=str(topic))
    return {
        "asset_type": "quiz",
        "title": f"Quiz on {topic}",
        "external_url": None,
        "payload_json": data,
    }


def _run_simulation_tool(db: Session, message: str, context: dict[str, Any]) -> dict[str, Any]:
    topic = _extract_command_topic("/simulation", message, context)
    instructions = context.get("assignment_instructions") or ""
    prompt = f"Teach me {topic}. {instructions}".strip()
    result = _SIMULATION_ORCHESTRATOR.pipeline.run(prompt)
    _persist_simulation_result(db, result, prompt)
    external_url = None
    if result.phase.value == "completed":
        external_url = f"{settings.backend_public_url.rstrip('/')}/simulations/{result.simulation_id}/html"
    return {
        "asset_type": "simulation",
        "title": f"Simulation for {topic}",
        "external_url": external_url,
        "payload_json": {
            "simulation_id": result.simulation_id,
            "status": result.phase.value,
            "quality_score": result.quality_score,
            "error": result.error,
        },
    }


def _run_tool(db: Session, tool_name: str, message: str, context: dict[str, Any]) -> dict[str, Any]:
    if tool_name == "video":
        return _run_video_tool(message, context)
    if tool_name == "model":
        return _run_model_tool(message, context)
    if tool_name == "quiz":
        return _run_quiz_tool(message, context)
    if tool_name == "simulation":
        return _run_simulation_tool(db, message, context)
    raise RuntimeError(f"Unsupported tool: {tool_name}")


def _build_answer_prompt(context: dict[str, Any], history: str, user_message: str, tool_summaries: list[dict[str, Any]]) -> str:
    return f"""
You are Mootion AI, a private student-only learning assistant.

Use the inherited class/chapter/assignment context when it helps, but do not restrict yourself to it.
Answer naturally if the question is broader than the current chapter.

Context:
{json.dumps(context, indent=2, ensure_ascii=False)}

Conversation history:
{history or "(none)"}

Student message:
{user_message}

Tool results:
{json.dumps(tool_summaries, indent=2, ensure_ascii=False)}

Rules:
- Be accurate, student-friendly, and concise unless the student asks for more detail.
- If a tool produced a useful asset, mention it briefly and clearly.
- If the user asked for a quiz, include a short introduction to the quiz.
- If the user asked for a video or simulation, explain what was generated and how it helps.
- Do not mention tool failures unless they block the answer.
- Do not sound like a teacher approval form; sound like a helpful tutor.

Return only the answer text.
"""


def _generate_final_answer(context: dict[str, Any], history: str, user_message: str, tool_summaries: list[dict[str, Any]]) -> str:
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        pieces = [
            "I can help with that.",
        ]
        if context.get("chapter_title"):
            pieces.append(f"We can connect this to {context['chapter_title']}.")
        for tool in tool_summaries:
            if tool["tool_name"] == "quiz":
                pieces.append("I also generated a 3-question quiz for practice.")
            elif tool["tool_name"] == "video":
                pieces.append("I generated a short explanation video.")
            elif tool["tool_name"] == "model":
                pieces.append("I found a relevant 3D model.")
            elif tool["tool_name"] == "simulation":
                pieces.append("I generated an interactive simulation.")
        pieces.append(_truncate(user_message, 120))
        return " ".join(pieces)

    client = _get_client()
    response = client.chat.completions.create(
        model=settings.azure_openai_deployment,
        temperature=0.3,
        messages=[
            {"role": "system", "content": "You are a helpful student AI tutor."},
            {"role": "user", "content": _build_answer_prompt(context, history, user_message, tool_summaries)},
        ],
    )
    text = (response.choices[0].message.content or "").strip()
    return text or "I am here to help, but I could not generate a response right now."


def create_student_chat_thread(
    db: Session,
    student: User,
    request: ChatThreadCreateRequest,
) -> ChatThreadResponse:
    resolved_class_id, context = _resolve_context(db, student, request.class_id, request.chapter_id, request.assignment_id)
    title = request.title or _build_default_title(context)

    thread = StudentAiChatThread(
        student_id=student.id,
        class_id=resolved_class_id,
        chapter_id=request.chapter_id,
        assignment_id=request.assignment_id,
        title=title,
        status="active",
        context_json=context,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _thread_to_response(db, thread)


def list_student_chat_threads(db: Session, student: User) -> list[ChatThreadListItem]:
    threads = (
        db.query(StudentAiChatThread)
        .filter(StudentAiChatThread.student_id == student.id)
        .order_by(StudentAiChatThread.updated_at.desc())
        .all()
    )
    return [_list_item_from_thread(db, thread) for thread in threads]


def get_student_chat_thread(db: Session, student: User, chat_id: str) -> ChatThreadResponse:
    thread = db.get(StudentAiChatThread, chat_id)
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    _ensure_thread_access(thread, student)
    return _thread_to_response(db, thread)


def list_student_chat_messages(db: Session, student: User, chat_id: str) -> list[ChatMessageResponse]:
    thread = db.get(StudentAiChatThread, chat_id)
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    _ensure_thread_access(thread, student)

    messages = (
        db.query(StudentAiChatMessage)
        .filter(StudentAiChatMessage.chat_id == thread.id)
        .order_by(StudentAiChatMessage.created_at.asc())
        .all()
    )
    return [_message_to_response(message) for message in messages]


def delete_student_chat_thread(db: Session, student: User, chat_id: str) -> bool:
    thread = db.get(StudentAiChatThread, chat_id)
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    _ensure_thread_access(thread, student)
    db.delete(thread)
    db.commit()
    return True


def send_student_chat_message(
    db: Session,
    student: User,
    chat_id: str,
    content: str,
) -> ChatSendMessageResponse:
    thread = db.get(StudentAiChatThread, chat_id)
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    _ensure_thread_access(thread, student)

    content = content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    user_message = StudentAiChatMessage(
        chat_id=thread.id,
        role="user",
        content=content,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    if not thread.title or thread.title == "AI chat":
        thread.title = _title_from_message(content)

    thread.context_json = thread.context_json or {}
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(thread)

    history_messages = (
        db.query(StudentAiChatMessage)
        .filter(StudentAiChatMessage.chat_id == thread.id)
        .order_by(StudentAiChatMessage.created_at.asc())
        .all()
    )
    history_text = _history_text(history_messages)
    context = thread.context_json or {}
    plan = _plan_tool_calls(content, context, history_text)
    tool_calls = plan.get("tool_calls") or []

    tool_messages: list[StudentAiChatMessage] = []
    tool_summaries: list[dict[str, Any]] = []
    generated_assets: list[ChatGeneratedAssetResponse] = []
    tool_call_responses: list[ChatToolCallResponse] = []

    for tool_call in tool_calls:
        tool_name = str(tool_call.get("tool_name") or "").strip()
        reason = str(tool_call.get("reason") or "").strip() or None
        try:
            result = _run_tool(db, tool_name, content, context)
            tool_summaries.append({"tool_name": tool_name, "status": "ready", "result": result})
            tool_call_responses.append(
                ChatToolCallResponse(
                    tool_name=tool_name,
                    status="ready",
                    reason=reason,
                    output_json=result.get("payload_json") or result,
                )
            )
            tool_message = StudentAiChatMessage(
                chat_id=thread.id,
                role="tool",
                content=f"{tool_name} tool completed.",
                tool_name=tool_name,
                tool_input_json={"message": content, "context": context},
                tool_output_json=result,
                asset_type=result.get("asset_type"),
                asset_json=result,
            )
            db.add(tool_message)
            tool_messages.append(tool_message)

            generated_assets.append(
                ChatGeneratedAssetResponse(
                    asset_type=str(result.get("asset_type") or tool_name),
                    title=result.get("title"),
                    description=reason,
                    external_url=result.get("external_url"),
                    payload_json=result.get("payload_json") or {},
                )
            )
        except Exception as exc:
            failure = {
                "tool_name": tool_name,
                "status": "failed",
                "error": str(exc),
            }
            tool_summaries.append(failure)
            tool_call_responses.append(
                ChatToolCallResponse(
                    tool_name=tool_name,
                    status="failed",
                    reason=reason or str(exc),
                    output_json={"error": str(exc)},
                )
            )
            tool_message = StudentAiChatMessage(
                chat_id=thread.id,
                role="tool",
                content=f"{tool_name} tool failed: {exc}",
                tool_name=tool_name,
                tool_input_json={"message": content, "context": context},
                tool_output_json={"error": str(exc)},
            )
            db.add(tool_message)
            tool_messages.append(tool_message)

    db.commit()
    for tool_message in tool_messages:
        db.refresh(tool_message)

    final_answer = _generate_final_answer(context, history_text, content, tool_summaries)
    assistant_message = StudentAiChatMessage(
        chat_id=thread.id,
        role="assistant",
        content=final_answer,
        tool_output_json={"tool_summaries": tool_summaries},
        asset_json={"generated_assets": [asset.model_dump() for asset in generated_assets]},
    )
    db.add(assistant_message)
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assistant_message)
    db.refresh(thread)

    return ChatSendMessageResponse(
        chat=_thread_to_response(db, thread),
        user_message=_message_to_response(user_message),
        assistant_message=_message_to_response(assistant_message),
        tool_calls=tool_call_responses,
        generated_assets=generated_assets,
    )
