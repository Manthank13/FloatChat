"""Frontend Product-Facing API endpoints conforming to frontend-api-contract.md."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import get_current_user_optional
from app.core.config import settings
from app.models.auth import UserResponse
from app.schemas.frontend_contract import (
    FleetFloatItem,
    FleetStatusResponse,
    FloatDetailResponse,
    FloatProfileResponse,
    FrontendHealthResponse,
    FrontendQueryRequest,
    FrontendQueryResponse,
    OceanCompareResponse,
)
from app.services.frontend_adapter import FrontendAdapterService

router = APIRouter()


def get_frontend_adapter() -> FrontendAdapterService:
    """Dependency provider for FrontendAdapterService."""
    return FrontendAdapterService()


# ==============================================================================
# 1. Natural-Language Query & Conversation (/api/query, /api/chat)
# ==============================================================================

@router.post(
    "/query",
    response_model=FrontendQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Natural-Language Climate & Ocean Query",
    description="Processes environmental and oceanographic questions, returning real Argo float telemetry, profile measurements, and grounded environmental indicators.",
)
async def process_frontend_query(
    request: FrontendQueryRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional),
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FrontendQueryResponse:
    return await adapter.process_query(request, current_user=current_user)


@router.post(
    "/chat",
    response_model=FrontendQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Frontend Chat Endpoint (Fallback / Compatibility)",
    description="Fallback route matching /api/chat to ensure complete frontend compatibility.",
)
async def process_frontend_chat(
    request: FrontendQueryRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional),
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FrontendQueryResponse:
    return await adapter.process_query(request, current_user=current_user)


# ==============================================================================
# 2. Float Fleet Map & Directory (/api/floats)
# ==============================================================================

@router.get(
    "/floats",
    response_model=List[FleetFloatItem],
    status_code=status.HTTP_200_OK,
    summary="Climate Sensing Fleet Locations",
    description="Returns locations and telemetry summary of active Argo floats for map markers and directory.",
)
async def get_floats(
    region: str = Query("all", description="Ocean basin filter ('all', 'bay_of_bengal', 'arabian_sea', 'equatorial_indian_ocean')"),
    status_filter: str = Query("all", alias="status", description="Status filter ('all', 'active', 'profiling', 'surface_uplink')"),
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> List[FleetFloatItem]:
    return await adapter.get_fleet_floats(region=region, status_filter=status_filter)


# ==============================================================================
# 3. Float Details & Trajectory (/api/floats/{float_id})
# ==============================================================================

@router.get(
    "/floats/{float_id}",
    response_model=FloatDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Float Details & Trajectory",
    description="Retrieves telemetry, deployment, and cycle details for an individual Argo float. Trajectory returns empty list (historical drift tracking currently unavailable).",
)
async def get_float_details(
    float_id: str,
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FloatDetailResponse:
    return await adapter.get_float_details(float_id=float_id)


# ==============================================================================
# 4. Vertical CTD Profile (/api/floats/{float_id}/profile)
# ==============================================================================

@router.get(
    "/floats/{float_id}/profile",
    response_model=FloatProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Vertical CTD Profile",
    description="Returns vertical depth observations (temperature, salinity, pressure) for dynamic water column visualization.",
)
async def get_float_profile(
    float_id: str,
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FloatProfileResponse:
    return await adapter.get_float_profile(float_id=float_id)


# ==============================================================================
# 5. Fleet Pulse & Overview (/api/fleet/status)
# ==============================================================================

@router.get(
    "/fleet/status",
    response_model=FleetStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Fleet Status & Signals",
    description="Summarizes observable Argo float counts and coverage across regional ocean basins.",
)
async def get_fleet_status(
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FleetStatusResponse:
    return await adapter.get_fleet_status()


# ==============================================================================
# 6. Environmental Comparator (/api/ocean/compare)
# ==============================================================================

@router.get(
    "/ocean/compare",
    response_model=OceanCompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Environmental Stratification & Heat Comparator",
    description="Performs comparative analysis between two float platforms or regional ocean basins.",
)
async def compare_ocean(
    float_id_a: Optional[str] = Query(None, description="First float WMO identifier"),
    float_id_b: Optional[str] = Query(None, description="Second float WMO identifier"),
    region_a: Optional[str] = Query(None, description="First region ('bay_of_bengal', 'arabian_sea', 'equatorial_indian_ocean')"),
    region_b: Optional[str] = Query(None, description="Second region"),
    variable: str = Query("TEMP", description="Oceanographic variable to compare ('TEMP', 'PSAL', 'PRES')"),
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> OceanCompareResponse:
    return await adapter.compare_ocean(
        float_id_a=float_id_a,
        float_id_b=float_id_b,
        region_a=region_a,
        region_b=region_b,
        variable=variable,
    )


# ==============================================================================
# 7. Health Endpoint (/api/health)
# ==============================================================================

@router.get(
    "/health",
    response_model=FrontendHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Product-Facing Health Check",
    description="Returns service availability for the frontend application.",
)
async def get_frontend_health(
    adapter: FrontendAdapterService = Depends(get_frontend_adapter),
) -> FrontendHealthResponse:
    return FrontendHealthResponse(
        status="ok",
        service="FloatChat Climate Intelligence API",
        argo_data_source=adapter.data_source.__class__.__name__,
        argo_active_count=None,
    )
