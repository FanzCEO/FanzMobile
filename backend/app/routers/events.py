"""
WickedCRM Events Router
Calendar event management.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/events", tags=["Events"])


# ============== DATA MODELS ==============

EventStatus = Literal["scheduled", "confirmed", "completed", "cancelled"]


class Event(BaseModel):
    id: str
    user_id: str
    contact_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    status: EventStatus = "scheduled"
    reminder_sent: bool = False
    created_at: str
    updated_at: str


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    contact_id: Optional[str] = None
    status: EventStatus = "scheduled"


# ============== IN-MEMORY STORAGE ==============

# Generate some sample events
now = datetime.now()
events_db: List[Event] = [
    Event(
        id="event-1",
        user_id="user-1",
        contact_id="contact-1",
        title="Video call with Sarah",
        description="Discuss exclusive content schedule",
        start_time=(now + timedelta(days=1, hours=2)).isoformat(),
        end_time=(now + timedelta(days=1, hours=3)).isoformat(),
        location="Zoom",
        status="confirmed",
        created_at=now.isoformat(),
        updated_at=now.isoformat()
    ),
    Event(
        id="event-2",
        user_id="user-1",
        contact_id="contact-3",
        title="Collab planning with Alex",
        description="Plan upcoming collaboration",
        start_time=(now + timedelta(days=3)).isoformat(),
        end_time=(now + timedelta(days=3, hours=1)).isoformat(),
        location="Coffee Shop",
        status="scheduled",
        created_at=now.isoformat(),
        updated_at=now.isoformat()
    ),
    Event(
        id="event-3",
        user_id="user-1",
        title="Content creation day",
        description="Batch create content for the week",
        start_time=(now + timedelta(days=5)).isoformat(),
        end_time=(now + timedelta(days=5, hours=4)).isoformat(),
        location="Home studio",
        status="scheduled",
        created_at=now.isoformat(),
        updated_at=now.isoformat()
    ),
]


# ============== ROUTES ==============

@router.get("")
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None
) -> List[Event]:
    """Get all events with optional date filtering."""
    filtered = events_db

    if start_date:
        filtered = [e for e in filtered if e.start_time >= start_date]

    if end_date:
        filtered = [e for e in filtered if e.start_time <= end_date]

    if status:
        filtered = [e for e in filtered if e.status == status]

    # Sort by start_time
    filtered.sort(key=lambda e: e.start_time)

    return filtered[skip:skip + limit]


@router.get("/{event_id}")
async def get_event(event_id: str) -> Event:
    """Get a specific event."""
    for event in events_db:
        if event.id == event_id:
            return event
    raise HTTPException(status_code=404, detail="Event not found")


@router.post("")
async def create_event(request: CreateEventRequest) -> Event:
    """Create a new event."""
    now = datetime.now().isoformat()
    new_event = Event(
        id=f"event-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        contact_id=request.contact_id,
        title=request.title,
        description=request.description,
        start_time=request.start_time,
        end_time=request.end_time,
        location=request.location,
        status=request.status,
        created_at=now,
        updated_at=now
    )

    events_db.append(new_event)
    return new_event


@router.put("/{event_id}")
async def update_event(event_id: str, request: CreateEventRequest) -> Event:
    """Update an event."""
    for event in events_db:
        if event.id == event_id:
            event.title = request.title
            event.description = request.description
            event.start_time = request.start_time
            event.end_time = request.end_time
            event.location = request.location
            event.contact_id = request.contact_id
            event.status = request.status
            event.updated_at = datetime.now().isoformat()
            return event

    raise HTTPException(status_code=404, detail="Event not found")


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    """Delete an event."""
    global events_db
    for i, event in enumerate(events_db):
        if event.id == event_id:
            events_db.pop(i)
            return {"status": "deleted", "id": event_id}
    raise HTTPException(status_code=404, detail="Event not found")


@router.post("/{event_id}/confirm")
async def confirm_event(event_id: str) -> Event:
    """Confirm an event."""
    for event in events_db:
        if event.id == event_id:
            event.status = "confirmed"
            event.updated_at = datetime.now().isoformat()
            return event
    raise HTTPException(status_code=404, detail="Event not found")


@router.post("/{event_id}/cancel")
async def cancel_event(event_id: str) -> Event:
    """Cancel an event."""
    for event in events_db:
        if event.id == event_id:
            event.status = "cancelled"
            event.updated_at = datetime.now().isoformat()
            return event
    raise HTTPException(status_code=404, detail="Event not found")
