"""
User Settings Model
Stores encrypted API keys and user preferences.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, index=True, nullable=False)

    # API Keys (stored encrypted in production)
    openai_key = Column(Text, nullable=True)
    anthropic_key = Column(Text, nullable=True)
    groq_key = Column(Text, nullable=True)
    huggingface_token = Column(Text, nullable=True)
    huggingface_endpoint = Column(String(500), nullable=True)

    # Twilio
    twilio_account_sid = Column(String(100), nullable=True)
    twilio_auth_token = Column(Text, nullable=True)
    twilio_phone_number = Column(String(20), nullable=True)

    # Telnyx
    telnyx_api_key = Column(Text, nullable=True)
    telnyx_phone_number = Column(String(20), nullable=True)
    telnyx_messaging_profile_id = Column(String(100), nullable=True)

    # Telegram
    telegram_bot_token = Column(Text, nullable=True)

    # LiveKit
    livekit_api_key = Column(String(100), nullable=True)
    livekit_api_secret = Column(Text, nullable=True)
    livekit_url = Column(String(255), nullable=True)

    # Email/SMTP
    smtp_host = Column(String(255), nullable=True)
    smtp_port = Column(String(10), nullable=True)
    smtp_username = Column(String(255), nullable=True)
    smtp_password = Column(Text, nullable=True)
    smtp_from_email = Column(String(255), nullable=True)
    smtp_from_name = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, mask_keys: bool = True):
        """Convert to dict, optionally masking sensitive keys."""
        def mask(value):
            if not value or not mask_keys:
                return value
            if len(value) <= 8:
                return "***"
            return value[:4] + "..." + value[-4:]

        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "openai_key": mask(self.openai_key),
            "anthropic_key": mask(self.anthropic_key),
            "groq_key": mask(self.groq_key),
            "huggingface_token": mask(self.huggingface_token),
            "huggingface_endpoint": self.huggingface_endpoint,
            "twilio_account_sid": mask(self.twilio_account_sid),
            "twilio_auth_token": mask(self.twilio_auth_token),
            "twilio_phone_number": self.twilio_phone_number,
            "telnyx_api_key": mask(self.telnyx_api_key),
            "telnyx_phone_number": self.telnyx_phone_number,
            "telegram_bot_token": mask(self.telegram_bot_token),
            "livekit_api_key": mask(self.livekit_api_key),
            "livekit_api_secret": mask(self.livekit_api_secret),
            "livekit_url": self.livekit_url,
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_username": self.smtp_username,
            "smtp_password": mask(self.smtp_password),
            "smtp_from_email": self.smtp_from_email,
            "smtp_from_name": self.smtp_from_name,
            "has_openai": bool(self.openai_key),
            "has_anthropic": bool(self.anthropic_key),
            "has_groq": bool(self.groq_key),
            "has_twilio": bool(self.twilio_account_sid and self.twilio_auth_token),
            "has_telnyx": bool(self.telnyx_api_key),
            "has_telegram": bool(self.telegram_bot_token),
            "has_livekit": bool(self.livekit_api_key and self.livekit_api_secret),
            "has_smtp": bool(self.smtp_host and self.smtp_username),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
