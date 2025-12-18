"""
LiveKit Token Generation Router
Generates access tokens for LiveKit rooms (PTT/voice channels).
"""

print("DEBUG: Loading livekit.py, file path is:", __file__)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from livekit.api import AccessToken, VideoGrants
from app.config import settings

router = APIRouter(prefix="/api/livekit", tags=["livekit"])


class TokenRequest(BaseModel):
    """Request body for token generation."""
    room: str
    identity: str
    name: str | None = None


class TokenResponse(BaseModel):
    """Response containing the access token."""
    token: str


@router.post("/token", response_model=TokenResponse)
async def generate_token(request: TokenRequest):
    """
    Generate a LiveKit access token for joining a room.

    - room: The room name to join
    - identity: Unique user identifier
    - name: Optional display name
    """
    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(
            status_code=500,
            detail="LiveKit not configured"
        )

    # Create access token with grants
    token = AccessToken(
        settings.livekit_api_key,
        settings.livekit_api_secret
    )

    token.with_identity(request.identity)
    if request.name:
        token.with_name(request.name)

    # Grant permissions for the room
    token.with_grants(VideoGrants(
        room_join=True,
        room=request.room,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    ))

    # Token expires in 6 hours
    jwt_token = token.to_jwt()

    return TokenResponse(token=jwt_token)


@router.get("/health")
async def livekit_health():
    """Check if LiveKit is configured."""
    return {
        "configured": bool(settings.livekit_api_key and settings.livekit_api_secret),
        "url": settings.livekit_url or None
    }
