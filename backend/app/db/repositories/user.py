import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger
from app.db.session import MongoDBManager
from app.models.user import User

_UNSET = object()


class UserRepository:
    """Repository handling persistence operations for the MongoDB 'users' collection."""

    # Class-level shared in-memory dictionary for development/testing when MONGODB_URI is unconfigured
    _in_memory_users: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Any = _UNSET):
        if db is _UNSET:
            self._db = MongoDBManager.get_db()
        else:
            self._db = db

    @property
    def collection(self):
        if self._db is not None:
            return self._db["users"]
        return None

    async def create_indexes(self) -> None:
        """Creates unique index on email field in MongoDB users collection."""
        if self.collection is not None:
            try:
                await self.collection.create_index("email", unique=True)
                logger.info("MongoDB unique index on users.email created successfully.")
            except Exception as exc:
                logger.warning(f"Could not create unique index on users.email: {exc}")

    async def find_by_email(self, email: str) -> Optional[User]:
        """Finds user by normalized email address."""
        norm_email = email.strip().lower()
        if self.collection is not None:
            doc = await self.collection.find_one({"email": norm_email})
            return User.from_mongo(doc) if doc else None

        # Fallback to in-memory store
        for doc in self._in_memory_users.values():
            if doc.get("email") == norm_email:
                return User.from_mongo(doc)
        return None

    async def find_by_id(self, user_id: str) -> Optional[User]:
        """Finds user by string user ID."""
        clean_id = str(user_id).strip()
        if self.collection is not None:
            doc = None
            if ObjectId.is_valid(clean_id):
                doc = await self.collection.find_one({"_id": ObjectId(clean_id)})
            if not doc:
                doc = await self.collection.find_one({"_id": clean_id})
            return User.from_mongo(doc) if doc else None

        # Fallback to in-memory store
        doc = self._in_memory_users.get(clean_id)
        return User.from_mongo(doc) if doc else None

    async def create_user(
        self,
        email: str,
        password_hash: str,
        display_name: str,
    ) -> User:
        """Creates and stores a new User record."""
        norm_email = email.strip().lower()
        now = datetime.now(timezone.utc)

        doc = {
            "email": norm_email,
            "password_hash": password_hash,
            "display_name": display_name.strip(),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        if self.collection is not None:
            # Check duplicate email
            existing = await self.collection.find_one({"email": norm_email})
            if existing:
                raise ValueError(f"User with email '{norm_email}' already exists.")

            result = await self.collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return User.from_mongo(doc)

        # Fallback to in-memory store
        for existing_doc in self._in_memory_users.values():
            if existing_doc.get("email") == norm_email:
                raise ValueError(f"User with email '{norm_email}' already exists.")

        user_id = str(ObjectId())
        doc["_id"] = user_id
        self._in_memory_users[user_id] = doc
        return User.from_mongo(doc)
