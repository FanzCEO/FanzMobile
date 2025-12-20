"""
Contact Model
SQLAlchemy model for CRM contacts.
"""

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    platform = Column(String(100), nullable=True)  # OnlyFans, Fansly, Instagram, etc.
    notes = Column(Text, nullable=True)
    tags = Column(ARRAY(String), nullable=True, default=[])
    importance = Column(Integer, default=5)  # 1-10 scale
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "platform": self.platform,
            "notes": self.notes,
            "tags": self.tags or [],
            "importance": self.importance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
