"""
WickedCRM Events Router
Calendar event management with database persistence.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.event import Event as EventModel

router = APIRouter(prefix="/api/events", tags=["Events"])


# ============== DATA MODELS ==============

EventStatus = Literal["scheduled", "confirmed", "completed", "cancelled"]


class EventResponse(BaseModel):
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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    contact_id: Optional[str] = None
    status: EventStatus = "scheduled"


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    contact_id: Optional[str] = None
    status: Optional[EventStatus] = None


# ============== HELPER FUNCTIONS ==============

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        return "00000000-0000-0000-0000-000000000001"

    try:
        import jwt
        from app.config import settings
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            return "00000000-0000-0000-0000-000000000001"
        return user_id
    except:
        return "00000000-0000-0000-0000-000000000001"


def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string to datetime object."""
    try:
        # Try ISO format first
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except:
        try:
            # Try common format
            return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S")
        except:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")


# ============== ROUTES ==============

@router.get("")
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all events with optional date filtering."""
    query = db.query(EventModel).filter(EventModel.user_id == user_id)

    if start_date:
        try:
            start_dt = parse_datetime(start_date)
            query = query.filter(EventModel.start_time >= start_dt)
        except:
            pass

    if end_date:
        try:
            end_dt = parse_datetime(end_date)
            query = query.filter(EventModel.start_time <= end_dt)
        except:
            pass

    if status:
        query = query.filter(EventModel.status == status)

    events = query.order_by(EventModel.start_time).offset(skip).limit(limit).all()
    return [e.to_dict() for e in events]


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get a specific event."""
    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(EventModel).filter(
        EventModel.id == event_uuid,
        EventModel.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return event.to_dict()


@router.post("")
async def create_event(
    request: CreateEventRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new event."""
    contact_uuid = None
    if request.contact_id:
        try:
            contact_uuid = uuid.UUID(request.contact_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid contact ID format")

    new_event = EventModel(
        user_id=user_id,
        contact_id=contact_uuid,
        title=request.title,
        description=request.description,
        start_time=parse_datetime(request.start_time),
        end_time=parse_datetime(request.end_time),
        location=request.location,
        status=request.status,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event.to_dict()


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    request: UpdateEventRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update an event."""
    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(EventModel).filter(
        EventModel.id == event_uuid,
        EventModel.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if request.title is not None:
        event.title = request.title
    if request.description is not None:
        event.description = request.description
    if request.start_time is not None:
        event.start_time = parse_datetime(request.start_time)
    if request.end_time is not None:
        event.end_time = parse_datetime(request.end_time)
    if request.location is not None:
        event.location = request.location
    if request.contact_id is not None:
        try:
            event.contact_id = uuid.UUID(request.contact_id) if request.contact_id else None
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid contact ID format")
    if request.status is not None:
        event.status = request.status

    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)

    return event.to_dict()


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete an event."""
    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(EventModel).filter(
        EventModel.id == event_uuid,
        EventModel.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    return {"status": "deleted", "id": event_id}


@router.post("/{event_id}/confirm")
async def confirm_event(
    event_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Confirm an event."""
    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(EventModel).filter(
        EventModel.id == event_uuid,
        EventModel.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "confirmed"
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)

    return event.to_dict()


@router.post("/{event_id}/cancel")
async def cancel_event(
    event_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Cancel an event."""
    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(EventModel).filter(
        EventModel.id == event_uuid,
        EventModel.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "cancelled"
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)

    return event.to_dict()
