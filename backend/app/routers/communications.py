"""
WickedCRM Communications Router
Unified communication endpoints for SMS, calls, and email.
Integrates with Twilio, Telnyx, and other providers.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payments import ThreadEvent as ThreadEventModel
import httpx
import uuid
import os

router = APIRouter(prefix="/api/comms", tags=["Communications"])

# Import integrations config
from app.routers.integrations import provider_configs


# ============== DATA MODELS ==============

class SMSRequest(BaseModel):
    to: str  # Phone number
    body: str
    thread_id: Optional[str] = None
    provider: Optional[Literal["twilio", "telnyx"]] = None  # Auto-detect if not specified


class CallRequest(BaseModel):
    to: str  # Phone number
    thread_id: Optional[str] = None
    provider: Optional[Literal["twilio", "livekit"]] = "twilio"
    callback_url: Optional[str] = None


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    thread_id: Optional[str] = None
    html: Optional[str] = None


class CommHistoryItem(BaseModel):
    id: str
    type: Literal["sms", "call", "email", "message"]
    direction: Literal["inbound", "outbound"]
    to: Optional[str] = None
    from_: Optional[str] = None
    body: Optional[str] = None
    status: str
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "comm-123",
                "type": "sms",
                "direction": "outbound",
                "to": "+1234567890",
                "body": "Hello from WickedCRM",
                "status": "sent",
                "created_at": "2025-01-01T12:00:00Z"
            }
        }


# ============== SMS ENDPOINTS ==============

@router.post("/sms")
async def send_sms(request: SMSRequest, db: Session = Depends(get_db)):
    """
    Send SMS via configured provider (Twilio or Telnyx).

    Auto-detects available provider if not specified.
    Creates a thread event if thread_id is provided.
    """
    # Determine which provider to use
    provider = request.provider
    if not provider:
        if "twilio" in provider_configs:
            provider = "twilio"
        elif "telnyx" in provider_configs:
            provider = "telnyx"
        else:
            raise HTTPException(
                status_code=400,
                detail="No SMS provider configured. Please configure Twilio or Telnyx in integrations."
            )

    # Validate provider is configured
    if provider not in provider_configs:
        raise HTTPException(
            status_code=400,
            detail=f"{provider.title()} is not configured. Please configure it in integrations."
        )

    # Send via appropriate provider
    try:
        if provider == "twilio":
            result = await _send_twilio_sms(request.to, request.body)
        elif provider == "telnyx":
            result = await _send_telnyx_sms(request.to, request.body)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        # Create thread event if thread_id provided
        if request.thread_id:
            try:
                from uuid import UUID
                thread_uuid = UUID(request.thread_id)
                event = ThreadEventModel(
                    thread_id=thread_uuid,
                    event_type="message",
                    body=request.body,
                    channel="sms"
                )
                db.add(event)
                db.commit()
            except Exception as e:
                print(f"Failed to create thread event: {e}")

        return {
            "status": "sent",
            "provider": provider,
            "to": request.to,
            "message_id": result.get("message_id"),
            "result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")


async def _send_twilio_sms(to: str, body: str) -> dict:
    """Send SMS via Twilio."""
    config = provider_configs["twilio"]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{config['account_sid']}/Messages.json",
            auth=(config["account_sid"], config["auth_token"]),
            data={
                "From": config["phone_number"],
                "To": to,
                "Body": body
            },
            timeout=10.0
        )

        if response.status_code not in [200, 201]:
            error = response.json()
            raise HTTPException(
                status_code=400,
                detail=error.get("message", "Failed to send SMS via Twilio")
            )

        result = response.json()
        return {
            "message_id": result.get("sid"),
            "status": result.get("status"),
            "raw": result
        }


async def _send_telnyx_sms(to: str, body: str) -> dict:
    """Send SMS via Telnyx."""
    config = provider_configs["telnyx"]

    payload = {
        "from": config["phone_number"],
        "to": to,
        "text": body
    }

    if config.get("messaging_profile_id"):
        payload["messaging_profile_id"] = config["messaging_profile_id"]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.telnyx.com/v2/messages",
            headers={"Authorization": f"Bearer {config['api_key']}"},
            json=payload,
            timeout=10.0
        )

        if response.status_code not in [200, 201]:
            error = response.json()
            raise HTTPException(
                status_code=400,
                detail=str(error)
            )

        result = response.json()
        data = result.get("data", {})
        return {
            "message_id": data.get("id"),
            "status": data.get("status"),
            "raw": result
        }


# ============== CALL ENDPOINTS ==============

@router.post("/call")
async def initiate_call(request: CallRequest, db: Session = Depends(get_db)):
    """
    Initiate a phone call via Twilio or LiveKit.

    - Twilio: Traditional phone call
    - LiveKit: VoIP/WebRTC call
    """
    provider = request.provider or "twilio"

    try:
        if provider == "twilio":
            if "twilio" not in provider_configs:
                raise HTTPException(
                    status_code=400,
                    detail="Twilio not configured. Please configure it in integrations."
                )
            result = await _initiate_twilio_call(request.to, request.callback_url)

        elif provider == "livekit":
            # LiveKit calls are handled via the LiveKit router
            # Here we just create a room and return connection info
            from app.config import settings

            if not settings.livekit_api_key or not settings.livekit_api_secret:
                raise HTTPException(
                    status_code=400,
                    detail="LiveKit not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET."
                )

            # Generate LiveKit token
            from livekit.api import AccessToken, VideoGrants

            room_name = f"call-{uuid.uuid4().hex[:8]}"

            token_obj = AccessToken(
                settings.livekit_api_key,
                settings.livekit_api_secret
            )
            token_obj.with_identity(request.to)
            token_obj.with_grants(VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            ))

            jwt_token = token_obj.to_jwt()

            result = {
                "call_id": room_name,
                "room_name": room_name,
                "token": jwt_token,
                "livekit_url": settings.livekit_url or os.getenv("VITE_LIVEKIT_URL"),
                "type": "webrtc"
            }

        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        # Create thread event if thread_id provided
        if request.thread_id:
            try:
                from uuid import UUID
                thread_uuid = UUID(request.thread_id)
                event = ThreadEventModel(
                    thread_id=thread_uuid,
                    event_type="call",
                    body=f"Call initiated to {request.to}",
                    channel=provider
                )
                db.add(event)
                db.commit()
            except Exception as e:
                print(f"Failed to create thread event: {e}")

        return {
            "status": "initiated",
            "provider": provider,
            "to": request.to,
            "call_id": result.get("call_id") or result.get("sid"),
            "result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")


async def _initiate_twilio_call(to: str, callback_url: Optional[str] = None) -> dict:
    """Initiate a call via Twilio."""
    config = provider_configs["twilio"]

    # Default callback URL for TwiML instructions
    if not callback_url:
        callback_url = "http://demo.twilio.com/docs/voice.xml"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{config['account_sid']}/Calls.json",
            auth=(config["account_sid"], config["auth_token"]),
            data={
                "From": config["phone_number"],
                "To": to,
                "Url": callback_url
            },
            timeout=10.0
        )

        if response.status_code not in [200, 201]:
            error = response.json()
            raise HTTPException(
                status_code=400,
                detail=error.get("message", "Failed to initiate call via Twilio")
            )

        result = response.json()
        return {
            "call_id": result.get("sid"),
            "sid": result.get("sid"),
            "status": result.get("status"),
            "raw": result
        }


# ============== EMAIL ENDPOINTS ==============

@router.post("/email")
async def send_email(request: EmailRequest, db: Session = Depends(get_db)):
    """
    Send email via configured provider.

    Note: Basic implementation. In production, integrate with SendGrid, Mailgun, or SMTP.
    """
    # For now, return a mock response
    # In production, integrate with email service provider

    # Create thread event if thread_id provided
    if request.thread_id:
        try:
            from uuid import UUID
            thread_uuid = UUID(request.thread_id)
            event = ThreadEventModel(
                thread_id=thread_uuid,
                event_type="message",
                body=f"Email sent to {request.to}: {request.subject}",
                channel="email"
            )
            db.add(event)
            db.commit()
        except Exception as e:
            print(f"Failed to create thread event: {e}")

    # Mock email sending
    email_id = f"email-{uuid.uuid4().hex[:8]}"

    return {
        "status": "sent",
        "email_id": email_id,
        "to": request.to,
        "subject": request.subject,
        "message": "Email queued for delivery. Configure email provider (SendGrid/Mailgun) for actual delivery."
    }


# ============== HISTORY ENDPOINTS ==============

@router.get("/history", response_model=List[CommHistoryItem])
async def get_comm_history(
    limit: int = 50,
    offset: int = 0,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get communication history across all channels.

    Returns events from threads database.
    """
    from app.models.payments import ThreadEvent as ThreadEventModel

    # Query thread events
    query = db.query(ThreadEventModel).order_by(ThreadEventModel.created_at.desc())

    # Filter by type if specified
    if type:
        query = query.filter(ThreadEventModel.event_type == type)

    events = query.offset(offset).limit(limit).all()

    # Convert to CommHistoryItem
    history = []
    for event in events:
        # Determine direction based on channel or default to outbound
        direction = "outbound" if event.channel in ["sms", "email", "call"] else "inbound"

        history.append(CommHistoryItem(
            id=str(event.id),
            type=event.event_type or "message",
            direction=direction,
            body=event.body,
            status="sent",
            created_at=event.created_at.isoformat(),
            metadata={
                "channel": event.channel,
                "thread_id": str(event.thread_id)
            }
        ))

    return history


# ============== STATUS ENDPOINTS ==============

@router.get("/status")
async def get_comm_status():
    """
    Get status of all communication providers.
    """
    status = {
        "sms": {
            "configured": False,
            "providers": []
        },
        "voice": {
            "configured": False,
            "providers": []
        },
        "email": {
            "configured": False,
            "providers": []
        }
    }

    # Check SMS providers
    if "twilio" in provider_configs:
        status["sms"]["configured"] = True
        status["sms"]["providers"].append("twilio")
    if "telnyx" in provider_configs:
        status["sms"]["configured"] = True
        status["sms"]["providers"].append("telnyx")

    # Check voice providers
    if "twilio" in provider_configs:
        status["voice"]["configured"] = True
        status["voice"]["providers"].append("twilio")
    if os.getenv("VITE_LIVEKIT_URL"):
        status["voice"]["configured"] = True
        status["voice"]["providers"].append("livekit")

    # Check email providers
    # Add when email provider is configured

    return status
