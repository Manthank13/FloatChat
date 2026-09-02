from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


ChatRole = Literal["user", "assistant", "system"]
ALLOWED_CHAT_ROLES = {"user", "assistant", "system"}


# ==============================================================================
# Domain Models (Internal representation)
# ==============================================================================

class ChatSession(BaseModel):
    """Internal domain model representing a conversation thread."""

    id: str = Field(..., description="Unique session ID string (derived from MongoDB ObjectId)")
    user_id: str = Field(..., description="ID of the owner User")
    title: str = Field(..., description="Descriptive session title")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Created UTC timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Updated UTC timestamp")
    last_message_at: Optional[datetime] = Field(None, description="Timestamp of the latest message in session")
    is_archived: bool = Field(False, description="Archive flag for inactive conversations")

    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> Optional["ChatSession"]:
        """Converts raw MongoDB document dict into ChatSession domain model."""
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)


class ChatMessage(BaseModel):
    """Internal domain model representing an individual chat message."""

    id: str = Field(..., description="Unique message ID string (derived from MongoDB ObjectId)")
    session_id: str = Field(..., description="ID of parent ChatSession")
    user_id: str = Field(..., description="ID of the message creator/owner User")
    role: ChatRole = Field(..., description="Role of message author ('user', 'assistant', 'system')")
    content: str = Field(..., description="Text content of the message")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Created UTC timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extensible JSON metadata (e.g. tool calls, filters)")

    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> Optional["ChatMessage"]:
        """Converts raw MongoDB document dict into ChatMessage domain model."""
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)


# ==============================================================================
# API Schemas (Request / Response)
# ==============================================================================

class ChatSessionCreate(BaseModel):
    """Schema for creating a new chat session."""

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Optional human-readable title. Defaults to 'New Ocean Conversation'.",
    )


class ChatSessionUpdate(BaseModel):
    """Schema for updating an existing chat session."""

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Updated session title",
    )
    is_archived: Optional[bool] = Field(
        None,
        description="Updated archive status",
    )


class ChatSessionResponse(BaseModel):
    """Public API response schema for a chat session."""

    id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="Owner User ID")
    title: str = Field(..., description="Session title")
    created_at: datetime = Field(..., description="Created UTC timestamp")
    updated_at: datetime = Field(..., description="Updated UTC timestamp")
    last_message_at: Optional[datetime] = Field(None, description="Last message UTC timestamp")
    is_archived: bool = Field(..., description="Archive status")


class ChatSessionListResponse(BaseModel):
    """Paginated response schema for listing chat sessions."""

    items: List[ChatSessionResponse] = Field(..., description="List of chat sessions")
    total: int = Field(..., description="Total count of sessions matching criteria")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of items per page")
    has_more: bool = Field(..., description="True if subsequent pages exist")


class ChatMessageCreate(BaseModel):
    """Schema for adding a new message to a chat session."""

    role: str = Field(
        ...,
        description="Role of message author: 'user', 'assistant', or 'system'",
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text content of the message",
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional structured metadata (for future AI tool-calls or filters)",
    )

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        clean_role = v.strip().lower()
        if clean_role not in ALLOWED_CHAT_ROLES:
            raise ValueError(f"Invalid message role '{v}'. Allowed roles: {sorted(ALLOWED_CHAT_ROLES)}")
        return clean_role

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty or whitespace only.")
        return v.strip()


class ChatMessageResponse(BaseModel):
    """Public API response schema for an individual chat message."""

    id: str = Field(..., description="Message identifier")
    session_id: str = Field(..., description="Parent session ID")
    user_id: str = Field(..., description="Author User ID")
    role: str = Field(..., description="Role ('user', 'assistant', 'system')")
    content: str = Field(..., description="Message text content")
    created_at: datetime = Field(..., description="Created UTC timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata dictionary")


class ChatMessageListResponse(BaseModel):
    """Paginated response schema for listing messages in a session."""

    items: List[ChatMessageResponse] = Field(..., description="Chronological list of chat messages")
    total: int = Field(..., description="Total messages in session")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    has_more: bool = Field(..., description="True if more messages exist")
