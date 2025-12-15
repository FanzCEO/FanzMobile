"""
WickedCRM Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "WickedCRM AI"
    debug: bool = False

    # Database
    database_url: str = "postgresql://crm_user:change_me@localhost:5432/crm_escort"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 1 week

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_chat_model: str = "gpt-4o-mini"  # Faster/cheaper for chat

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Hugging Face
    huggingface_api_key: str = ""

    # Multi-Provider LLM (Cost-Effective)
    groq_api_key: str = ""
    together_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
