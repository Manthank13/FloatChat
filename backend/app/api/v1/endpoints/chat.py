from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import get_current_user
from app.models.auth import UserResponse
from app.models.chat import (
    ChatMessageCreate,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
)
from app.services.chat import ChatService

router = APIRouter()


def get_chat_service() -> ChatService:
    """Dependency helper providing ChatService instance."""
    return ChatService()


# ==============================================================================
# Chat Session Endpoints
# ==============================================================================

@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Chat Session",
    description="Creates a new conversation thread for the currently authenticated user.",
)
async def create_session(
    data: Optional[ChatSessionCreate] = None,
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionResponse:
    payload = data or ChatSessionCreate()
    return await service.create_session(user_id=current_user.id, data=payload)


@router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Chat Sessions",
    description="Returns paginated chat sessions owned by the authenticated user, ordered newest first.",
)
async def list_sessions(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    is_archived: Optional[bool] = Query(None, description="Filter by archive status"),
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionListResponse:
    return await service.list_sessions(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        is_archived=is_archived,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Chat Session",
    description="Retrieves a specific chat session by ID. Returns 404 if not found or owned by another user.",
)
async def get_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionResponse:
    return await service.get_session(session_id=session_id, user_id=current_user.id)


@router.patch(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Chat Session",
    description="Updates safe fields (title, archive status) of an existing chat session owned by caller.",
)
async def update_session(
    session_id: str,
    data: ChatSessionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionResponse:
    return await service.update_session(
        session_id=session_id,
        user_id=current_user.id,
        data=data,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Chat Session",
    description="Deletes a chat session and cascade-deletes all associated messages for the authenticated owner.",
)
async def delete_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> dict:
    return await service.delete_session(session_id=session_id, user_id=current_user.id)


# ==============================================================================
# Chat Message Endpoints
# ==============================================================================

@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Message to Session",
    description="Appends a new message to a chat session. Validates caller ownership and updates session activity timestamps.",
)
async def create_message(
    session_id: str,
    data: ChatMessageCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatMessageResponse:
    return await service.create_message(
        session_id=session_id,
        user_id=current_user.id,
        data=data,
    )


@router.get(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Session Messages",
    description="Returns messages in a chat session chronologically with pagination. Enforces session ownership.",
)
async def list_messages(
    session_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)"),
    current_user: UserResponse = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ChatMessageListResponse:
    return await service.list_messages(
        session_id=session_id,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
