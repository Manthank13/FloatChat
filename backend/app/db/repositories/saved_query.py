from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger
from app.db.session import MongoDBManager
from app.models.saved_query import SavedQuery

_UNSET = object()


class SavedQueryRepository:
    """Repository handling persistence operations for the MongoDB 'saved_queries' collection."""

    # Class-level shared in-memory dictionary for development/testing when MongoDB is offline
    _in_memory_queries: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Any = _UNSET):
        if db is _UNSET:
            self._db = MongoDBManager.get_db()
        else:
            self._db = db

    @property
    def collection(self):
        if self._db is not None:
            return self._db["saved_queries"]
        return None

    async def create_indexes(self) -> None:
        """Creates compound index on saved_queries for fast per-user access."""
        if self.collection is not None:
            try:
                await self.collection.create_index([("user_id", 1), ("updated_at", -1)])
                logger.info("MongoDB indexes on 'saved_queries' created successfully.")
            except Exception as exc:
                logger.warning(f"Could not create indexes on saved_queries: {exc}")

    async def create_query(
        self,
        user_id: str,
        name: str,
        description: Optional[str],
        query: Dict[str, Any],
    ) -> SavedQuery:
        """Creates and stores a new SavedQuery record."""
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": str(user_id).strip(),
            "name": name.strip(),
            "description": description.strip() if description else None,
            "query": query,
            "created_at": now,
            "updated_at": now,
        }

        if self.collection is not None:
            result = await self.collection.insert_one(doc)
            doc["_id"] = result.inserted_id
            return SavedQuery.from_mongo(doc)

        # In-memory fallback
        doc_id = str(ObjectId())
        doc_to_store = dict(doc)
        doc_to_store["_id"] = doc_id
        self._in_memory_queries[doc_id] = doc_to_store
        return SavedQuery.from_mongo(doc_to_store)

    async def get_query(
        self,
        query_id: str,
        user_id: str,
    ) -> Optional[SavedQuery]:
        """Finds saved query by ID, enforcing user ownership."""
        clean_qid = str(query_id).strip()
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            filter_query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_qid):
                filter_query["_id"] = ObjectId(clean_qid)
            else:
                filter_query["_id"] = clean_qid

            doc = await self.collection.find_one(filter_query)
            return SavedQuery.from_mongo(doc) if doc else None

        # In-memory fallback
        doc = self._in_memory_queries.get(clean_qid)
        if doc and doc.get("user_id") == clean_uid:
            return SavedQuery.from_mongo(doc)
        return None

    async def list_queries(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[SavedQuery], int]:
        """Lists saved queries for a given user with pagination, ordered by updated_at descending."""
        clean_uid = str(user_id).strip()
        skip = (page - 1) * page_size

        if self.collection is not None:
            filter_query = {"user_id": clean_uid}
            total = await self.collection.count_documents(filter_query)
            cursor = self.collection.find(filter_query).sort("updated_at", -1).skip(skip).limit(page_size)
            docs = await cursor.to_list(length=page_size)
            queries = [SavedQuery.from_mongo(d) for d in docs if d]
            return queries, total

        # In-memory fallback
        matching = [
            doc for doc in self._in_memory_queries.values()
            if doc.get("user_id") == clean_uid
        ]
        matching.sort(key=lambda x: x.get("updated_at", datetime.min), reverse=True)
        total = len(matching)
        paginated_docs = matching[skip : skip + page_size]
        queries = [SavedQuery.from_mongo(d) for d in paginated_docs]
        return queries, total

    async def update_query(
        self,
        query_id: str,
        user_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        query: Optional[Dict[str, Any]] = None,
    ) -> Optional[SavedQuery]:
        """Updates safe fields of a saved query (never allows modifying user_id)."""
        clean_qid = str(query_id).strip()
        clean_uid = str(user_id).strip()
        now = datetime.now(timezone.utc)

        update_fields: Dict[str, Any] = {"updated_at": now}
        if name is not None and name.strip():
            update_fields["name"] = name.strip()
        if description is not None:
            update_fields["description"] = description.strip() if description.strip() else None
        if query is not None:
            update_fields["query"] = query

        if self.collection is not None:
            filter_query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_qid):
                filter_query["_id"] = ObjectId(clean_qid)
            else:
                filter_query["_id"] = clean_qid

            await self.collection.update_one(filter_query, {"$set": update_fields})
            doc = await self.collection.find_one(filter_query)
            return SavedQuery.from_mongo(doc) if doc else None

        # In-memory fallback
        doc = self._in_memory_queries.get(clean_qid)
        if doc and doc.get("user_id") == clean_uid:
            doc.update(update_fields)
            return SavedQuery.from_mongo(doc)
        return None

    async def delete_query(
        self,
        query_id: str,
        user_id: str,
    ) -> bool:
        """Deletes a saved query owned by user_id. Returns True if deleted, False otherwise."""
        clean_qid = str(query_id).strip()
        clean_uid = str(user_id).strip()

        if self.collection is not None:
            filter_query = {"user_id": clean_uid}
            if ObjectId.is_valid(clean_qid):
                filter_query["_id"] = ObjectId(clean_qid)
            else:
                filter_query["_id"] = clean_qid

            result = await self.collection.delete_one(filter_query)
            return result.deleted_count > 0

        # In-memory fallback
        doc = self._in_memory_queries.get(clean_qid)
        if doc and doc.get("user_id") == clean_uid:
            del self._in_memory_queries[clean_qid]
            return True
        return False
