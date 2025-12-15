"""
WickedCRM Adult AI Routes
API endpoints for uncensored LLM chat, story generation, and adult content creation.

WARNING: These endpoints are for adult platforms ONLY.
Implement proper age verification before allowing access.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.uncensored_llm_service import (
    uncensored_llm_service,
    ChatRequest,
    ChatMessage,
    StoryRequest
)


router = APIRouter(prefix="/api/adult-ai", tags=["Adult AI"])


# ============== REQUEST MODELS ==============

class SimpleChatRequest(BaseModel):
    """Simple chat request."""
    message: str
    persona: str = "seductive"
    model: str = "darkidol_8b"
    conversation_history: list[dict] = []


class MessageGenerationRequest(BaseModel):
    """Request for message generation."""
    context: str
    tone: str = "flirty"
    recipient_name: str = "babe"


class QuickStoryRequest(BaseModel):
    """Quick story generation request."""
    prompt: str
    genre: str = "romance"
    intensity: str = "moderate"
    length: str = "medium"


# ============== ROUTES ==============

@router.get("/health")
async def adult_ai_health():
    """Check adult AI service health."""
    return {
        "status": "healthy",
        "configured": uncensored_llm_service.is_configured(),
        "warning": "This service is for adult platforms only. Verify user age before access.",
        "message": "Uncensored LLM ready" if uncensored_llm_service.is_configured() else "Running in demo mode"
    }


@router.get("/models")
async def get_models():
    """Get available uncensored models and personas."""
    return uncensored_llm_service.get_available_models()


@router.get("/personas")
async def get_personas():
    """Get available AI personas for adult chat."""
    return {
        "personas": {
            "seductive": "Alluring, confident, flirtatious companion",
            "dominant": "Commanding, assertive, takes charge",
            "submissive": "Sweet, eager-to-please, devoted",
            "romantic": "Deeply passionate, emotionally expressive",
            "playful": "Fun, teasing, witty banter",
            "nsfw_writer": "Expert adult fiction writer",
        }
    }


# ============== CHAT ENDPOINTS ==============

@router.post("/chat")
async def uncensored_chat(request: SimpleChatRequest):
    """
    Chat with an uncensored AI companion.

    Personas available:
    - seductive: Alluring and flirtatious
    - dominant: Commanding and assertive
    - submissive: Sweet and devoted
    - romantic: Deeply passionate
    - playful: Fun and teasing
    """
    # Build chat messages
    messages = []

    # Add conversation history
    for msg in request.conversation_history:
        messages.append(ChatMessage(
            role=msg.get("role", "user"),
            content=msg.get("content", "")
        ))

    # Add current message
    messages.append(ChatMessage(role="user", content=request.message))

    chat_request = ChatRequest(
        messages=messages,
        model=request.model,
        persona=request.persona,
        max_tokens=500,
        temperature=0.9
    )

    result = await uncensored_llm_service.chat(chat_request)

    return {
        "response": result.response,
        "persona": result.persona,
        "model": result.model_used,
        "tokens": result.tokens_used
    }


@router.post("/chat/advanced")
async def advanced_chat(request: ChatRequest):
    """
    Advanced chat with full control over parameters.

    Allows setting:
    - Full message history
    - Model selection
    - Persona selection
    - Temperature and top_p
    - Max tokens
    """
    result = await uncensored_llm_service.chat(request)
    return result.model_dump()


# ============== STORY GENERATION ==============

@router.post("/story")
async def generate_story(request: QuickStoryRequest):
    """
    Generate adult fiction/story content.

    Genres: romance, fantasy, drama, passion, adventure
    Intensity: mild, moderate, explicit
    Length: short, medium, long
    """
    story_request = StoryRequest(
        prompt=request.prompt,
        genre=request.genre,
        intensity=request.intensity,  # type: ignore
        length=request.length,  # type: ignore
    )

    result = await uncensored_llm_service.generate_story(story_request)

    return {
        "story": result.story,
        "genre": result.genre,
        "intensity": result.intensity,
        "model": result.model_used
    }


# ============== MESSAGE GENERATION ==============

@router.post("/generate-message")
async def generate_message(request: MessageGenerationRequest):
    """
    Generate a flirty/romantic message for platform messaging.

    Tones available:
    - flirty: Playful and suggestive
    - romantic: Sweet and passionate
    - teasing: Playful and provocative
    - seductive: Alluring and enticing
    """
    message = await uncensored_llm_service.generate_message(
        context=request.context,
        tone=request.tone,
        recipient_name=request.recipient_name
    )

    return {
        "message": message,
        "tone": request.tone,
        "recipient": request.recipient_name
    }


# ============== CONTENT IDEAS ==============

@router.post("/content-ideas")
async def generate_content_ideas(
    niche: str = "general",
    count: int = 5
):
    """
    Generate content ideas for adult creators.

    Niches: general, cosplay, fitness, luxury, artistic, etc.
    """
    if not uncensored_llm_service.is_configured():
        # Demo ideas
        ideas = {
            "general": [
                "Behind-the-scenes of your daily routine",
                "Q&A session with your fans",
                "Exclusive sneak peek of upcoming content",
                "Throwback to your favorite shoot",
                "Fan appreciation post with special offer",
            ],
            "cosplay": [
                "Character reveal with teaser photos",
                "Costume creation behind-the-scenes",
                "Fan-voted character selection",
                "Before/after transformation",
                "Crossover collaboration ideas",
            ],
            "fitness": [
                "Workout routine showcase",
                "Progress photo series",
                "Gym session sneak peek",
                "Healthy lifestyle tips",
                "Motivation Monday content",
            ],
        }
        return {"ideas": ideas.get(niche, ideas["general"])[:count]}

    # With API configured, generate dynamic ideas
    prompt = f"""Generate {count} creative content ideas for an adult content creator in the {niche} niche.

Requirements:
- Ideas should be engaging and audience-focused
- Mix of teasing previews and exclusive content
- Include some interactive/engagement ideas
- Keep suggestions platform-appropriate but enticing

Return just the ideas, numbered 1-{count}:"""

    from app.services.uncensored_llm_service import UncensoredLLMConfig

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 400,
            "temperature": 0.85,
            "do_sample": True,
        }
    }

    result = await uncensored_llm_service._query_model(
        UncensoredLLMConfig.CHAT_MODELS["darkidol_8b"]["id"],
        payload
    )

    if isinstance(result, list) and len(result) > 0:
        text = result[0].get("generated_text", "")
        # Parse numbered list
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        ideas = []
        for line in lines:
            # Remove numbering
            for prefix in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '-', '*']:
                if line.startswith(prefix):
                    line = line[len(prefix):].strip()
            if line:
                ideas.append(line)
        return {"ideas": ideas[:count]}

    return {"ideas": ["Failed to generate ideas. Please try again."]}
