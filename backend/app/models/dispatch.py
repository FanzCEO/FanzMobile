"""
WickedCRM Dispatch Models
Database models for dispatch resources, jobs, and alerts.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class DispatchResource(Base):
    """Dispatch resource (driver, vehicle, team)."""
    __tablename__ = "dispatch_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, default="driver")  # driver, vehicle, team
    status = Column(String(50), nullable=False, default="available")  # available, busy, offline, break
    current_assignment = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    extra_data = Column(JSONB, nullable=True, default={})
    last_checkin = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "name": self.name,
            "type": self.type,
            "status": self.status,
            "current_assignment": self.current_assignment,
            "location": self.location,
            "phone": self.phone,
            "extra_data": self.extra_data or {},
            "last_checkin": self.last_checkin.isoformat() if self.last_checkin else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DispatchJob(Base):
    """Dispatch job/task."""
    __tablename__ = "dispatch_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, assigned, in_progress, completed, cancelled
    priority = Column(String(50), nullable=False, default="normal")  # low, normal, high, urgent
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("dispatch_resources.id"), nullable=True)
    location = Column(String(255), nullable=False)
    eta = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    extra_data = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    resource = relationship("DispatchResource", foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "location": self.location,
            "eta": self.eta,
            "notes": self.notes,
            "extra_data": self.extra_data or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DispatchAlert(Base):
    """Dispatch alert/notification."""
    __tablename__ = "dispatch_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(50), nullable=False, default="info")  # warning, error, info
    message = Column(Text, nullable=False)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("dispatch_resources.id"), nullable=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("dispatch_jobs.id"), nullable=True)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "type": self.type,
            "message": self.message,
            "resource_id": str(self.resource_id) if self.resource_id else None,
            "job_id": str(self.job_id) if self.job_id else None,
            "acknowledged": self.acknowledged,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
