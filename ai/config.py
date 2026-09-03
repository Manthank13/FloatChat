"""
Configuration settings for FloatChat AI and LLM interpretation services.
"""

import os
from typing import Optional
from pydantic import BaseModel, Field


class AIConfig(BaseModel):
    """Configuration parameters for the FloatChat AI layer."""

    llm_provider: str = Field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "openai" if os.getenv("OPENAI_API_KEY") else "mock"),
        description="LLM Provider to use ('mock', 'openai', 'gemini', 'ollama')",
    )
    model_name: str = Field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", os.getenv("LLM_MODEL", "gpt-4o-mini")),
        description="Model identifier for the selected provider (e.g. gpt-4o-mini, gpt-4o, gemini-2.5-flash)",
    )
    temperature: float = Field(
        default_factory=lambda: float(os.getenv("LLM_TEMPERATURE", "0.0")),
        ge=0.0,
        le=2.0,
        description="Sampling temperature for deterministic parsing (default 0.0)",
    )
    max_tokens: int = Field(
        default_factory=lambda: int(os.getenv("LLM_MAX_TOKENS", "1024")),
        gt=0,
        description="Maximum response token length",
    )
    timeout_seconds: float = Field(
        default_factory=lambda: float(os.getenv("LLM_TIMEOUT_SECONDS", "15.0")),
        gt=0.0,
        description="Timeout for LLM API calls in seconds",
    )
    fallback_to_deterministic: bool = Field(
        default=True,
        description="Whether to fall back to deterministic regex parser if LLM fails",
    )
    openai_api_key_env_var: str = Field(
        default="OPENAI_API_KEY",
        description="Environment variable name storing the OpenAI API key",
    )
    api_key_env_var: str = Field(
        default="OPENAI_API_KEY",
        description="Environment variable name storing the LLM API key",
    )

    def get_api_key(self) -> Optional[str]:
        """Safely retrieve the API key from environment variables without exposing secrets."""
        provider = self.llm_provider.lower()
        if provider == "openai":
            return os.environ.get(self.openai_api_key_env_var) or os.environ.get("OPENAI_API_KEY")
        elif provider == "gemini":
            return os.environ.get("GEMINI_API_KEY")
        return os.environ.get(self.api_key_env_var)

    @classmethod
    def from_env(cls) -> "AIConfig":
        """Construct AIConfig dynamically from environment variables."""
        return cls()
