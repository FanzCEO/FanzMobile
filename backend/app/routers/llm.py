"""
WickedCRM Multi-Provider LLM Routes
Cost-effective AI chat with automatic provider selection.

Providers:
- Ollama: FREE (local)
- Groq: $0.05-0.79/1M tokens (FASTEST)
- Together.ai: $0.18-0.90/1M tokens ($25 free credit)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.services.llm_providers import (
    llm_service,
    LLMProvider,
    LLMRequest,
    ChatMessage
)


router = APIRouter(prefix="/api/llm", tags=["LLM Providers"])


# ============== REQUEST MODELS ==============

class SimpleChatRequest(BaseModel):
    """Simple chat request."""
    message: str
    persona: str = "playful"
    provider: Optional[str] = None  # "ollama", "groq", "together"
    conversation_history: List[Dict] = []


class MessageGenRequest(BaseModel):
    """Message generation request."""
    contact_name: str
    context: str = ""
    tone: str = "flirty"


class ContentIdeasRequest(BaseModel):
    """Content ideas request."""
    niche: str = "general"
    count: int = 5


# ============== ROUTES ==============

@router.get("/health")
async def llm_health():
    """Check LLM service health and available providers."""
    providers = llm_service.get_available_providers()
    best = llm_service.get_best_provider()

    return {
        "status": "healthy",
        "providers": providers,
        "best_provider": best.value if best else None,
        "cost_ranking": [
            {"provider": "ollama", "cost": "FREE", "note": "Local - install from ollama.ai"},
            {"provider": "groq", "cost": "$0.05-0.79/1M tokens", "note": "Fastest API - groq.com"},
            {"provider": "together", "cost": "$0.18-0.90/1M tokens", "note": "$25 free - together.ai"},
        ]
    }


@router.get("/providers")
async def get_providers():
    """Get detailed provider information."""
    return {
        "providers": {
            "ollama": {
                "status": llm_service.providers[LLMProvider.OLLAMA].is_available(),
                "cost": "FREE",
                "speed": "Medium (depends on hardware)",
                "setup": "Install from ollama.ai, then: ollama pull dolphin-mixtral",
                "models": ["dolphin-mixtral", "llama2-uncensored", "wizard-vicuna-uncensored"],
                "uncensored": True,
            },
            "groq": {
                "status": llm_service.providers[LLMProvider.GROQ].is_available(),
                "cost": "$0.05-0.79 per 1M tokens",
                "speed": "FASTEST (800+ tokens/sec)",
                "setup": "Get API key at console.groq.com, set GROQ_API_KEY",
                "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b"],
                "uncensored": False,  # Less restrictive than OpenAI
            },
            "together": {
                "status": llm_service.providers[LLMProvider.TOGETHER].is_available(),
                "cost": "$0.18-0.90 per 1M tokens",
                "speed": "Fast",
                "setup": "Get $25 free at together.ai, set TOGETHER_API_KEY",
                "models": ["dolphin-2.5-mixtral-8x7b", "Nous-Hermes-2-Mixtral", "MythoMax-L2-13b"],
                "uncensored": True,  # Has uncensored models
            },
        },
        "recommendation": "Start with Ollama (free) for development, use Groq for production (fastest + cheap)"
    }


@router.get("/models")
async def get_models():
    """Get available models by provider."""
    from app.services.llm_providers import ProviderConfig

    return {
        "ollama": ProviderConfig.OLLAMA["models"],
        "groq": ProviderConfig.GROQ["models"],
        "together": ProviderConfig.TOGETHER["models"],
    }


# ============== CHAT ENDPOINTS ==============

@router.post("/chat")
async def chat(request: SimpleChatRequest):
    """
    Chat with AI using the cheapest available provider.

    Automatically selects: Ollama (free) > Groq (cheap) > Together (cheap)
    """
    provider = None
    if request.provider:
        try:
            provider = LLMProvider(request.provider)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {request.provider}")

    response = await llm_service.adult_chat(
        message=request.message,
        persona=request.persona,
        conversation_history=request.conversation_history,
        provider=provider
    )

    return {
        "response": response.content,
        "provider": response.provider,
        "model": response.model,
        "tokens": response.tokens_used,
        "cost": f"${response.cost_estimate:.6f}",
        "latency_ms": response.latency_ms,
        "persona": request.persona
    }


@router.post("/chat/compare")
async def compare_providers(request: SimpleChatRequest):
    """
    Compare responses from all available providers.

    Useful for testing quality and speed differences.
    """
    results = {}

    for provider_enum in [LLMProvider.OLLAMA, LLMProvider.GROQ, LLMProvider.TOGETHER]:
        if llm_service.providers[provider_enum].is_available():
            response = await llm_service.adult_chat(
                message=request.message,
                persona=request.persona,
                conversation_history=request.conversation_history,
                provider=provider_enum
            )
            results[provider_enum.value] = {
                "response": response.content,
                "model": response.model,
                "tokens": response.tokens_used,
                "cost": f"${response.cost_estimate:.6f}",
                "latency_ms": response.latency_ms,
            }

    if not results:
        return {"error": "No providers available. Install Ollama or set API keys."}

    return {"comparisons": results}


# ============== MESSAGE GENERATION ==============

@router.post("/generate-message")
async def generate_message(request: MessageGenRequest):
    """Generate a message for platform messaging."""
    message = await llm_service.generate_message(
        contact_name=request.contact_name,
        context=request.context,
        tone=request.tone
    )

    return {
        "message": message,
        "tone": request.tone,
        "recipient": request.contact_name
    }


# ============== CONTENT IDEAS ==============

@router.post("/content-ideas")
async def content_ideas(request: ContentIdeasRequest):
    """Generate content ideas for creators."""
    ideas = await llm_service.generate_content_ideas(
        niche=request.niche,
        count=request.count
    )

    return {
        "ideas": ideas,
        "niche": request.niche,
        "count": len(ideas)
    }


# ============== COST CALCULATOR ==============

@router.post("/estimate-cost")
async def estimate_cost(
    messages_per_day: int = 1000,
    avg_tokens_per_message: int = 200
):
    """
    Estimate monthly costs for different providers.

    Based on message volume and average token count.
    """
    monthly_messages = messages_per_day * 30
    monthly_tokens = monthly_messages * avg_tokens_per_message
    tokens_in_millions = monthly_tokens / 1_000_000

    estimates = {
        "monthly_messages": monthly_messages,
        "monthly_tokens": monthly_tokens,
        "costs": {
            "ollama": {
                "cost": "$0.00",
                "note": "FREE - Local inference",
                "hardware": "Requires GPU with 8GB+ VRAM for best models"
            },
            "groq_small": {
                "model": "llama-3.1-8b-instant",
                "input_cost": f"${tokens_in_millions * 0.05:.2f}",
                "output_cost": f"${tokens_in_millions * 0.08:.2f}",
                "total": f"${tokens_in_millions * 0.13:.2f}/month",
            },
            "groq_large": {
                "model": "llama-3.3-70b-versatile",
                "input_cost": f"${tokens_in_millions * 0.59:.2f}",
                "output_cost": f"${tokens_in_millions * 0.79:.2f}",
                "total": f"${tokens_in_millions * 1.38:.2f}/month",
            },
            "together_uncensored": {
                "model": "dolphin-2.5-mixtral-8x7b",
                "cost": f"${tokens_in_millions * 0.60:.2f}/month",
                "note": "Fully uncensored"
            },
            "openai_gpt4": {
                "model": "gpt-4o (for comparison)",
                "cost": f"${tokens_in_millions * 7.50:.2f}/month",
                "note": "10x more expensive + censored"
            }
        },
        "recommendation": f"For {messages_per_day} messages/day, use Groq llama-3.1-8b (~${tokens_in_millions * 0.13:.2f}/month) or Ollama (free)"
    }

    return estimates
