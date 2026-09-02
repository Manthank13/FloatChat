from typing import Optional
from fastapi import HTTPException, status
from app.db.repositories.saved_query import SavedQueryRepository
from app.models.saved_query import (
    SavedQueryCreate,
    SavedQueryListResponse,
    SavedQueryResponse,
    SavedQueryUpdate,
)


class SavedQueryService:
    """Service handling saved oceanographic queries business logic and ownership enforcement."""

    def __init__(self, query_repo: Optional[SavedQueryRepository] = None):
        self.query_repo = query_repo or SavedQueryRepository()

    async def create_query(
        self,
        user_id: str,
        data: SavedQueryCreate,
    ) -> SavedQueryResponse:
        """Stores a new saved query for the authenticated user."""
        # Convert Pydantic ObservationQuery to clean dictionary
        query_dict = data.query.model_dump(exclude_none=True)

        record = await self.query_repo.create_query(
            user_id=user_id,
            name=data.name,
            description=data.description,
            query=query_dict,
        )

        return SavedQueryResponse(
            id=record.id,
            user_id=record.user_id,
            name=record.name,
            description=record.description,
            query=record.query,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    async def get_query(
        self,
        query_id: str,
        user_id: str,
    ) -> SavedQueryResponse:
        """Retrieves a saved query ensuring caller ownership."""
        record = await self.query_repo.get_query(query_id=query_id, user_id=user_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved query not found.",
            )
        return SavedQueryResponse(
            id=record.id,
            user_id=record.user_id,
            name=record.name,
            description=record.description,
            query=record.query,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    async def list_queries(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> SavedQueryListResponse:
        """Lists saved queries for caller with pagination."""
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="page must be >= 1",
            )
        if not (1 <= page_size <= 100):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="page_size must be between 1 and 100",
            )

        records, total = await self.query_repo.list_queries(
            user_id=user_id,
            page=page,
            page_size=page_size,
        )

        items = [
            SavedQueryResponse(
                id=q.id,
                user_id=q.user_id,
                name=q.name,
                description=q.description,
                query=q.query,
                created_at=q.created_at,
                updated_at=q.updated_at,
            )
            for q in records
        ]

        has_more = (page * page_size) < total

        return SavedQueryListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=has_more,
        )

    async def update_query(
        self,
        query_id: str,
        user_id: str,
        data: SavedQueryUpdate,
    ) -> SavedQueryResponse:
        """Updates safe fields of a saved query for caller."""
        query_dict = data.query.model_dump(exclude_none=True) if data.query is not None else None

        record = await self.query_repo.update_query(
            query_id=query_id,
            user_id=user_id,
            name=data.name,
            description=data.description,
            query=query_dict,
        )
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved query not found.",
            )

        return SavedQueryResponse(
            id=record.id,
            user_id=record.user_id,
            name=record.name,
            description=record.description,
            query=record.query,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    async def delete_query(
        self,
        query_id: str,
        user_id: str,
    ) -> dict:
        """Deletes a saved query owned by caller."""
        deleted = await self.query_repo.delete_query(query_id=query_id, user_id=user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved query not found.",
            )
        return {
            "status": "deleted",
            "id": query_id,
        }
