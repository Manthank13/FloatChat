from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user
from app.models.auth import UserResponse
from app.models.preferences import UserPreferencesResponse, UserPreferencesUpdate
from app.services.preferences import PreferencesService

router = APIRouter()


def get_preferences_service() -> PreferencesService:
    """Dependency helper providing PreferencesService instance."""
    return PreferencesService()


@router.get(
    "",
    response_model=UserPreferencesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User Preferences",
    description="Retrieves UI/UX preferences for the authenticated user, automatically initializing defaults if not yet set.",
)
async def get_preferences(
    current_user: UserResponse = Depends(get_current_user),
    service: PreferencesService = Depends(get_preferences_service),
) -> UserPreferencesResponse:
    return await service.get_preferences(user_id=current_user.id)


@router.put(
    "",
    response_model=UserPreferencesResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User Preferences",
    description="Updates UI/UX preferences for the authenticated user.",
)
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: PreferencesService = Depends(get_preferences_service),
) -> UserPreferencesResponse:
    return await service.update_preferences(user_id=current_user.id, data=data)
