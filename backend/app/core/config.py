from typing import List, Union
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
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
