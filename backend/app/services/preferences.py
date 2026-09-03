from typing import Optional
from app.db.repositories.user_preferences import UserPreferencesRepository
from app.models.preferences import UserPreferencesResponse, UserPreferencesUpdate


class PreferencesService:
    """Service handling user UI/UX preferences and default initialization."""

    def __init__(self, prefs_repo: Optional[UserPreferencesRepository] = None):
        self.prefs_repo = prefs_repo or UserPreferencesRepository()

    async def get_preferences(self, user_id: str) -> UserPreferencesResponse:
        """Retrieves caller preferences, initializing defaults automatically if missing."""
        record = await self.prefs_repo.get_or_create_default(user_id)
        return UserPreferencesResponse(
            user_id=record.user_id,
            theme=record.theme,
            language=record.language,
            default_map_center=record.default_map_center,
            default_map_zoom=record.default_map_zoom,
            preferred_units=record.preferred_units,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    async def update_preferences(
        self,
        user_id: str,
        data: UserPreferencesUpdate,
    ) -> UserPreferencesResponse:
        """Updates caller preferences and returns the updated state."""
        record = await self.prefs_repo.upsert_preferences(
            user_id=user_id,
            theme=data.theme,
            language=data.language,
            default_map_center=data.default_map_center,
            default_map_zoom=data.default_map_zoom,
            preferred_units=data.preferred_units,
        )
        return UserPreferencesResponse(
            user_id=record.user_id,
            theme=record.theme,
            language=record.language,
            default_map_center=record.default_map_center,
            default_map_zoom=record.default_map_zoom,
            preferred_units=record.preferred_units,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
