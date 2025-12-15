"""
WickedCRM AI Routes
API endpoints for AI companion chat, message drafts, and content suggestions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import ai_service


router = APIRouter(prefix="/api/ai", tags=["AI"])


# Request Models

class ChatRequest(BaseModel):
    """Request model for AI chat."""
    user_id: str
    companion_id: str = "professional"
    message: str


class DraftMessageRequest(BaseModel):
    """Request model for message draft generation."""
    contact_name: str
    context: Optional[str] = ""
    tone: str = "friendly"
    message_type: str = "follow_up"


class ContentSuggestionsRequest(BaseModel):
    """Request model for content suggestions."""
    creator_profile: str
    content_type: str = "post"
    count: int = 5


# Routes

@router.get("/health")
async def health_check():
    """Check AI service health status."""
    return ai_service.get_health_status()


@router.get("/companions")
async def get_companions():
    """Get list of available AI companions."""
    return {"companions": ai_service.get_companions()}


@router.post("/chat")
async def chat_with_companion(request: ChatRequest):
    """Chat with an AI companion."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 characters)")

    result = await ai_service.chat(
        user_id=request.user_id,
        companion_id=request.companion_id,
        message=request.message
    )
    return result


@router.delete("/conversation/{user_id}/{companion_id}")
async def clear_conversation(user_id: str, companion_id: str):
    """Clear conversation history with a companion."""
    ai_service.clear_conversation(user_id, companion_id)
    return {"status": "cleared", "user_id": user_id, "companion_id": companion_id}


@router.post("/draft-message")
async def draft_message(request: DraftMessageRequest):
    """Generate a message draft for a contact."""
    if not request.contact_name.strip():
        raise HTTPException(status_code=400, detail="Contact name is required")

    result = await ai_service.draft_message(
        contact_name=request.contact_name,
        context=request.context or "",
        tone=request.tone,
        message_type=request.message_type
    )
    return result


@router.post("/content-suggestions")
async def content_suggestions(request: ContentSuggestionsRequest):
    """Get AI-generated content suggestions."""
    if request.count < 1 or request.count > 10:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 10")

    result = await ai_service.content_suggestions(
        creator_profile=request.creator_profile,
        content_type=request.content_type,
        count=request.count
    )
    return result
