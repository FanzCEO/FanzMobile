"""
Threads API Router
Manages conversation threads and events for PTT/realtime messaging.
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/threads", tags=["threads"])


# In-memory storage (replace with database in production)
threads_db: dict = {}
events_db: dict = {}  # thread_id -> list of events


class ThreadCreate(BaseModel):
    name: str
    description: Optional[str] = None
    channel: Optional[str] = None


class Thread(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    channel: Optional[str] = None
    created_at: str
    updated_at: str


class MessageCreate(BaseModel):
    body: str
    channel: Optional[str] = None


class Event(BaseModel):
    id: str
    thread_id: str
    type: str  # "message", "join", "leave", "ptt_start", "ptt_end"
    user_id: Optional[str] = None
    body: Optional[str] = None
    channel: Optional[str] = None
    created_at: str


@router.get("", response_model=List[Thread])
async def list_threads(limit: int = Query(50, ge=1, le=100)):
    """
    List all threads, ordered by most recently updated.
    """
    threads = list(threads_db.values())
    threads.sort(key=lambda t: t["updated_at"], reverse=True)
    return threads[:limit]


@router.post("", response_model=Thread)
async def create_thread(data: ThreadCreate):
    """
    Create a new thread.
    """
    thread_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    thread = {
        "id": thread_id,
        "name": data.name,
        "description": data.description,
        "channel": data.channel,
        "created_at": now,
        "updated_at": now
    }

    threads_db[thread_id] = thread
    events_db[thread_id] = []

    return thread


@router.get("/{thread_id}", response_model=Thread)
async def get_thread(thread_id: str):
    """
    Get a specific thread by ID.
    """
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")
    return threads_db[thread_id]


@router.delete("/{thread_id}")
async def delete_thread(thread_id: str):
    """
    Delete a thread and all its events.
    """
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    del threads_db[thread_id]
    if thread_id in events_db:
        del events_db[thread_id]

    return {"status": "deleted", "thread_id": thread_id}


@router.get("/{thread_id}/events", response_model=List[Event])
async def get_thread_events(
    thread_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Get events for a thread (messages, joins, PTT events, etc).
    """
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    events = events_db.get(thread_id, [])
    return events[offset:offset + limit]


@router.post("/{thread_id}/messages", response_model=Event)
async def create_message(thread_id: str, data: MessageCreate):
    """
    Post a message to a thread.
    """
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    event_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    event = {
        "id": event_id,
        "thread_id": thread_id,
        "type": "message",
        "user_id": None,  # Would come from auth in production
        "body": data.body,
        "channel": data.channel,
        "created_at": now
    }

    if thread_id not in events_db:
        events_db[thread_id] = []
    events_db[thread_id].append(event)

    # Update thread timestamp
    threads_db[thread_id]["updated_at"] = now

    return event


@router.post("/{thread_id}/events", response_model=Event)
async def create_event(thread_id: str, event_type: str, user_id: Optional[str] = None):
    """
    Create a generic event (join, leave, ptt_start, ptt_end).
    """
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    event_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    event = {
        "id": event_id,
        "thread_id": thread_id,
        "type": event_type,
        "user_id": user_id,
        "body": None,
        "channel": None,
        "created_at": now
    }

    if thread_id not in events_db:
        events_db[thread_id] = []
    events_db[thread_id].append(event)

    return event
