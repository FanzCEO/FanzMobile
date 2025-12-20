"""
WickedCRM Contacts Router
Contact management for CRM with database persistence.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.contact import Contact as ContactModel

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])


# ============== DATA MODELS ==============

class ContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    importance: int = 5
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class CreateContactRequest(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    importance: int = 5


class UpdateContactRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    importance: Optional[int] = None


# ============== HELPER FUNCTIONS ==============

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        # Return a default user for unauthenticated requests (for backwards compatibility)
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


# ============== ROUTES ==============

@router.get("")
async def get_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all contacts with optional search."""
    query = db.query(ContactModel).filter(ContactModel.user_id == user_id)

    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (ContactModel.name.ilike(search_lower)) |
            (ContactModel.email.ilike(search_lower)) |
            (ContactModel.phone.ilike(search_lower))
        )

    contacts = query.order_by(ContactModel.created_at.desc()).offset(skip).limit(limit).all()
    return [c.to_dict() for c in contacts]


@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get a specific contact."""
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid contact ID format")

    contact = db.query(ContactModel).filter(
        ContactModel.id == contact_uuid,
        ContactModel.user_id == user_id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    return contact.to_dict()


@router.post("")
async def create_contact(
    request: CreateContactRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new contact."""
    new_contact = ContactModel(
        user_id=user_id,
        name=request.name,
        phone=request.phone,
        email=request.email,
        platform=request.platform,
        notes=request.notes,
        tags=request.tags,
        importance=request.importance,
    )

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return new_contact.to_dict()


@router.put("/{contact_id}")
async def update_contact(
    contact_id: str,
    request: UpdateContactRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update a contact."""
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid contact ID format")

    contact = db.query(ContactModel).filter(
        ContactModel.id == contact_uuid,
        ContactModel.user_id == user_id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    if request.name is not None:
        contact.name = request.name
    if request.phone is not None:
        contact.phone = request.phone
    if request.email is not None:
        contact.email = request.email
    if request.platform is not None:
        contact.platform = request.platform
    if request.notes is not None:
        contact.notes = request.notes
    if request.tags is not None:
        contact.tags = request.tags
    if request.importance is not None:
        contact.importance = request.importance

    contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contact)

    return contact.to_dict()


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete a contact."""
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid contact ID format")

    contact = db.query(ContactModel).filter(
        ContactModel.id == contact_uuid,
        ContactModel.user_id == user_id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()

    return {"status": "deleted", "id": contact_id}
