from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

router = APIRouter()


class Contact(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    last_contact: Optional[datetime] = None


class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None


@router.get("/", response_model=List[Contact])
async def get_contacts(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None
) -> List[Contact]:
    """Get all contacts with optional search"""
    # TODO: Fetch from database with search filter
    return []


@router.post("/", response_model=Contact, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate) -> Contact:
    """Create a new contact"""
    # TODO: Save to database
    return Contact(
        id="contact_123",
        name=contact.name,
        phone=contact.phone,
        email=contact.email,
        organization=contact.organization,
        role=contact.role,
        notes=contact.notes,
        created_at=datetime.utcnow(),
    )


@router.get("/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str) -> Contact:
    """Get a specific contact by ID"""
    # TODO: Fetch from database
    raise HTTPException(status_code=404, detail="Contact not found")


@router.put("/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact: ContactCreate) -> Contact:
    """Update an existing contact"""
    # TODO: Update in database
    raise HTTPException(status_code=404, detail="Contact not found")


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: str):
    """Delete a contact"""
    # TODO: Delete from database
    return None


@router.get("/{contact_id}/messages")
async def get_contact_messages(contact_id: str) -> List[Dict]:
    """Get all messages for a specific contact"""
    # TODO: Fetch messages from database
    return []
