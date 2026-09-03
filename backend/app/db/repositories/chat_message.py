from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger
from app.db.session import MongoDBManager
from app.models.chat import ChatMessage, ChatRole

_UNSET = object()


class ChatMessageRepository:
    """Repository handling persistence operations for the MongoDB 'messages' collection."""

    # Class-level shared in-memory dictionary for development/testing when MongoDB is offline
    _in_memory_messages: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Any = _UNSET):
        if db is _UNSET:
            self._db = MongoDBManager.get_db()
        else:
            self._db = db

    @property
    def collection(self):
        if self._db is not None:
            return self._db["messages"]
        return None

    async def create_indexes(self) -> None:
        """Creates indexes on messages collection for fast chronological retrieval and user queries."""
        if self.collection is not None:
            try:
                await self.collection.create_index([("session_id", 1), ("created_at", 1)])
                await self.collection.create_index([("user_id", 1), ("created_at", -1)])
                logger.info("MongoDB indexes on 'messages' created successfully.")
            except Exception as exc:
                logger.warning(f"Could not create indexes on messages: {exc}")

    async def create_message(
        self,
        session_id: str,
        user_id: str,
        role: ChatRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """Creates and stores a new message within a session."""
        now = datetime.now(timezone.utc)
        doc = {
            "session_id": str(session_id).strip(),
            "user_id": str(user_id).strip(),
            "role": role,
            "content": content,
            "created_at": now,
            "metadata": metadata or {},
        }

        if self.collection is not None:
            result = await self.collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return ChatMessage.from_mongo(doc)

        # In-memory fallback
        doc_id = str(ObjectId())
        doc_to_store = dict(doc)
        doc_to_store["_id"] = doc_id
        self._in_memory_messages[doc_id] = doc_to_store
        return ChatMessage.from_mongo(doc_to_store)

    async def list_messages(
        self,
        session_id: str,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[ChatMessage], int]:
        """Lists messages for a given session in chronological order (oldest first)."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()
        skip = (page - 1) * page_size

        if self.collection is not None:
            filter_query = {
                "session_id": clean_sid,
                "user_id": clean_uid,
            }
            total = await self.collection.count_documents(filter_query)
            cursor = self.collection.find(filter_query).sort("created_at", 1).skip(skip).limit(page_size)
            docs = await cursor.to_list(length=page_size)
            messages = [ChatMessage.from_mongo(d) for d in docs if d]
            return messages, total

        # In-memory fallback
        matching = [
            doc for doc in self._in_memory_messages.values()
            if doc.get("session_id") == clean_sid and doc.get("user_id") == clean_uid
        ]
        matching.sort(key=lambda x: x.get("created_at", datetime.min))
        total = len(matching)
        paginated_docs = matching[skip : skip + page_size]
        messages = [ChatMessage.from_mongo(d) for d in paginated_docs]
        return messages, total

    async def delete_messages_by_session(
        self,
        session_id: str,
        user_id: str,
    ) -> int:
        """Cascade deletes all messages belonging to a given session and user. Returns count deleted."""
        clean_sid = str(session_id).strip()
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            filter_query = {
                "session_id": clean_sid,
                "user_id": clean_uid,
            }
            result = await self.collection.delete_many(filter_query)
            return result.deleted_count

        # In-memory fallback
        to_delete = [
            msg_id for msg_id, doc in self._in_memory_messages.items()
            if doc.get("session_id") == clean_sid and doc.get("user_id") == clean_uid
        ]
        for msg_id in to_delete:
            del self._in_memory_messages[msg_id]
        return len(to_delete)
