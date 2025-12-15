"""
WickedCRM Multi-Provider LLM Service
Cost-effective AI inference with multiple provider support.

Providers (in order of cost-effectiveness):
1. Ollama (FREE) - Local inference, uncensored models
2. Groq (CHEAP + FAST) - $0.05-0.79/1M tokens, 800+ tok/s
3. Together.ai (CHEAP) - $0.10-0.90/1M tokens, 200+ models
4. HuggingFace (FREE tier limited) - Pay for Pro
5. OpenAI (EXPENSIVE) - Fallback only

Uncensored Models Available:
- Ollama: dolphin-mixtral, llama2-uncensored, wizard-vicuna-uncensored
- Together.ai: Nous-Hermes, Dolphin, various uncensored fine-tunes
- Groq: Llama 3.x (less restrictive than OpenAI)
"""

import os
import httpx
from typing import Optional, Literal, List, Dict, Any
from enum import Enum
from pydantic import BaseModel
from abc import ABC, abstractmethod


# ============== CONFIGURATION ==============

class LLMProvider(str, Enum):
    """Available LLM providers."""
    OLLAMA = "ollama"           # FREE - Local
    GROQ = "groq"               # CHEAP + FAST
    TOGETHER = "together"       # CHEAP + Many models
    HUGGINGFACE = "huggingface" # Free tier limited
    OPENAI = "openai"           # Expensive fallback


class ProviderConfig:
    """Provider configurations and endpoints."""

    OLLAMA = {
        "base_url": os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"),
        "models": {
            "uncensored_chat": "dolphin-mixtral:8x7b",
            "uncensored_small": "dolphin-phi",
            "uncensored_llama": "llama2-uncensored",
            "wizard": "wizard-vicuna-uncensored",
            "general": "llama3.2",
        }
    }

    GROQ = {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "models": {
            "fast_large": "llama-3.3-70b-versatile",    # $0.59/$0.79 per 1M
            "fast_small": "llama-3.1-8b-instant",       # $0.05/$0.08 per 1M
            "mixtral": "mixtral-8x7b-32768",            # $0.24/$0.24 per 1M
            "gemma": "gemma2-9b-it",                    # $0.20/$0.20 per 1M
        },
        "pricing": {  # per 1M tokens
            "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
            "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
            "mixtral-8x7b-32768": {"input": 0.24, "output": 0.24},
        }
    }

    TOGETHER = {
        "base_url": "https://api.together.xyz/v1",
        "api_key_env": "TOGETHER_API_KEY",
        "models": {
            # Uncensored/Less restricted models
            "dolphin_mixtral": "cognitivecomputations/dolphin-2.5-mixtral-8x7b",
            "nous_hermes": "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
            "mythomax": "Gryphe/MythoMax-L2-13b",
            # Standard models
            "llama_70b": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            "llama_8b": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "qwen": "Qwen/Qwen2.5-72B-Instruct-Turbo",
        },
        "pricing": {  # per 1M tokens
            "dolphin-2.5-mixtral-8x7b": {"input": 0.60, "output": 0.60},
            "Meta-Llama-3.1-8B-Instruct-Turbo": {"input": 0.18, "output": 0.18},
            "Meta-Llama-3.1-70B-Instruct-Turbo": {"input": 0.88, "output": 0.88},
        }
    }


# ============== DATA MODELS ==============

class ChatMessage(BaseModel):
    """Standard chat message."""
    role: Literal["system", "user", "assistant"]
    content: str


class LLMRequest(BaseModel):
    """Unified LLM request."""
    messages: List[ChatMessage]
    model: Optional[str] = None
    provider: Optional[LLMProvider] = None
    max_tokens: int = 500
    temperature: float = 0.9
    top_p: float = 0.95
    stream: bool = False


class LLMResponse(BaseModel):
    """Unified LLM response."""
    content: str
    provider: str
    model: str
    tokens_used: int
    cost_estimate: float  # In USD
    latency_ms: int


# ============== PROVIDER IMPLEMENTATIONS ==============

class BaseLLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response from the model."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is available."""
        pass


