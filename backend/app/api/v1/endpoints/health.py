from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse, ReadinessResponse
from app.services.factory import get_argo_data_source

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness Health Check",
    description="Returns backend liveness health status, application metadata, and environment details.",
)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )


@router.get(
    "/health/readiness",
    response_model=ReadinessResponse,
    summary="Readiness Health Probe",
    description="Evaluates operational readiness including active data provider configuration and environmental health.",
)
async def get_readiness() -> ReadinessResponse:
    provider = get_argo_data_source()
    provider_id = getattr(provider, "data_source_id", "unknown")

    checks = {
        "config_loaded": True,
        "data_provider_configured": settings.DATA_PROVIDER,
        "active_provider_class": provider.__class__.__name__,
        "argo_base_url": settings.ARGO_BASE_URL,
    }

    return ReadinessResponse(
        status="ready",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        data_provider=provider_id,
        checks=checks,
    )
