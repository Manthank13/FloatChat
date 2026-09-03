from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger
from app.db.session import MongoDBManager
from app.models.preferences import (
    DEFAULT_LANGUAGE,
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM,
    DEFAULT_PREFERRED_UNITS,
    DEFAULT_THEME,
    UserPreferences,
)

_UNSET = object()


class UserPreferencesRepository:
    """Repository handling persistence operations for the MongoDB 'user_preferences' collection."""

    # Class-level shared in-memory dictionary for development/testing when MongoDB is offline
    _in_memory_preferences: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Any = _UNSET):
        if db is _UNSET:
            self._db = MongoDBManager.get_db()
        else:
            self._db = db

    @property
    def collection(self):
        if self._db is not None:
            return self._db["user_preferences"]
        return None

    async def create_indexes(self) -> None:
        """Creates unique index on user_id to ensure single preference record per user."""
        if self.collection is not None:
            try:
                await self.collection.create_index("user_id", unique=True)
                logger.info("MongoDB unique index on 'user_preferences.user_id' created successfully.")
            except Exception as exc:
                logger.warning(f"Could not create unique index on user_preferences: {exc}")

    async def get_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Retrieves preference record for a given user ID."""
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            doc = await self.collection.find_one({"user_id": clean_uid})
            return UserPreferences.from_mongo(doc) if doc else None

        # In-memory fallback
        for doc in self._in_memory_preferences.values():
            if doc.get("user_id") == clean_uid:
                return UserPreferences.from_mongo(doc)
        return None

    async def get_or_create_default(self, user_id: str) -> UserPreferences:
        """Retrieves existing preferences, or persists and returns default preferences if none exist."""
        existing = await self.get_preferences(user_id)
        if existing:
            return existing

        now = datetime.now(timezone.utc)
        clean_uid = str(user_id).strip()
        doc = {
            "user_id": clean_uid,
            "theme": DEFAULT_THEME,
            "language": DEFAULT_LANGUAGE,
            "default_map_center": list(DEFAULT_MAP_CENTER),
            "default_map_zoom": DEFAULT_MAP_ZOOM,
            "preferred_units": dict(DEFAULT_PREFERRED_UNITS),
            "created_at": now,
            "updated_at": now,
        }

        if self.collection is not None:
            result = await self.collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return UserPreferences.from_mongo(doc)

        # In-memory fallback
        doc_id = str(ObjectId())
        doc_to_store = dict(doc)
        doc_to_store["_id"] = doc_id
        self._in_memory_preferences[doc_id] = doc_to_store
        return UserPreferences.from_mongo(doc_to_store)

    async def upsert_preferences(
        self,
        user_id: str,
        theme: Optional[str] = None,
        language: Optional[str] = None,
        default_map_center: Optional[list] = None,
        default_map_zoom: Optional[int] = None,
        preferred_units: Optional[dict] = None,
    ) -> UserPreferences:
        """Updates preference fields for a user, creating defaults first if record does not yet exist."""
        # Ensure base record exists
        await self.get_or_create_default(user_id)

        clean_uid = str(user_id).strip()
        now = datetime.now(timezone.utc)

        update_fields: Dict[str, Any] = {"updated_at": now}
        if theme is not None:
            update_fields["theme"] = theme
        if language is not None:
            update_fields["language"] = language
        if default_map_center is not None:
            update_fields["default_map_center"] = default_map_center
        if default_map_zoom is not None:
            update_fields["default_map_zoom"] = default_map_zoom
        if preferred_units is not None:
            update_fields["preferred_units"] = preferred_units

        if self.collection is not None:
            await self.collection.update_one({"user_id": clean_uid}, {"$set": update_fields})
            doc = await self.collection.find_one({"user_id": clean_uid})
            return UserPreferences.from_mongo(doc)

        # In-memory fallback
        for doc in self._in_memory_preferences.values():
            if doc.get("user_id") == clean_uid:
                doc.update(update_fields)
                return UserPreferences.from_mongo(doc)

        # Fallback if not found (should not happen due to get_or_create_default)
        doc_id = str(ObjectId())
        doc_to_store = {
            "_id": doc_id,
            "user_id": clean_uid,
            "theme": theme or DEFAULT_THEME,
            "language": language or DEFAULT_LANGUAGE,
            "default_map_center": default_map_center or list(DEFAULT_MAP_CENTER),
            "default_map_zoom": default_map_zoom or DEFAULT_MAP_ZOOM,
            "preferred_units": preferred_units or dict(DEFAULT_PREFERRED_UNITS),
            "created_at": now,
            "updated_at": now,
        }
        self._in_memory_preferences[doc_id] = doc_to_store
        return UserPreferences.from_mongo(doc_to_store)
