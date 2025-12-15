"""
WickedCRM Messages Router
Multi-channel message management with AI processing.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/messages", tags=["Messages"])


# ============== DATA MODELS ==============

MessageDirection = Literal["inbound", "outbound"]
MessageChannel = Literal["sms", "rm_chat", "email", "manual", "whatsapp", "telegram", "telnyx"]


class AIResult(BaseModel):
    contact_name: Optional[str] = None
    phone_number: Optional[str] = None
    meeting_detected: Optional[bool] = None
    meeting_time: Optional[str] = None
    meeting_location: Optional[str] = None
    tasks: Optional[List[str]] = None
    intent: Optional[str] = None
    importance: Optional[int] = None


class Message(BaseModel):
    id: str
    user_id: str
    contact_id: Optional[str] = None
    direction: MessageDirection
    channel: MessageChannel
    external_id: Optional[str] = None
    body: str
    received_at: str
    ai_processed: bool = False
    ai_result: Optional[AIResult] = None
    created_at: str


class CreateMessageRequest(BaseModel):
    body: str
    channel: MessageChannel
    direction: MessageDirection = "outbound"
    contact_id: Optional[str] = None


# ============== IN-MEMORY STORAGE ==============
# In production, this would be a database

messages_db: List[Message] = [
    Message(
        id="msg-001",
        user_id="user-1",
        contact_id="contact-1",
        direction="inbound",
        channel="sms",
        body="Hey! Are we still meeting tomorrow at 3pm?",
        received_at=datetime.now().isoformat(),
        ai_processed=True,
        ai_result=AIResult(
            contact_name="Sarah",
            meeting_detected=True,
            meeting_time="tomorrow at 3pm",
            intent="schedule_confirmation"
        ),
        created_at=datetime.now().isoformat()
    ),
    Message(
        id="msg-002",
        user_id="user-1",
        contact_id="contact-2",
        direction="inbound",
        channel="whatsapp",
        body="Just saw your latest content, absolutely stunning! Can't wait to see more.",
        received_at=datetime.now().isoformat(),
        ai_processed=True,
        ai_result=AIResult(
            contact_name="Mike",
            intent="positive_feedback",
            importance=7
        ),
        created_at=datetime.now().isoformat()
    ),
    Message(
        id="msg-003",
        user_id="user-1",
        contact_id="contact-3",
        direction="outbound",
        channel="email",
        body="Thanks for subscribing! Here's your exclusive welcome gift...",
        received_at=datetime.now().isoformat(),
        ai_processed=False,
        ai_result=None,
        created_at=datetime.now().isoformat()
    ),
]


# ============== ROUTES ==============

@router.get("")
async def get_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    channel: Optional[str] = None,
    direction: Optional[str] = None
) -> List[Message]:
    """
    Get all messages with optional filtering.

    - **skip**: Number of messages to skip (pagination)
    - **limit**: Maximum number of messages to return
    - **channel**: Filter by channel (sms, whatsapp, email, etc.)
    - **direction**: Filter by direction (inbound, outbound)
    """
    filtered = messages_db

    if channel:
        filtered = [m for m in filtered if m.channel == channel]

    if direction:
        filtered = [m for m in filtered if m.direction == direction]

    return filtered[skip:skip + limit]


@router.get("/{message_id}")
async def get_message(message_id: str) -> Message:
    """Get a specific message by ID."""
    for msg in messages_db:
        if msg.id == message_id:
            return msg
    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/manual")
async def create_manual_message(request: CreateMessageRequest) -> Message:
    """
    Create a manual message (for testing or manual entry).

    In production, this would also trigger AI processing.
    """
    new_message = Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        user_id="user-1",  # In production, get from auth
        contact_id=request.contact_id,
        direction=request.direction,
        channel=request.channel,
        body=request.body,
        received_at=datetime.now().isoformat(),
        ai_processed=False,
        ai_result=None,
        created_at=datetime.now().isoformat()
    )

    # Add to database
    messages_db.insert(0, new_message)

    # In production, trigger AI processing here
    # await process_message_with_ai(new_message)

    return new_message


@router.delete("/{message_id}")
async def delete_message(message_id: str):
    """Delete a message by ID."""
    global messages_db
    for i, msg in enumerate(messages_db):
        if msg.id == message_id:
            messages_db.pop(i)
            return {"status": "deleted", "id": message_id}
    raise HTTPException(status_code=404, detail="Message not found")


# ============== CHANNEL STATS ==============

@router.get("/stats/channels")
async def get_channel_stats():
    """Get message counts by channel."""
    stats = {}
    for msg in messages_db:
        channel = msg.channel
        if channel not in stats:
            stats[channel] = {"total": 0, "inbound": 0, "outbound": 0}
        stats[channel]["total"] += 1
        stats[channel][msg.direction] += 1

    return {
        "channels": stats,
        "total_messages": len(messages_db)
    }


# ============== AI PROCESSING ==============

@router.post("/{message_id}/process")
async def process_message(message_id: str):
    """
    Trigger AI processing on a message.

    Extracts contact info, detects meetings, analyzes intent.
    """
    for msg in messages_db:
        if msg.id == message_id:
            # Simulate AI processing
            msg.ai_processed = True
            msg.ai_result = AIResult(
                intent="general",
                importance=5
            )
            return {
                "status": "processed",
                "message_id": message_id,
                "ai_result": msg.ai_result
            }

    raise HTTPException(status_code=404, detail="Message not found")
