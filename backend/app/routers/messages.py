from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

router = APIRouter()


class Message(BaseModel):
    id: str
    content: str
    sender: str
    received_at: datetime
    processed: bool = False
    extracted_data: Optional[Dict] = None


class MessageCreate(BaseModel):
    content: str
    sender: str
    source: str = "manual"  # manual, sms, email, etc.


@router.get("/", response_model=List[Message])
async def get_messages(
    limit: int = 50,
    offset: int = 0,
    processed: Optional[bool] = None
) -> List[Message]:
    """Get all messages with optional filtering"""
    # TODO: Fetch from database
    return []


@router.post("/", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_message(message: MessageCreate) -> Message:
    """Create a new message and trigger AI processing"""
    # TODO: Save to database
    # TODO: Trigger AI extraction workflow
    return Message(
        id="msg_123",
        content=message.content,
        sender=message.sender,
        received_at=datetime.utcnow(),
        processed=False,
    )


@router.get("/{message_id}", response_model=Message)
async def get_message(message_id: str) -> Message:
    """Get a specific message by ID"""
    # TODO: Fetch from database
    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/{message_id}/process")
async def process_message(message_id: str) -> Dict[str, str]:
    """Manually trigger AI processing for a message"""
    # TODO: Trigger AI extraction
    return {"message": f"Processing triggered for message {message_id}"}


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id: str):
    """Delete a message"""
    # TODO: Delete from database
    return None
