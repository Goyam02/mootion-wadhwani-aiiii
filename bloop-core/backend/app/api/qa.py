from fastapi import UploadFile, APIRouter, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from services.document_service import ingest_document
from services.qa_service import answer_ques
from services.sad_talker_service import run_sadtalker
from services.tts_service import text_to_speech
from services import chat_service, message_service
from utils.file_utils import save_file
from core.config import DOCUMENT_UPLOAD_DIR
from uuid import UUID
import uuid
import requests

router = APIRouter(prefix="/qa", tags=["Document Ask Endpoints"])

MANIM_SERVICE_URL = "http://manim-engine:8001/explain"

@router.post("/upload-doc")
async def upload_file(
    file: UploadFile = File(...),
    chat_id: UUID | None = Query(None),  # Made optional
    db: Session = Depends(get_db)
):
    """Upload a document to a chat session (or standalone for Plan module)"""
    
    # If chat_id provided, validate it exists
    if chat_id:
        chat = chat_service.get_chat(db, chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save file
    file_path = save_file(file, DOCUMENT_UPLOAD_DIR)
    
    # Ingest document
    doc_id = ingest_document(file_path, chat_id, db)
    
    # Only store message if chat_id provided
    if chat_id:
        message_service.create_message(
            db=db,
            chat_id=chat_id,
            role="user",
            content=f"[Uploaded document: {file.filename}]",
            document_ids=[doc_id]
        )
        chat_service.update_chat_timestamp(db, chat_id)
    
    return {
        "document_id": doc_id,
        "chat_id": chat_id,
        "status": "uploaded",
        "filename": file.filename
    }

@router.post("/ask")
async def ask_question(
    chat_id: UUID,
    question: str,
    document_id: str | None = None,
    video_enabled: bool = False,
    face_enabled: bool = False,
    db: Session = Depends(get_db)
):
    """Ask a question in a chat session"""
    chat = chat_service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Validation: face_enabled requires video_enabled
    if face_enabled and not video_enabled:
        raise HTTPException(
            status_code=400, 
            detail="face_enabled requires video_enabled to be true"
        )
    
    # Auto-generate title from first user message
    msg_count = chat_service.get_message_count(db, chat_id)
    if msg_count == 0 and not chat.title:
        title = chat_service.generate_title_from_first_message(question)
        from core.models import Chat
        db.query(Chat).filter(Chat.chat_id == chat_id).update({"title": title})
        db.commit()
    
    # Get conversation history for context
    messages = message_service.get_messages(db, chat_id)
    context = message_service.build_context_for_llm(messages)
    
    # Store user message
    message_service.create_message(
        db=db,
        chat_id=chat_id,
        role="user",
        content=question,
        document_ids=[document_id] if document_id else None
    )
    
    # Generate answer with context
    answer = answer_ques(question, document_id, context=context)
    
    response = {
        "answer": answer,
        "video_enabled": video_enabled,
        "face_enabled": face_enabled
    }
    
    video_ids = []
    
    # Handle video generation
    if video_enabled:
        manim_payload = {
            "topic": answer,
            "level": "school",
            "persona": "teacher",
            "face_enabled": face_enabled
        }
        
        try:
            manim_response = requests.post(
                MANIM_SERVICE_URL,
                params=manim_payload,
                timeout=300
            )
            
            if manim_response.status_code == 200:
                video_data = manim_response.json()
                video_id = video_data.get("video_id")
                if video_id:
                    video_ids.append(video_id)
                    response["video_id"] = video_id
                
                response.update({
                    "video_status": "processing",
                    "manim_pipeline": True
                })
            else:
                response["error"] = "Manim generation failed"
        except Exception as e:
            response["error"] = f"Manim generation error: {str(e)}"
    
    # Store assistant message
    message_service.create_message(
        db=db,
        chat_id=chat_id,
        role="assistant",
        content=answer,
        video_ids=video_ids if video_ids else None
    )
    
    # Update chat timestamp
    chat_service.update_chat_timestamp(db, chat_id)
    
    return response

@router.post("/ask-from-image")
def ask_from_image(
    chat_id: UUID,
    image: UploadFile = File(...),
    document_id: str | None = None,
    video_enabled: bool = False,
    face_enabled: bool = False,
    image_path: str = "D:/bloop/data/avatars/sir-isaac-newton.webp",
    db: Session = Depends(get_db)
):
    """Ask a question from an image in a chat session"""
    chat = chat_service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Validation: face_enabled requires video_enabled
    if face_enabled and not video_enabled:
        raise HTTPException(
            status_code=400, 
            detail="face_enabled requires video_enabled to be true"
        )
    
    job_id = str(uuid.uuid4())
    path = save_file(image, "data/uploads/images")
    
    # Get conversation history
    messages = message_service.get_messages(db, chat_id)
    context = message_service.build_context_for_llm(messages)
    
    # Store user image as message
    message_service.create_message(
        db=db,
        chat_id=chat_id,
        role="user",
        content=f"[Image uploaded: {image.filename}]"
    )
    
    answer = answer_ques(
        question=None,
        document_id=document_id,
        image_path=path,
        context=context
    )
    
    response = {
        "answer": answer,
        "video_enabled": video_enabled,
        "face_enabled": face_enabled
    }
    
    video_ids = []
    
    if video_enabled:
        audio_path = text_to_speech(answer, job_id)
        run_sadtalker(image_path, audio_path, job_id)
        
        video_ids.append(job_id)
        response["video_id"] = job_id
        
        response.update({
            "job_id": job_id,
            "video_status": "processing",
            "audio_available": True
        })
    
    # Store assistant message
    message_service.create_message(
        db=db,
        chat_id=chat_id,
        role="assistant",
        content=answer,
        video_ids=video_ids if video_ids else None
    )
    
    # Update chat timestamp
    chat_service.update_chat_timestamp(db, chat_id)
    
    return response