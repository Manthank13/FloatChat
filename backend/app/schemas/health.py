from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(..., json_schema_extra={"example": "healthy"}, description="Status of the API service")
    app_name: str = Field(..., json_schema_extra={"example": "FloatChat API"}, description="Application name")
    version: str = Field(..., json_schema_extra={"example": "0.1.0"}, description="Application version")
    environment: str = Field(..., json_schema_extra={"example": "development"}, description="Execution environment")
