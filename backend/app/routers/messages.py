"""
WickedCRM Messages Router
Multi-channel message management with AI processing.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/messages", tags=["Messages"])

# Import AI processor (lazy load to avoid circular imports)
_message_processor = None

def get_message_processor():
    global _message_processor
    if _message_processor is None:
        from app.services.message_processor import message_processor
        _message_processor = message_processor
    return _message_processor


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

    Uses LLM to extract:
    - Contact names and phone numbers
    - Meeting times and dates
    - Locations and places
    - Tasks and action items
    - Intent classification
    - Importance scoring
    """
    for msg in messages_db:
        if msg.id == message_id:
            processor = get_message_processor()

            # Process with AI
            sender_info = {
                "contact_id": msg.contact_id,
                "channel": msg.channel,
                "direction": msg.direction
            }

            extracted = await processor.process_message(msg.body, sender_info)

            # Update message with AI results
            msg.ai_processed = True
            msg.ai_result = AIResult(
                contact_name=extracted.contact_name,
                phone_number=extracted.phone_number,
                meeting_detected=extracted.meeting_detected,
                meeting_time=extracted.meeting_time,
                meeting_location=extracted.meeting_location,
                tasks=extracted.tasks,
                intent=extracted.intent,
                importance=extracted.importance
            )

            return {
                "status": "processed",
                "message_id": message_id,
                "ai_result": msg.ai_result,
                "full_extraction": extracted.model_dump()
            }

    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/process/batch")
async def process_messages_batch(message_ids: List[str]):
    """
    Process multiple messages with AI.

    Useful for bulk processing of unprocessed messages.
    """
    processor = get_message_processor()
    results = []

    for msg_id in message_ids:
        for msg in messages_db:
            if msg.id == msg_id and not msg.ai_processed:
                sender_info = {
                    "contact_id": msg.contact_id,
                    "channel": msg.channel,
                    "direction": msg.direction
                }

                extracted = await processor.process_message(msg.body, sender_info)

                msg.ai_processed = True
                msg.ai_result = AIResult(
                    contact_name=extracted.contact_name,
                    phone_number=extracted.phone_number,
                    meeting_detected=extracted.meeting_detected,
                    meeting_time=extracted.meeting_time,
                    meeting_location=extracted.meeting_location,
                    tasks=extracted.tasks,
                    intent=extracted.intent,
                    importance=extracted.importance
                )

                results.append({
                    "message_id": msg_id,
                    "status": "processed",
                    "extracted": extracted.model_dump()
                })
                break
        else:
            results.append({
                "message_id": msg_id,
                "status": "not_found_or_already_processed"
            })

    return {
        "processed": len([r for r in results if r["status"] == "processed"]),
        "results": results
    }


@router.get("/unprocessed")
async def get_unprocessed_messages(limit: int = 50):
    """Get messages that haven't been AI processed yet."""
    unprocessed = [m for m in messages_db if not m.ai_processed][:limit]
    return {
        "count": len(unprocessed),
        "messages": unprocessed
    }


# ============== SYNC ENDPOINTS (for Mac/Android apps) ==============

class SyncMessageRequest(BaseModel):
    body: str
    channel: MessageChannel
    direction: MessageDirection
    external_id: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    received_at: Optional[str] = None


