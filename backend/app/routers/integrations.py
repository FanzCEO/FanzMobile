"""
WickedCRM Integrations Router
Multi-channel messaging integrations (Telegram, Telnyx, WhatsApp, Twilio).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
import uuid
import httpx
import os

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


# ============== DATA MODELS ==============

IntegrationProvider = Literal[
    "google_calendar", "outlook", "twilio", "telnyx", "telegram", "rm_chat", "whatsapp", "sendgrid"
]


class Integration(BaseModel):
    id: str
    user_id: str
    provider: IntegrationProvider
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str
    updated_at: str


class ConnectIntegrationRequest(BaseModel):
    provider: IntegrationProvider
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    metadata: Dict[str, Any] = {}


# Provider-specific config requests
class TelegramConfigRequest(BaseModel):
    bot_token: str


class TelnyxConfigRequest(BaseModel):
    api_key: str
    phone_number: str
    messaging_profile_id: Optional[str] = None


class TwilioConfigRequest(BaseModel):
    account_sid: str
    auth_token: str
    phone_number: str


class WhatsAppConfigRequest(BaseModel):
    phone_number_id: str
    access_token: str
    verify_token: str


class SendMessageRequest(BaseModel):
    to: str
    body: str
    message: Optional[str] = None  # Alias for body


class TelegramSendRequest(BaseModel):
    chat_id: str
    message: str


# ============== IN-MEMORY STORAGE ==============

integrations_db: List[Integration] = []

# Store provider configs separately (in production, encrypt these)
provider_configs: Dict[str, Dict[str, Any]] = {}


# ============== HELPER FUNCTIONS ==============

def load_user_settings_configs(user_id: str = None):
    """
    Load provider configs from user_settings table.
    This bridges the Settings API keys with the integrations system.
    """
    from app.database import SessionLocal
    from app.models.settings import UserSettings
    import uuid

    db = SessionLocal()
    try:
        # Get settings for the user (or default user)
        user_uuid = uuid.UUID(user_id) if user_id else uuid.UUID("00000000-0000-0000-0000-000000000001")
        settings = db.query(UserSettings).filter(UserSettings.user_id == user_uuid).first()

        if not settings:
            return

        # Load Twilio config
        if settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number:
            provider_configs["twilio"] = {
                "account_sid": settings.twilio_account_sid,
                "auth_token": settings.twilio_auth_token,
                "phone_number": settings.twilio_phone_number
            }

        # Load Telnyx config
        if settings.telnyx_api_key and settings.telnyx_phone_number:
            provider_configs["telnyx"] = {
                "api_key": settings.telnyx_api_key,
                "phone_number": settings.telnyx_phone_number,
                "messaging_profile_id": getattr(settings, 'telnyx_messaging_profile_id', None)
            }

        # Load Telegram config
        if settings.telegram_bot_token:
            provider_configs["telegram"] = {
                "bot_token": settings.telegram_bot_token
            }

    finally:
        db.close()


# ============== ROUTES ==============

@router.get("")
async def get_integrations() -> List[Integration]:
    """Get all configured integrations."""
    return integrations_db


@router.get("/status")
async def get_integration_status():
    """Get status of all configured integrations."""
    # Load configs from user_settings
    load_user_settings_configs()

    status = {}

    for provider in ["twilio", "sendgrid", "telegram", "telnyx", "whatsapp"]:
        if provider in provider_configs:
            status[provider] = {
                "configured": True,
                "active": True
            }
        else:
            status[provider] = {
                "configured": False,
                "active": False
            }

    return {
        "integrations": status,
        "total_configured": sum(1 for s in status.values() if s["configured"])
    }


@router.get("/{integration_id}")
async def get_integration(integration_id: str) -> Integration:
    """Get a specific integration."""
    for integ in integrations_db:
        if integ.id == integration_id:
            return integ
    raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/connect")
async def connect_integration(request: ConnectIntegrationRequest) -> Integration:
    """Connect a new integration."""
    # Check if already connected
    for integ in integrations_db:
        if integ.provider == request.provider:
            raise HTTPException(status_code=400, detail=f"{request.provider} is already connected")

    now = datetime.now().isoformat()
    new_integration = Integration(
        id=f"int-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        provider=request.provider,
        access_token=request.access_token,
        refresh_token=request.refresh_token,
        metadata=request.metadata,
        created_at=now,
        updated_at=now
    )

    integrations_db.append(new_integration)
    return new_integration


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str):
    """Disconnect an integration."""
    global integrations_db
    for i, integ in enumerate(integrations_db):
        if integ.id == integration_id:
            # Remove config if exists
            provider = integ.provider
            if provider in provider_configs:
                del provider_configs[provider]
            integrations_db.pop(i)
            return {"status": "disconnected", "id": integration_id}
    raise HTTPException(status_code=404, detail="Integration not found")


# ============== TELEGRAM ==============

@router.get("/telegram/updates")
async def get_telegram_updates():
    """
    Fetch Telegram updates via bot polling.
    Returns real updates if bot is configured.
    """
    if "telegram" not in provider_configs:
        return {"messages": [], "error": "Telegram not configured"}

    bot_token = provider_configs["telegram"]["bot_token"]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.telegram.org/bot{bot_token}/getUpdates",
                timeout=10.0
            )
            if response.status_code == 200:
                updates = response.json().get("result", [])
                messages = []
                for update in updates[-20:]:  # Last 20 updates
                    msg = update.get("message", {})
                    if msg:
                        messages.append({
                            "chat_id": str(msg.get("chat", {}).get("id", "")),
                            "username": msg.get("from", {}).get("username", ""),
                            "from": msg.get("from", {}).get("first_name", "Unknown"),
                            "text": msg.get("text", ""),
                            "date": datetime.fromtimestamp(msg.get("date", 0)).isoformat() if msg.get("date") else ""
                        })
                return {"messages": messages}
            else:
                return {"messages": [], "error": "Failed to fetch updates"}
    except httpx.RequestError as e:
        return {"messages": [], "error": str(e)}

@router.post("/telegram/configure")
async def configure_telegram(request: TelegramConfigRequest):
    """Configure Telegram bot integration."""
    # Verify token works
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.telegram.org/bot{request.bot_token}/getMe",
                timeout=10.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid bot token")
            bot_info = response.json()
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify bot token")

    # Store config
    provider_configs["telegram"] = {"bot_token": request.bot_token}

    # Create integration if not exists
    existing = next((i for i in integrations_db if i.provider == "telegram"), None)
    if not existing:
        now = datetime.now().isoformat()
        new_integration = Integration(
            id=f"int-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            provider="telegram",
            metadata={
                "bot_username": bot_info.get("result", {}).get("username"),
                "bot_id": bot_info.get("result", {}).get("id")
            },
            created_at=now,
            updated_at=now
        )
        integrations_db.append(new_integration)

    return {
        "status": "connected",
        "message": f"Telegram bot @{bot_info.get('result', {}).get('username')} connected!",
        "bot_info": bot_info.get("result")
    }


@router.post("/telegram/send")
async def send_telegram(request: TelegramSendRequest):
    """Send a Telegram message."""
    if "telegram" not in provider_configs:
        raise HTTPException(status_code=400, detail="Telegram not configured")

    bot_token = provider_configs["telegram"]["bot_token"]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": request.chat_id, "text": request.message},
                timeout=10.0
            )
            if response.status_code != 200:
                error = response.json()
                raise HTTPException(status_code=400, detail=error.get("description", "Failed to send"))
            return {"status": "sent", "result": response.json()}
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ============== TELNYX ==============

@router.post("/telnyx/configure")
async def configure_telnyx(request: TelnyxConfigRequest):
    """Configure Telnyx SMS integration."""
    # Verify API key
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.telnyx.com/v2/phone_numbers",
                headers={"Authorization": f"Bearer {request.api_key}"},
                timeout=10.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Telnyx API key")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify Telnyx credentials")

    # Store config
    provider_configs["telnyx"] = {
        "api_key": request.api_key,
        "phone_number": request.phone_number,
        "messaging_profile_id": request.messaging_profile_id
    }

    # Create integration
    existing = next((i for i in integrations_db if i.provider == "telnyx"), None)
    if not existing:
        now = datetime.now().isoformat()
        new_integration = Integration(
            id=f"int-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            provider="telnyx",
            metadata={"phone_number": request.phone_number},
            created_at=now,
            updated_at=now
        )
        integrations_db.append(new_integration)

    return {"status": "connected", "message": f"Telnyx configured with {request.phone_number}"}


@router.post("/telnyx/send")
async def send_telnyx(request: SendMessageRequest):
    """Send SMS via Telnyx."""
    if "telnyx" not in provider_configs:
        raise HTTPException(status_code=400, detail="Telnyx not configured")

    config = provider_configs["telnyx"]
    message_body = request.body or request.message

    try:
        payload = {
            "from": config["phone_number"],
            "to": request.to,
            "text": message_body
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
                raise HTTPException(status_code=400, detail=str(error))
            return {"status": "sent", "result": response.json()}
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ============== TWILIO ==============

@router.post("/twilio/configure")
async def configure_twilio(request: TwilioConfigRequest):
    """Configure Twilio SMS integration."""
    # Verify credentials
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.twilio.com/2010-04-01/Accounts/{request.account_sid}.json",
                auth=(request.account_sid, request.auth_token),
                timeout=10.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Twilio credentials")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify Twilio credentials")

    # Store config
    provider_configs["twilio"] = {
        "account_sid": request.account_sid,
        "auth_token": request.auth_token,
        "phone_number": request.phone_number
    }

    # Create integration
    existing = next((i for i in integrations_db if i.provider == "twilio"), None)
    if not existing:
        now = datetime.now().isoformat()
        new_integration = Integration(
            id=f"int-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            provider="twilio",
            metadata={"phone_number": request.phone_number},
            created_at=now,
            updated_at=now
        )
        integrations_db.append(new_integration)

    return {"status": "connected", "message": f"Twilio configured with {request.phone_number}"}


@router.post("/twilio/send")
async def send_twilio(request: SendMessageRequest):
    """Send SMS via Twilio."""
    if "twilio" not in provider_configs:
        raise HTTPException(status_code=400, detail="Twilio not configured")

    config = provider_configs["twilio"]
    message_body = request.body or request.message

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{config['account_sid']}/Messages.json",
                auth=(config["account_sid"], config["auth_token"]),
                data={
                    "From": config["phone_number"],
                    "To": request.to,
                    "Body": message_body
                },
                timeout=10.0
            )
            if response.status_code not in [200, 201]:
                error = response.json()
                raise HTTPException(status_code=400, detail=error.get("message", "Failed to send"))
            return {"status": "sent", "result": response.json()}
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ============== WHATSAPP ==============

@router.post("/whatsapp/configure")
async def configure_whatsapp(request: WhatsAppConfigRequest):
    """Configure WhatsApp Business API integration."""
    # Store config (Meta verification would happen via webhook)
    provider_configs["whatsapp"] = {
        "phone_number_id": request.phone_number_id,
        "access_token": request.access_token,
        "verify_token": request.verify_token
    }

    # Create integration
    existing = next((i for i in integrations_db if i.provider == "whatsapp"), None)
    if not existing:
        now = datetime.now().isoformat()
        new_integration = Integration(
            id=f"int-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            provider="whatsapp",
            metadata={"phone_number_id": request.phone_number_id},
            created_at=now,
            updated_at=now
        )
        integrations_db.append(new_integration)

    return {"status": "connected", "message": "WhatsApp Business API configured"}


@router.post("/whatsapp/send")
async def send_whatsapp(request: SendMessageRequest):
    """Send WhatsApp message via Meta Business API."""
    if "whatsapp" not in provider_configs:
        raise HTTPException(status_code=400, detail="WhatsApp not configured")

    config = provider_configs["whatsapp"]
    message_body = request.body or request.message

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://graph.facebook.com/v18.0/{config['phone_number_id']}/messages",
                headers={"Authorization": f"Bearer {config['access_token']}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": request.to,
                    "type": "text",
                    "text": {"body": message_body}
                },
                timeout=10.0
            )
            if response.status_code not in [200, 201]:
                error = response.json()
                raise HTTPException(status_code=400, detail=str(error))
            return {"status": "sent", "result": response.json()}
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ============== SENDGRID ==============

class SendGridConfigRequest(BaseModel):
    api_key: str
    from_email: str
    from_name: Optional[str] = "WickedCRM"


class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: Optional[str] = None


@router.post("/sendgrid/configure")
async def configure_sendgrid(request: SendGridConfigRequest):
    """Configure SendGrid email integration."""
    # Verify API key
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.sendgrid.com/v3/user/profile",
                headers={"Authorization": f"Bearer {request.api_key}"},
                timeout=10.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid SendGrid API key")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify SendGrid credentials")

    # Store config
    provider_configs["sendgrid"] = {
        "api_key": request.api_key,
        "from_email": request.from_email,
        "from_name": request.from_name
    }

    # Create integration record
    existing = next((i for i in integrations_db if i.provider == "sendgrid"), None)
    if not existing:
        now = datetime.now().isoformat()
        new_integration = Integration(
            id=f"int-{uuid.uuid4().hex[:8]}",
            user_id="user-1",
            provider="sendgrid",
            metadata={"from_email": request.from_email},
            created_at=now,
            updated_at=now
        )
        integrations_db.append(new_integration)

    return {"status": "connected", "message": f"SendGrid configured with {request.from_email}"}


@router.post("/sendgrid/send")
async def send_email_sendgrid(request: EmailSendRequest):
    """Send email via SendGrid."""
    if "sendgrid" not in provider_configs:
        raise HTTPException(status_code=400, detail="SendGrid not configured")

    config = provider_configs["sendgrid"]

    email_content = [{"type": "text/plain", "value": request.body}]
    if request.html:
        email_content.append({"type": "text/html", "value": request.html})

    payload = {
        "personalizations": [{"to": [{"email": request.to}]}],
        "from": {"email": config["from_email"], "name": config.get("from_name", "WickedCRM")},
        "subject": request.subject,
        "content": email_content
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {config['api_key']}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=10.0
            )
            if response.status_code not in [200, 201, 202]:
                error = response.text
                raise HTTPException(status_code=400, detail=f"SendGrid error: {error}")
            return {"status": "sent", "to": request.to, "subject": request.subject}
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ============== WHATSAPP OAUTH ==============

@router.get("/whatsapp/auth-url")
async def whatsapp_auth_url():
    """
    Get WhatsApp Business OAuth URL for integration.
    Uses Meta's Facebook Login for Business.
    """
    # Meta WhatsApp Business API OAuth configuration
    # In production, these would come from environment variables
    meta_app_id = os.getenv("META_APP_ID", "")
    redirect_uri = os.getenv("WHATSAPP_REDIRECT_URI", "https://rent.fanz.website/api/integrations/whatsapp/callback")

    if not meta_app_id:
        return {
            "auth_url": None,
            "error": "WhatsApp Business not configured",
            "message": "Set META_APP_ID environment variable to enable WhatsApp OAuth. " +
                       "You can get this from developers.facebook.com after creating a Meta Business app."
        }

    # Meta OAuth URL with WhatsApp Business permissions
    # See: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started
    scopes = "whatsapp_business_management,whatsapp_business_messaging"
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={meta_app_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={scopes}&"
        f"response_type=code&"
        f"state=whatsapp_integration"
    )

    return {
        "auth_url": auth_url,
        "message": "Click to authorize WhatsApp Business API access"
    }


@router.get("/whatsapp/callback")
async def whatsapp_callback(code: str = None, error: str = None, state: str = None):
    """
    OAuth callback for WhatsApp Business integration.
    Exchanges auth code for access token.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    meta_app_id = os.getenv("META_APP_ID", "")
    meta_app_secret = os.getenv("META_APP_SECRET", "")
    redirect_uri = os.getenv("WHATSAPP_REDIRECT_URI", "https://rent.fanz.website/api/integrations/whatsapp/callback")

    if not meta_app_id or not meta_app_secret:
        raise HTTPException(status_code=500, detail="Meta app credentials not configured")

    # Exchange code for access token
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": meta_app_id,
                    "client_secret": meta_app_secret,
                    "redirect_uri": redirect_uri,
                    "code": code
                },
                timeout=10.0
            )

            if response.status_code != 200:
                error = response.json()
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {error}")

            token_data = response.json()
            access_token = token_data.get("access_token")

            # Get WhatsApp Business Account ID
            waba_response = await client.get(
                "https://graph.facebook.com/v18.0/me/whatsapp_business_account",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )

            if waba_response.status_code == 200:
                waba_data = waba_response.json()
                waba_id = waba_data.get("data", [{}])[0].get("id")

                # Store config
                provider_configs["whatsapp"] = {
                    "access_token": access_token,
                    "waba_id": waba_id
                }

                # Create integration record
                now = datetime.now().isoformat()
                existing = next((i for i in integrations_db if i.provider == "whatsapp"), None)
                if not existing:
                    new_integration = Integration(
                        id=f"int-{uuid.uuid4().hex[:8]}",
                        user_id="user-1",
                        provider="whatsapp",
                        access_token="***",  # Don't store actual token in record
                        metadata={"waba_id": waba_id},
                        created_at=now,
                        updated_at=now
                    )
                    integrations_db.append(new_integration)

                # Redirect to integrations page with success
                return {"status": "connected", "message": "WhatsApp Business connected successfully!"}

            else:
                # Still connected but no WABA found
                provider_configs["whatsapp"] = {"access_token": access_token}
                return {"status": "partial", "message": "Connected but no WhatsApp Business Account found. Please set up a WABA in Meta Business Suite."}

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Meta: {str(e)}")


# ============== GOOGLE CALENDAR ==============

@router.get("/google/auth-url")
async def google_auth_url():
    """Get Google OAuth URL for calendar integration."""
    # In production, this would generate proper OAuth URL
    return {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "message": "Google Calendar OAuth coming soon. For now, use manual calendar sync."
    }
