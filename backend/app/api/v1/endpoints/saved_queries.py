from fastapi import APIRouter, Depends, Query, status
from app.api.deps import get_current_user
from app.models.auth import UserResponse
from app.models.saved_query import (
    SavedQueryCreate,
    SavedQueryListResponse,
    SavedQueryResponse,
    SavedQueryUpdate,
)
from app.services.saved_query import SavedQueryService

router = APIRouter()


def get_saved_query_service() -> SavedQueryService:
    """Dependency helper providing SavedQueryService instance."""
    return SavedQueryService()


@router.post(
    "",
    response_model=SavedQueryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Oceanographic Query",
    description="Saves a validated structured observation query for the currently authenticated user.",
)
async def create_saved_query(
    data: SavedQueryCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: SavedQueryService = Depends(get_saved_query_service),
) -> SavedQueryResponse:
    return await service.create_query(user_id=current_user.id, data=data)


@router.get(
    "",
    response_model=SavedQueryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Saved Queries",
    description="Returns paginated list of saved queries belonging to the authenticated user.",
)
async def list_saved_queries(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: UserResponse = Depends(get_current_user),
    service: SavedQueryService = Depends(get_saved_query_service),
) -> SavedQueryListResponse:
    return await service.list_queries(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{query_id}",
    response_model=SavedQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Saved Query",
    description="Retrieves a saved query by ID. Enforces ownership and returns 404 if not found.",
)
async def get_saved_query(
    query_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: SavedQueryService = Depends(get_saved_query_service),
) -> SavedQueryResponse:
    return await service.get_query(query_id=query_id, user_id=current_user.id)


@router.patch(
    "/{query_id}",
    response_model=SavedQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Saved Query",
    description="Updates safe fields of an existing saved query owned by caller.",
)
async def update_saved_query(
    query_id: str,
    data: SavedQueryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: SavedQueryService = Depends(get_saved_query_service),
) -> SavedQueryResponse:
    return await service.update_query(
        query_id=query_id,
        user_id=current_user.id,
        data=data,
    )


@router.delete(
    "/{query_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Saved Query",
    description="Deletes a saved query owned by caller.",
)
async def delete_saved_query(
    query_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: SavedQueryService = Depends(get_saved_query_service),
) -> dict:
    return await service.delete_query(query_id=query_id, user_id=current_user.id)