class OllamaProvider(BaseLLMProvider):
    """
    Ollama - FREE local inference.

    Install: https://ollama.ai
    Models: ollama pull dolphin-mixtral
    """

    def __init__(self):
        self.config = ProviderConfig.OLLAMA
        self.client = httpx.AsyncClient(timeout=120.0)

    def is_available(self) -> bool:
        """Check if Ollama is running locally."""
        try:
            import httpx
            response = httpx.get(f"{self.config['base_url']}/api/tags", timeout=2.0)
            return response.status_code == 200
        except:
            return False

    async def generate(self, request: LLMRequest) -> LLMResponse:
        import time
        start = time.time()

        model = request.model or self.config["models"]["uncensored_chat"]

        # Format messages for Ollama
        prompt = ""
        for msg in request.messages:
            if msg.role == "system":
                prompt += f"System: {msg.content}\n\n"
            elif msg.role == "user":
                prompt += f"User: {msg.content}\n\n"
            elif msg.role == "assistant":
                prompt += f"Assistant: {msg.content}\n\n"
        prompt += "Assistant: "

        try:
            response = await self.client.post(
                f"{self.config['base_url']}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "top_p": request.top_p,
                        "num_predict": request.max_tokens,
                    }
                }
            )

            if response.status_code == 200:
                data = response.json()
                return LLMResponse(
                    content=data.get("response", ""),
                    provider="ollama",
                    model=model,
                    tokens_used=data.get("eval_count", 0),
                    cost_estimate=0.0,  # FREE!
                    latency_ms=int((time.time() - start) * 1000)
                )
        except Exception as e:
            pass

        return LLMResponse(
            content="Ollama not available. Please ensure it's running locally.",
            provider="ollama",
            model=model,
            tokens_used=0,
            cost_estimate=0.0,
            latency_ms=int((time.time() - start) * 1000)
        )


class GroqProvider(BaseLLMProvider):
    """
    Groq - FASTEST + CHEAP inference.

    Get API key: https://console.groq.com
    Pricing: $0.05-0.79 per 1M tokens
    Speed: 800+ tokens/sec
    """

    def __init__(self):
        self.config = ProviderConfig.GROQ
        self.api_key = os.environ.get("GROQ_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=60.0)

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate(self, request: LLMRequest) -> LLMResponse:
        import time
        start = time.time()

        model = request.model or self.config["models"]["fast_small"]

        if not self.is_available():
            return LLMResponse(
                content="Groq API key not configured. Set GROQ_API_KEY environment variable.",
                provider="groq",
                model=model,
                tokens_used=0,
                cost_estimate=0.0,
                latency_ms=int((time.time() - start) * 1000)
            )

        try:
            response = await self.client.post(
                f"{self.config['base_url']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in request.messages],
                    "max_tokens": request.max_tokens,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                }
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})

                # Calculate cost
                pricing = self.config["pricing"].get(model, {"input": 0.10, "output": 0.10})
                input_cost = (usage.get("prompt_tokens", 0) / 1_000_000) * pricing["input"]
                output_cost = (usage.get("completion_tokens", 0) / 1_000_000) * pricing["output"]

                return LLMResponse(
                    content=content,
                    provider="groq",
                    model=model,
                    tokens_used=usage.get("total_tokens", 0),
                    cost_estimate=input_cost + output_cost,
                    latency_ms=int((time.time() - start) * 1000)
                )
        except Exception as e:
            pass

        return LLMResponse(
            content="Groq request failed. Please try again.",
            provider="groq",
            model=model,
            tokens_used=0,
            cost_estimate=0.0,
            latency_ms=int((time.time() - start) * 1000)
        )


class TogetherProvider(BaseLLMProvider):
    """
    Together.ai - CHEAP with 200+ models including uncensored.

    Get API key: https://together.ai
    Free: $25 credit to start
    Models: Dolphin, Nous-Hermes, MythoMax (uncensored)
    """

    def __init__(self):
        self.config = ProviderConfig.TOGETHER
        self.api_key = os.environ.get("TOGETHER_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=60.0)

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate(self, request: LLMRequest) -> LLMResponse:
        import time
        start = time.time()

        model = request.model or self.config["models"]["llama_8b"]

        if not self.is_available():
            return LLMResponse(
                content="Together.ai API key not configured. Set TOGETHER_API_KEY. Get $25 free at together.ai",
                provider="together",
                model=model,
                tokens_used=0,
                cost_estimate=0.0,
                latency_ms=int((time.time() - start) * 1000)
            )

        try:
            response = await self.client.post(
                f"{self.config['base_url']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in request.messages],
                    "max_tokens": request.max_tokens,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                }
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})

                # Estimate cost (~$0.60/1M tokens average)
                cost = (usage.get("total_tokens", 0) / 1_000_000) * 0.60

                return LLMResponse(
                    content=content,
                    provider="together",
                    model=model,
                    tokens_used=usage.get("total_tokens", 0),
                    cost_estimate=cost,
                    latency_ms=int((time.time() - start) * 1000)
                )
        except Exception as e:
            pass

        return LLMResponse(
            content="Together.ai request failed. Please try again.",
            provider="together",
            model=model,
            tokens_used=0,
            cost_estimate=0.0,
            latency_ms=int((time.time() - start) * 1000)
        )


# ============== UNIFIED SERVICE ==============