@router.post("/sync")
async def sync_message(request: SyncMessageRequest, background_tasks: BackgroundTasks) -> Message:
    """
    Sync a message from external source (Mac iMessage, Android SMS).

    Used by:
    - macOS iMessage sync service
    - Android SMS replacement app

    Automatically triggers AI processing in background.
    """
    now = datetime.now().isoformat()

    # Check for duplicate by external_id
    if request.external_id:
        for msg in messages_db:
            if msg.external_id == request.external_id:
                return msg  # Already synced

    new_message = Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        contact_id=None,  # TODO: Match to contact by phone
        direction=request.direction,
        channel=request.channel,
        external_id=request.external_id,
        body=request.body,
        received_at=request.received_at or now,
        ai_processed=False,
        ai_result=AIResult(
            contact_name=request.contact_name,
            phone_number=request.contact_phone
        ),
        created_at=now
    )

    messages_db.insert(0, new_message)

    # Trigger AI processing in background
    async def process_in_background(msg_id: str):
        try:
            processor = get_message_processor()
            for msg in messages_db:
                if msg.id == msg_id:
                    sender_info = {
                        "contact_id": msg.contact_id,
                        "channel": msg.channel,
                        "direction": msg.direction,
                        "contact_phone": request.contact_phone,
                        "contact_name": request.contact_name
                    }
                    extracted = await processor.process_message(msg.body, sender_info)

                    msg.ai_processed = True
                    msg.ai_result = AIResult(
                        contact_name=extracted.contact_name or request.contact_name,
                        phone_number=extracted.phone_number or request.contact_phone,
                        meeting_detected=extracted.meeting_detected,
                        meeting_time=extracted.meeting_time,
                        meeting_location=extracted.meeting_location,
                        tasks=extracted.tasks,
                        intent=extracted.intent,
                        importance=extracted.importance
                    )
                    break
        except Exception as e:
            print(f"Background AI processing failed: {e}")

    background_tasks.add_task(process_in_background, new_message.id)

    return new_message


# ============== OUTGOING MESSAGE QUEUE ==============

outgoing_queue: List[dict] = []


class QueueMessageRequest(BaseModel):
    to: str  # Phone number
    body: str
    channel: str = "sms"


@router.post("/queue")
async def queue_outgoing_message(request: QueueMessageRequest):
    """Queue a message to be sent by Mac/Android app."""
    msg_id = f"out-{uuid.uuid4().hex[:8]}"

    outgoing_queue.append({
        "id": msg_id,
        "to": request.to,
        "body": request.body,
        "channel": request.channel,
        "queued_at": datetime.now().isoformat(),
        "status": "pending"
    })

    return {"status": "queued", "id": msg_id}


@router.get("/outgoing")
async def get_outgoing_messages():
    """Get pending outgoing messages for Mac/Android apps to send."""
    pending = [m for m in outgoing_queue if m["status"] == "pending"]
    return pending


@router.post("/{message_id}/sent")
async def mark_message_sent(message_id: str):
    """Mark an outgoing message as sent."""
    for msg in outgoing_queue:
        if msg["id"] == message_id:
            msg["status"] = "sent"
            msg["sent_at"] = datetime.now().isoformat()
            return {"status": "marked_sent", "id": message_id}

    raise HTTPException(status_code=404, detail="Message not found in queue")


# ============== WEBHOOKS (for Twilio/Telnyx incoming) ==============

@router.post("/webhook/twilio")
async def twilio_webhook(
    From: str = "",
    To: str = "",
    Body: str = "",
    MessageSid: str = ""
):
    """
    Twilio incoming SMS webhook.

    Configure in Twilio console:
    POST https://your-domain.com/api/messages/webhook/twilio
    """
    new_message = Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        contact_id=None,
        direction="inbound",
        channel="sms",
        external_id=MessageSid,
        body=Body,
        received_at=datetime.now().isoformat(),
        ai_processed=False,
        ai_result=AIResult(phone_number=From),
        created_at=datetime.now().isoformat()
    )

    messages_db.insert(0, new_message)

    # Return TwiML response
    return f'<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


@router.post("/webhook/telnyx")
async def telnyx_webhook(data: dict = {}):
    """
    Telnyx incoming SMS webhook.

    Configure in Telnyx portal:
    POST https://your-domain.com/api/messages/webhook/telnyx
    """
    event_type = data.get("data", {}).get("event_type", "")

    if event_type == "message.received":
        payload = data.get("data", {}).get("payload", {})

        new_message = Message(
            id=f"msg-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            contact_id=None,
            direction="inbound",
            channel="telnyx",
            external_id=payload.get("id"),
            body=payload.get("text", ""),
            received_at=datetime.now().isoformat(),
            ai_processed=False,
            ai_result=AIResult(phone_number=payload.get("from", {}).get("phone_number")),
            created_at=datetime.now().isoformat()
        )

        messages_db.insert(0, new_message)

    return {"status": "received"}
