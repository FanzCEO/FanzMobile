"""
Threads API Router
Manages conversation threads and events for PTT/realtime messaging.
Persists to PostgreSQL database.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payments import Thread as ThreadModel, ThreadEvent as ThreadEventModel

router = APIRouter(prefix="/api/threads", tags=["threads"])


class ThreadCreate(BaseModel):
    name: str
    description: Optional[str] = None
    channel: Optional[str] = None


class ThreadResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    channel: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    body: str
    channel: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    thread_id: str
    type: str
    user_id: Optional[str] = None
    body: Optional[str] = None
    channel: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[ThreadResponse])
async def list_threads(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """
    List all threads, ordered by most recently updated.
    """
    threads = db.query(ThreadModel).order_by(ThreadModel.updated_at.desc()).limit(limit).all()
    return [
        ThreadResponse(
            id=str(t.id),
            name=t.name,
            description=t.description,
            channel=t.channel,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat()
        )
        for t in threads
    ]


@router.post("", response_model=ThreadResponse)
async def create_thread(data: ThreadCreate, db: Session = Depends(get_db)):
    """
    Create a new thread.
    """
    thread = ThreadModel(
        name=data.name,
        description=data.description,
        channel=data.channel
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    return ThreadResponse(
        id=str(thread.id),
        name=thread.name,
        description=thread.description,
        channel=thread.channel,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat()
    )


@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str, db: Session = Depends(get_db)):
    """
    Get a specific thread by ID.
    """
    try:
        uuid_id = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid thread ID format")

    thread = db.query(ThreadModel).filter(ThreadModel.id == uuid_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    return ThreadResponse(
        id=str(thread.id),
        name=thread.name,
        description=thread.description,
        channel=thread.channel,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat()
    )


@router.delete("/{thread_id}")
async def delete_thread(thread_id: str, db: Session = Depends(get_db)):
    """
    Delete a thread and all its events.
    """
    try:
        uuid_id = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid thread ID format")

    thread = db.query(ThreadModel).filter(ThreadModel.id == uuid_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Delete events first
    db.query(ThreadEventModel).filter(ThreadEventModel.thread_id == uuid_id).delete()
    db.delete(thread)
    db.commit()

    return {"status": "deleted", "thread_id": thread_id}


@router.get("/{thread_id}/events", response_model=List[EventResponse])
async def get_thread_events(
    thread_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get events for a thread (messages, joins, PTT events, etc).
    """
    try:
        uuid_id = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid thread ID format")

    thread = db.query(ThreadModel).filter(ThreadModel.id == uuid_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    events = db.query(ThreadEventModel).filter(
        ThreadEventModel.thread_id == uuid_id
    ).order_by(ThreadEventModel.created_at.asc()).offset(offset).limit(limit).all()

    return [
        EventResponse(
            id=str(e.id),
            thread_id=str(e.thread_id),
            type=e.event_type,
            user_id=e.user_id,
            body=e.body,
            channel=e.channel,
            created_at=e.created_at.isoformat()
        )
        for e in events
    ]


@router.post("/{thread_id}/messages", response_model=EventResponse)
async def create_message(thread_id: str, data: MessageCreate, db: Session = Depends(get_db)):
    """
    Post a message to a thread.
    """
    try:
        uuid_id = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid thread ID format")

    thread = db.query(ThreadModel).filter(ThreadModel.id == uuid_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    event = ThreadEventModel(
        thread_id=uuid_id,
        event_type="message",
        body=data.body,
        channel=data.channel
    )
    db.add(event)

    # Update thread timestamp
    thread.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(event)

    return EventResponse(
        id=str(event.id),
        thread_id=str(event.thread_id),
        type=event.event_type,
        user_id=event.user_id,
        body=event.body,
        channel=event.channel,
        created_at=event.created_at.isoformat()
    )


@router.post("/{thread_id}/events", response_model=EventResponse)
async def create_event(
    thread_id: str,
    event_type: str,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Create a generic event (join, leave, ptt_start, ptt_end).
    """
    try:
        uuid_id = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid thread ID format")

    thread = db.query(ThreadModel).filter(ThreadModel.id == uuid_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    event = ThreadEventModel(
        thread_id=uuid_id,
        event_type=event_type,
        user_id=user_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return EventResponse(
        id=str(event.id),
        thread_id=str(event.thread_id),
        type=event.event_type,
        user_id=event.user_id,
        body=event.body,
        channel=event.channel,
        created_at=event.created_at.isoformat()
    )
