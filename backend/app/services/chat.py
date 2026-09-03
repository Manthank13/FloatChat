from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from app.db.repositories.chat_message import ChatMessageRepository
from app.db.repositories.chat_session import ChatSessionRepository
from app.models.chat import (
    ChatMessageCreate,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
)


class ChatService:
    """Service handling chat sessions and messages business logic and ownership enforcement."""

    def __init__(
        self,
        session_repo: Optional[ChatSessionRepository] = None,
        message_repo: Optional[ChatMessageRepository] = None,
    ):
        self.session_repo = session_repo or ChatSessionRepository()
        self.message_repo = message_repo or ChatMessageRepository()

    async def create_session(
        self,
        user_id: str,
        data: ChatSessionCreate,
    ) -> ChatSessionResponse:
        """Creates a new chat session for authenticated user."""
        session = await self.session_repo.create_session(
            user_id=user_id,
            title=data.title,
        )
        return ChatSessionResponse(
            id=session.id,
            user_id=session.user_id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            last_message_at=session.last_message_at,
            is_archived=session.is_archived,
        )

    async def get_session(
        self,
        session_id: str,
        user_id: str,
    ) -> ChatSessionResponse:
        """Retrieves session ensuring caller ownership."""
        session = await self.session_repo.get_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )
        return ChatSessionResponse(
            id=session.id,
            user_id=session.user_id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            last_message_at=session.last_message_at,
            is_archived=session.is_archived,
        )

    async def list_sessions(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        is_archived: Optional[bool] = None,
    ) -> ChatSessionListResponse:
        """Lists sessions for caller with pagination."""
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

        sessions, total = await self.session_repo.list_sessions(
            user_id=user_id,
            page=page,
            page_size=page_size,
            is_archived=is_archived,
        )

        items = [
            ChatSessionResponse(
                id=s.id,
                user_id=s.user_id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                last_message_at=s.last_message_at,
                is_archived=s.is_archived,
            )
            for s in sessions
        ]

        has_more = (page * page_size) < total

        return ChatSessionListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=has_more,
        )

    async def update_session(
        self,
        session_id: str,
        user_id: str,
        data: ChatSessionUpdate,
    ) -> ChatSessionResponse:
        """Updates safe fields of caller's session."""
        session = await self.session_repo.update_session(
            session_id=session_id,
            user_id=user_id,
            title=data.title,
            is_archived=data.is_archived,
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )
        return ChatSessionResponse(
            id=session.id,
            user_id=session.user_id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            last_message_at=session.last_message_at,
            is_archived=session.is_archived,
        )

    async def delete_session(
        self,
        session_id: str,
        user_id: str,
    ) -> dict:
        """Deletes session and cascade-deletes associated messages."""
        session = await self.session_repo.get_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        # Delete session
        deleted = await self.session_repo.delete_session(session_id=session_id, user_id=user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        # Cascade delete associated messages
        deleted_msgs = await self.message_repo.delete_messages_by_session(session_id=session_id, user_id=user_id)

        return {
            "status": "deleted",
            "id": session_id,
            "deleted_messages_count": deleted_msgs,
        }

    async def create_message(
        self,
        session_id: str,
        user_id: str,
        data: ChatMessageCreate,
    ) -> ChatMessageResponse:
        """Adds a message to a session after verifying ownership."""
        session = await self.session_repo.get_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        now = datetime.now(timezone.utc)
        message = await self.message_repo.create_message(
            session_id=session_id,
            user_id=user_id,
            role=data.role,
            content=data.content,
            metadata=data.metadata,
        )

        # Update session activity timestamp
        await self.session_repo.update_last_message_at(
            session_id=session_id,
            user_id=user_id,
            timestamp=now,
        )

        return ChatMessageResponse(
            id=message.id,
            session_id=message.session_id,
            user_id=message.user_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
            metadata=message.metadata,
        )

    async def list_messages(
        self,
        session_id: str,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> ChatMessageListResponse:
        """Lists messages for a session in chronological order with ownership verification."""
        session = await self.session_repo.get_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

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

        messages, total = await self.message_repo.list_messages(
            session_id=session_id,
            user_id=user_id,
            page=page,
            page_size=page_size,
        )

        items = [
            ChatMessageResponse(
                id=m.id,
                session_id=m.session_id,
                user_id=m.user_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
                metadata=m.metadata,
            )
            for m in messages
        ]

        has_more = (page * page_size) < total

        return ChatMessageListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=has_more,
        )
