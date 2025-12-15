"""
WickedCRM Contacts Router
Contact management for CRM.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])


# ============== DATA MODELS ==============

class Contact(BaseModel):
    id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    importance: int = 5
    created_at: str
    updated_at: str


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


# ============== IN-MEMORY STORAGE ==============

contacts_db: List[Contact] = [
    Contact(
        id="contact-1",
        user_id="user-1",
        name="Sarah M.",
        phone="+1234567890",
        email="sarah@example.com",
        platform="OnlyFans",
        notes="VIP subscriber, prefers evening messages",
        tags=["VIP", "Premium"],
        importance=9,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Contact(
        id="contact-2",
        user_id="user-1",
        name="Mike T.",
        phone="+1987654321",
        email="mike@example.com",
        platform="Fansly",
        notes="New subscriber",
        tags=["New"],
        importance=6,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Contact(
        id="contact-3",
        user_id="user-1",
        name="Alex J.",
        phone="+1555555555",
        email="alex@example.com",
        platform="Instagram",
        notes="Potential collab",
        tags=["Collab", "Creator"],
        importance=8,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
]


# ============== ROUTES ==============

@router.get("")
async def get_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None
) -> List[Contact]:
    """Get all contacts with optional search."""
    filtered = contacts_db

    if search:
        search_lower = search.lower()
        filtered = [
            c for c in filtered
            if search_lower in c.name.lower()
            or (c.email and search_lower in c.email.lower())
            or (c.phone and search_lower in c.phone)
        ]

    return filtered[skip:skip + limit]


@router.get("/{contact_id}")
async def get_contact(contact_id: str) -> Contact:
    """Get a specific contact."""
    for contact in contacts_db:
        if contact.id == contact_id:
            return contact
    raise HTTPException(status_code=404, detail="Contact not found")


@router.post("")
async def create_contact(request: CreateContactRequest) -> Contact:
    """Create a new contact."""
    now = datetime.now().isoformat()
    new_contact = Contact(
        id=f"contact-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        name=request.name,
        phone=request.phone,
        email=request.email,
        platform=request.platform,
        notes=request.notes,
        tags=request.tags,
        importance=request.importance,
        created_at=now,
        updated_at=now
    )

    contacts_db.insert(0, new_contact)
    return new_contact


@router.put("/{contact_id}")
async def update_contact(contact_id: str, request: UpdateContactRequest) -> Contact:
    """Update a contact."""
    for contact in contacts_db:
        if contact.id == contact_id:
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
            contact.updated_at = datetime.now().isoformat()
            return contact

    raise HTTPException(status_code=404, detail="Contact not found")


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact."""
    global contacts_db
    for i, contact in enumerate(contacts_db):
        if contact.id == contact_id:
            contacts_db.pop(i)
            return {"status": "deleted", "id": contact_id}
    raise HTTPException(status_code=404, detail="Contact not found")
