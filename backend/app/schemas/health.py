from typing import Any, Dict
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(..., json_schema_extra={"example": "healthy"}, description="Status of the API service")
    app_name: str = Field(..., json_schema_extra={"example": "FloatChat API"}, description="Application name")
    version: str = Field(..., json_schema_extra={"example": "0.1.0"}, description="Application version")
    environment: str = Field(..., json_schema_extra={"example": "development"}, description="Execution environment")


class ReadinessResponse(BaseModel):
    """Schema for readiness health check response."""

    status: str = Field(..., json_schema_extra={"example": "ready"}, description="Readiness status ('ready' or 'degraded')")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Execution environment")
    data_provider: str = Field(..., description="Active data provider identifier")
    checks: Dict[str, Any] = Field(default_factory=dict, description="Detailed component readiness checks")
