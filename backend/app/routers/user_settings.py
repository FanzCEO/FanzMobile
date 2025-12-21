"""
WickedCRM Settings Router
User settings and API keys management with database persistence.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.settings import UserSettings


router = APIRouter(prefix="/api/settings", tags=["Settings"])


# ============== DATA MODELS ==============

class UpdateSettingsRequest(BaseModel):
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    groq_key: Optional[str] = None
    huggingface_token: Optional[str] = None
    huggingface_endpoint: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    telnyx_api_key: Optional[str] = None
    telnyx_phone_number: Optional[str] = None
    telnyx_messaging_profile_id: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None
    livekit_url: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None


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


# ============== ROUTES ==============

@router.get("")
async def get_settings(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get user settings (keys are masked)."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user_uuid).first()

    if not settings:
        # Return empty settings structure
        return {
            "has_openai": False,
            "has_anthropic": False,
            "has_groq": False,
            "has_twilio": False,
            "has_telnyx": False,
            "has_telegram": False,
            "has_livekit": False,
            "has_smtp": False,
        }

    return settings.to_dict(mask_keys=True)


@router.put("")
async def update_settings(
    request: UpdateSettingsRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update user settings. Only non-null fields are updated."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user_uuid).first()

    if not settings:
        # Create new settings record
        settings = UserSettings(user_id=user_uuid)
        db.add(settings)

    # Update only provided fields (not None)
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and hasattr(settings, field):
            setattr(settings, field, value)

    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)

    return {"success": True, "message": "Settings updated", **settings.to_dict(mask_keys=True)}


@router.post("/api-keys")
async def save_api_keys(
    request: UpdateSettingsRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Save API keys (alias for PUT /settings)."""
    return await update_settings(request, user_id, db)


@router.get("/api-keys")
async def get_api_keys(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get API keys status (masked)."""
    return await get_settings(user_id, db)


@router.delete("/api-keys/{key_name}")
async def delete_api_key(
    key_name: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Delete a specific API key."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user_uuid).first()

    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    # Map key names to fields
    key_map = {
        "openai": "openai_key",
        "anthropic": "anthropic_key",
        "groq": "groq_key",
        "huggingface": "huggingface_token",
        "twilio": ["twilio_account_sid", "twilio_auth_token", "twilio_phone_number"],
        "telnyx": ["telnyx_api_key", "telnyx_phone_number"],
        "telegram": "telegram_bot_token",
        "livekit": ["livekit_api_key", "livekit_api_secret", "livekit_url"],
        "smtp": ["smtp_host", "smtp_port", "smtp_username", "smtp_password"],
    }

    if key_name not in key_map:
        raise HTTPException(status_code=400, detail=f"Unknown key: {key_name}")

    fields = key_map[key_name]
    if isinstance(fields, str):
        fields = [fields]

    for field in fields:
        setattr(settings, field, None)

    settings.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": f"{key_name} key deleted"}
