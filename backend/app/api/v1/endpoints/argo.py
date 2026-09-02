from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.argo import FloatMetadata, Profile
from app.services.factory import get_argo_data_source

router = APIRouter()


@router.get(
    "/floats/{float_id}",
    response_model=FloatMetadata,
    summary="Get Float Metadata",
    description="Retrieves metadata and latest status for a specific Argo float platform.",
)
async def get_float_metadata(float_id: str) -> FloatMetadata:
    provider = get_argo_data_source()
    try:
        float_data = await provider.get_float(float_id)
        if not float_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Float platform ID '{float_id}' was not found.",
            )
        return float_data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving float metadata: {str(exc)}",
        )


@router.get(
    "/floats/{float_id}/profiles",
    response_model=List[Profile],
    summary="Get Float Profiles",
    description="Retrieves vertical ocean profile observation series for a specific float platform.",
)
async def get_float_profiles(
    float_id: str,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of profiles to retrieve"),
) -> List[Profile]:
    provider = get_argo_data_source()
    try:
        profiles = await provider.get_float_profiles(float_id, limit=limit)
        return profiles
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profiles for float '{float_id}': {str(exc)}",
        )


@router.get(
    "/profiles/search",
    response_model=List[Profile],
    summary="Search Profiles",
    description="Searches ocean profiles matching geographic bounding box and date range constraints.",
)
async def search_profiles(
    min_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Minimum latitude (-90 to 90)"),
    max_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Maximum latitude (-90 to 90)"),
    min_lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Minimum longitude (-180 to 180)"),
    max_lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Maximum longitude (-180 to 180)"),
    start_date: Optional[str] = Query(None, description="Start date ISO 8601 string (e.g. 2024-01-01T00:00:00Z)"),
    end_date: Optional[str] = Query(None, description="End date ISO 8601 string (e.g. 2024-01-02T00:00:00Z)"),
    limit: int = Query(50, ge=1, le=500, description="Maximum profiles to return"),
) -> List[Profile]:
    provider = get_argo_data_source()
    try:
        profiles = await provider.search_profiles(
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )
        return profiles
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching profiles: {str(exc)}",
        )
