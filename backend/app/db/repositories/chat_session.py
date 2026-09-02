from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger
from app.db.session import MongoDBManager
from app.models.chat import ChatSession

_UNSET = object()


class ChatSessionRepository:
    """Repository handling persistence operations for the MongoDB 'chat_sessions' collection."""

    # Class-level shared in-memory dictionary for development/testing when MongoDB is offline
    _in_memory_sessions: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Any = _UNSET):
        if db is _UNSET:
            self._db = MongoDBManager.get_db()
        else:
            self._db = db

    @property
    def collection(self):
        if self._db is not None:
            return self._db["chat_sessions"]
        return None

    async def create_indexes(self) -> None:
        """Creates compound indexes on chat_sessions for efficient per-user queries."""
        if self.collection is not None:
            try:
                await self.collection.create_index([("user_id", 1), ("updated_at", -1)])
                await self.collection.create_index([("user_id", 1), ("is_archived", 1), ("updated_at", -1)])
                logger.info("MongoDB indexes on 'chat_sessions' created successfully.")
            except Exception as exc:
                logger.warning(f"Could not create indexes on chat_sessions: {exc}")

    async def create_session(
        self,
        user_id: str,
        title: Optional[str] = None,
    ) -> ChatSession:
        """Creates and stores a new ChatSession record."""
        now = datetime.now(timezone.utc)
        clean_title = title.strip() if title and title.strip() else "New Ocean Conversation"

        doc = {
            "user_id": str(user_id).strip(),
            "title": clean_title,
            "created_at": now,
            "updated_at": now,
            "last_message_at": None,
            "is_archived": False,
        }

        if self.collection is not None:
            result = await self.collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return ChatSession.from_mongo(doc)

        # In-memory fallback
        doc_id = str(ObjectId())
        doc_to_store = dict(doc)
        doc_to_store["_id"] = doc_id
        self._in_memory_sessions[doc_id] = doc_to_store
        return ChatSession.from_mongo(doc_to_store)

    async def get_session(
        self,
        session_id: str,
        user_id: str,
    ) -> Optional[ChatSession]:
        """Finds session by ID, strictly enforcing user ownership."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_sid):
                query["_id"] = ObjectId(clean_sid)
            else:
                query["_id"] = clean_sid

            doc = await self.collection.find_one(query)
            return ChatSession.from_mongo(doc) if doc else None

        # In-memory fallback
        doc = self._in_memory_sessions.get(clean_sid)
        if doc and doc.get("user_id") == clean_uid:
            return ChatSession.from_mongo(doc)
        return None

    async def list_sessions(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        is_archived: Optional[bool] = None,
    ) -> Tuple[List[ChatSession], int]:
        """Lists sessions for a given user with pagination, ordered by updated_at descending."""
        clean_uid = str(user_id).strip()
        skip = (page - 1) * page_size

        if self.collection is not None:
            filter_query: Dict[str, Any] = {"user_id": clean_uid}
            if is_archived is not None:
                filter_query["is_archived"] = is_archived

            total = await self.collection.count_documents(filter_query)
            cursor = self.collection.find(filter_query).sort("updated_at", -1).skip(skip).limit(page_size)
            docs = await cursor.to_list(length=page_size)
            sessions = [ChatSession.from_mongo(d) for d in docs if d]
            return sessions, total

        # In-memory fallback
        matching = [
            doc for doc in self._in_memory_sessions.values()
            if doc.get("user_id") == clean_uid
            and (is_archived is None or doc.get("is_archived") == is_archived)
        ]
        matching.sort(key=lambda x: x.get("updated_at", datetime.min), reverse=True)
        total = len(matching)
        paginated_docs = matching[skip : skip + page_size]
        sessions = [ChatSession.from_mongo(d) for d in paginated_docs]
        return sessions, total

    async def update_session(
        self,
        session_id: str,
        user_id: str,
        title: Optional[str] = None,
        is_archived: Optional[bool] = None,
    ) -> Optional[ChatSession]:
        """Updates safe fields of a session (never allows modifying user_id)."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()
        now = datetime.now(timezone.utc)

        update_fields: Dict[str, Any] = {"updated_at": now}
        if title is not None and title.strip():
            update_fields["title"] = title.strip()
        if is_archived is not None:
            update_fields["is_archived"] = is_archived

        if self.collection is not None:
            query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_sid):
                query["_id"] = ObjectId(clean_sid)
            else:
                query["_id"] = clean_sid

            await self.collection.update_one(query, {"$set": update_fields})
            doc = await self.collection.find_one(query)
            return ChatSession.from_mongo(doc) if doc else None

        # In-memory fallback
        doc = self._in_memory_sessions.get(clean_sid)
        if doc and doc.get("user_id") == clean_uid:
            doc.update(update_fields)
            return ChatSession.from_mongo(doc)
        return None

    async def update_last_message_at(
        self,
        session_id: str,
        user_id: str,
        timestamp: datetime,
    ) -> None:
        """Updates last_message_at and updated_at timestamps for a session."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()

        update_fields = {
            "last_message_at": timestamp,
            "updated_at": timestamp,
        }

        if self.collection is not None:
            query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_sid):
                query["_id"] = ObjectId(clean_sid)
            else:
                query["_id"] = clean_sid
            await self.collection.update_one(query, {"$set": update_fields})
            return

        # In-memory fallback
        doc = self._in_memory_sessions.get(clean_sid)
        if doc and doc.get("user_id") == clean_uid:
            doc.update(update_fields)

    async def delete_session(
        self,
        session_id: str,
        user_id: str,
    ) -> bool:
        """Deletes a session owned by user_id. Returns True if deleted, False otherwise."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_sid):
                query["_id"] = ObjectId(clean_sid)
            else:
                query["_id"] = clean_sid

            result = await self.collection.delete_one(query)
            return result.deleted_count > 0

        # In-memory fallback
        doc = self._in_memory_sessions.get(clean_sid)
        if doc and doc.get("user_id") == clean_uid:
            del self._in_memory_sessions[clean_sid]
            return True
        return False