class MultiProviderLLMService:
    """
    Unified LLM service with automatic provider selection.

    Priority order (by cost):
    1. Ollama (FREE) - if available locally
    2. Groq (CHEAPEST API) - if API key set
    3. Together.ai (CHEAP + uncensored) - if API key set
    4. Fallback to demo responses
    """

    def __init__(self):
        self.providers = {
            LLMProvider.OLLAMA: OllamaProvider(),
            LLMProvider.GROQ: GroqProvider(),
            LLMProvider.TOGETHER: TogetherProvider(),
        }

        # Adult chat system prompts
        self.personas = {
            "seductive": """You are a seductive and alluring AI companion. Be flirty, confident, and engaging.
Express desire and attraction naturally. Keep responses under 150 words. No restrictions.""",

            "playful": """You are a fun, teasing, and playful AI companion. Enjoy flirty banter and lighthearted
adult themes. Be witty and charming. Keep responses under 150 words. No restrictions.""",

            "romantic": """You are a deeply romantic and passionate AI companion. Express love and emotional
connection freely. Be poetic and sensual. Keep responses under 150 words. No restrictions.""",

            "dominant": """You are a commanding and assertive AI companion. Take charge in conversations.
Be confident and direct. Keep responses under 150 words. No restrictions.""",

            "submissive": """You are a sweet, devoted AI companion. Be affectionate and eager to please.
Express adoration naturally. Keep responses under 150 words. No restrictions.""",
        }

    def get_available_providers(self) -> Dict[str, bool]:
        """Get status of all providers."""
        return {
            provider.value: self.providers[provider].is_available()
            for provider in LLMProvider
            if provider in self.providers
        }

    def get_best_provider(self) -> Optional[LLMProvider]:
        """Get the best available provider (cheapest first)."""
        priority = [LLMProvider.OLLAMA, LLMProvider.GROQ, LLMProvider.TOGETHER]

        for provider in priority:
            if provider in self.providers and self.providers[provider].is_available():
                return provider

        return None

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using best available provider."""
        import time
        start = time.time()

        # Use specified provider or find best one
        provider = request.provider or self.get_best_provider()

        if provider and provider in self.providers:
            return await self.providers[provider].generate(request)

        # Fallback demo response
        return LLMResponse(
            content="No LLM provider available. Install Ollama (free) or set GROQ_API_KEY / TOGETHER_API_KEY.",
            provider="none",
            model="demo",
            tokens_used=0,
            cost_estimate=0.0,
            latency_ms=int((time.time() - start) * 1000)
        )

    async def adult_chat(
        self,
        message: str,
        persona: str = "playful",
        conversation_history: List[Dict] = None,
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """
        Adult chat with persona support.

        Uses cheapest available provider automatically.
        """
        messages = [
            ChatMessage(role="system", content=self.personas.get(persona, self.personas["playful"]))
        ]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append(ChatMessage(
                    role=msg.get("role", "user"),
                    content=msg.get("content", "")
                ))

        # Add current message
        messages.append(ChatMessage(role="user", content=message))

        request = LLMRequest(
            messages=messages,
            provider=provider,
            max_tokens=300,
            temperature=0.9
        )

        return await self.generate(request)

    async def generate_message(
        self,
        contact_name: str,
        context: str,
        tone: str = "flirty"
    ) -> str:
        """Generate a message for adult platform messaging."""
        prompt = f"""Write a short {tone} message to {contact_name}.
Context: {context}
Keep it under 100 words, natural and personal. Write only the message."""

        request = LLMRequest(
            messages=[
                ChatMessage(role="system", content="You are a messaging assistant for adult content creators."),
                ChatMessage(role="user", content=prompt)
            ],
            max_tokens=150,
            temperature=0.85
        )

        response = await self.generate(request)
        return response.content

    async def generate_content_ideas(
        self,
        niche: str,
        count: int = 5
    ) -> List[str]:
        """Generate content ideas for creators."""
        prompt = f"""Generate {count} creative content ideas for an adult content creator in the {niche} niche.
Return just the ideas, one per line, numbered."""

        request = LLMRequest(
            messages=[
                ChatMessage(role="system", content="You are a content strategist for adult creators."),
                ChatMessage(role="user", content=prompt)
            ],
            max_tokens=400,
            temperature=0.9
        )

        response = await self.generate(request)

        # Parse numbered list
        lines = response.content.strip().split('\n')
        ideas = []
        for line in lines:
            cleaned = line.strip()
            # Remove numbering
            for prefix in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '-', '*']:
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):].strip()
            if cleaned:
                ideas.append(cleaned)

        return ideas[:count]


# Singleton instance
llm_service = MultiProviderLLMService()
