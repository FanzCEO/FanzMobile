"""
WickedCRM Workflow Models
Database models for automation workflows.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.database import Base


class Workflow(Base):
    """Automation workflow."""
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), nullable=True)  # on_message, on_contact_created, etc.
    trigger_config = Column(JSONB, nullable=True, default={})
    actions = Column(JSONB, nullable=True, default=[])
    is_active = Column(Boolean, default=False)
    run_count = Column(Integer, default=0)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "trigger": self.trigger_type,
            "trigger_config": self.trigger_config or {},
            "actions": self.actions or [],
            "enabled": self.is_active,
            "run_count": self.run_count,
            "last_run": self.last_run_at.isoformat() if self.last_run_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WorkflowLog(Base):
    """Workflow execution log."""
    __tablename__ = "workflow_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    user_id = Column(String(36), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # success, failed, skipped
    trigger_data = Column(JSONB, nullable=True, default={})
    actions_executed = Column(JSONB, nullable=True, default=[])
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "workflow_id": str(self.workflow_id),
            "user_id": self.user_id,
            "status": self.status,
            "trigger_data": self.trigger_data or {},
            "actions_executed": self.actions_executed or [],
            "error_message": self.error_message,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
        }


class WebhookEndpoint(Base):
    """Registered webhook endpoint for outgoing events."""
    __tablename__ = "webhook_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    secret = Column(String(255), nullable=True)
    events = Column(JSONB, nullable=True, default=[])  # Which events to send
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "name": self.name,
            "url": self.url,
            "secret": "***" if self.secret else None,  # Don't expose secret
            "events": self.events or [],
            "active": self.active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
