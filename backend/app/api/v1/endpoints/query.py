from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.query import NearbyFloatResult, ObservationQuery, QueryResponse
from app.services.query import ObservationQueryService

router = APIRouter()


@router.post(
    "/observations/query",
    response_model=QueryResponse,
    summary="Query Ocean Observations (POST)",
    description="Executes a composable query over oceanographic observations using JSON body.",
)
async def query_observations_post(query: ObservationQuery) -> QueryResponse:
    try:
        service = ObservationQueryService()
        return await service.execute_query(query)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing observation query: {str(exc)}",
        )


@router.get(
    "/observations/query",
    response_model=QueryResponse,
    summary="Query Ocean Observations (GET)",
    description="Executes a composable query over oceanographic observations using URL parameters.",
)
async def query_observations_get(
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude (-90 to 90)"),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude (-180 to 180)"),
    radius_km: Optional[float] = Query(None, gt=0, description="Radius in km"),
    variable: Optional[str] = Query(None, description="Variable (TEMP, PSAL, PRES or comma-separated)"),
    depth_m: Optional[float] = Query(None, ge=0, description="Target depth in meters"),
    depth_min_m: Optional[float] = Query(None, ge=0, description="Minimum depth in meters"),
    depth_max_m: Optional[float] = Query(None, ge=0, description="Maximum depth in meters"),
    start_time: Optional[str] = Query(None, description="Start date ISO 8601 string"),
    end_time: Optional[str] = Query(None, description="End date ISO 8601 string"),
    float_id: Optional[str] = Query(None, description="Float platform WMO ID"),
    limit: int = Query(50, ge=1, le=500, description="Maximum results count"),
) -> QueryResponse:
    vars_list = [v.strip().upper() for v in variable.split(",")] if variable else None

    try:
        query_obj = ObservationQuery(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            variable=vars_list,
            depth_m=depth_m,
            depth_min_m=depth_min_m,
            depth_max_m=depth_max_m,
            start_time=start_time,
            end_time=end_time,
            float_id=float_id,
            limit=limit,
        )
        service = ObservationQueryService()
        return await service.execute_query(query_obj)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing query: {str(exc)}",
        )


@router.get(
    "/observations/nearby",
    response_model=QueryResponse,
    summary="Get Nearby Observations",
    description="Retrieves ocean observations located within a specified radius of a geographic coordinate.",
)
async def get_observations_nearby(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude (-90 to 90)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude (-180 to 180)"),
    radius_km: float = Query(100.0, gt=0, description="Search radius in kilometers"),
    variable: Optional[str] = Query(None, description="Variable filter (TEMP, PSAL, PRES)"),
    depth_m: Optional[float] = Query(None, ge=0, description="Target depth in meters"),
    limit: int = Query(50, ge=1, le=500, description="Maximum results count"),
) -> QueryResponse:
    vars_list = [v.strip().upper() for v in variable.split(",")] if variable else None
    try:
        query_obj = ObservationQuery(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            variable=vars_list,
            depth_m=depth_m,
            limit=limit,
        )
        service = ObservationQueryService()
        return await service.execute_query(query_obj)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving nearby observations: {str(exc)}",
        )


@router.get(
    "/floats/nearby",
    response_model=List[NearbyFloatResult],
    summary="Get Nearby Floats",
    description="Discovers active Argo floats operating near a geographic location point.",
)
async def get_floats_nearby(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Center latitude (-90 to 90)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Center longitude (-180 to 180)"),
    radius_km: float = Query(200.0, gt=0, description="Search radius in kilometers"),
    limit: int = Query(10, ge=1, le=50, description="Maximum floats count"),
) -> List[NearbyFloatResult]:
    try:
        service = ObservationQueryService()
        return await service.get_nearby_floats(latitude=latitude, longitude=longitude, radius_km=radius_km, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error discovering nearby floats: {str(exc)}",
        )
