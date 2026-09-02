from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or defaults."""

    PROJECT_NAME: str = "FloatChat API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Data Provider configuration ("argo" or "mock")
    DATA_PROVIDER: str = "argo"
    ARGO_BASE_URL: str = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json"
    ARGO_REQUEST_TIMEOUT: float = 15.0
    ARGO_MAX_RECORDS: int = 500

    # Supabase Authentication Readiness Configuration (Future Integration)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return v

    def is_production(self) -> bool:
        """Returns True if running in production environment."""
        return self.ENVIRONMENT.strip().lower() in ("production", "prod")

    def is_testing(self) -> bool:
        """Returns True if running in testing environment."""
        return self.ENVIRONMENT.strip().lower() in ("testing", "test")

    def is_development(self) -> bool:
        """Returns True if running in development environment."""
        return not self.is_production() and not self.is_testing()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
