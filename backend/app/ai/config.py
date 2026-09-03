"""
Configuration settings for FloatChat AI and LLM interpretation services.
"""

import os
from typing import Optional
from pydantic import BaseModel, Field


class AIConfig(BaseModel):
    """Configuration parameters for the FloatChat AI layer."""

    llm_provider: str = Field(
        default="mock",
        description="LLM Provider to use ('mock', 'gemini', 'openai', 'ollama')",
    )
    model_name: str = Field(
        default="gemini-2.5-flash",
        description="Model identifier for the selected provider",
    )
    temperature: float = Field(
        default=0.0,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for deterministic parsing (default 0.0)",
    )
    max_tokens: int = Field(
        default=1024,
        gt=0,
        description="Maximum response token length",
    )
    timeout_seconds: float = Field(
        default=15.0,
        gt=0.0,
        description="Timeout for LLM API calls in seconds",
    )
    fallback_to_deterministic: bool = Field(
        default=True,
        description="Whether to fall back to deterministic regex parser if LLM fails",
    )
    api_key_env_var: str = Field(
        default="GEMINI_API_KEY",
        description="Environment variable name storing the LLM API key",
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Direct API key override (optional)",
    )

    @classmethod
    def from_settings(cls) -> "AIConfig":
        """Instantiate AIConfig using centralized application settings."""
        try:
            from app.core.config import settings
            return cls(
                llm_provider=settings.AI_LLM_PROVIDER,
                model_name=settings.AI_MODEL_NAME,
                temperature=settings.AI_TEMPERATURE,
                timeout_seconds=settings.AI_TIMEOUT_SECONDS,
                fallback_to_deterministic=settings.AI_FALLBACK_TO_DETERMINISTIC,
                api_key=settings.GEMINI_API_KEY,
            )
        except Exception:
            return cls()

    def get_api_key(self) -> Optional[str]:
        """Safely retrieve the API key from environment variables or settings without exposing secrets."""
        if self.api_key:
            return self.api_key
        return os.environ.get(self.api_key_env_var)
