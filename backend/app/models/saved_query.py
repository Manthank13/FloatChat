from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.query import ObservationQuery


# ==============================================================================
# Domain Models (Internal representation)
# ==============================================================================

class SavedQuery(BaseModel):
    """Internal domain model representing an oceanographic query saved by a user."""

    id: str = Field(..., description="Unique query ID string (derived from MongoDB ObjectId)")
    user_id: str = Field(..., description="Owner User ID")
    name: str = Field(..., description="Descriptive query name")
    description: Optional[str] = Field(None, description="Optional description/notes")
    query: Dict[str, Any] = Field(..., description="Structured oceanographic query parameters")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Created UTC timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Updated UTC timestamp")

    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> Optional["SavedQuery"]:
        """Converts raw MongoDB document dict into SavedQuery domain model."""
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)


# ==============================================================================
# API Schemas (Request / Response)
# ==============================================================================

class SavedQueryCreate(BaseModel):
    """Schema for saving a new oceanographic query."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Descriptive name for the saved query",
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional human-readable notes or research context",
    )
    query: ObservationQuery = Field(
        ...,
        description="Validated structured oceanographic query parameters",
    )

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Query name cannot be empty or whitespace only.")
        return clean


class SavedQueryUpdate(BaseModel):
    """Schema for updating an existing saved query."""

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated query name",
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated description/notes",
    )
    query: Optional[ObservationQuery] = Field(
        None,
        description="Updated structured oceanographic query parameters",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                raise ValueError("Query name cannot be empty or whitespace only.")
            return clean
        return v


class SavedQueryResponse(BaseModel):
    """Public API response schema for a saved query."""

    id: str = Field(..., description="Query identifier")
    user_id: str = Field(..., description="Owner User ID")
    name: str = Field(..., description="Saved query name")
    description: Optional[str] = Field(None, description="Query description or notes")
    query: Dict[str, Any] = Field(..., description="Structured oceanographic query parameters")
    created_at: datetime = Field(..., description="Created UTC timestamp")
    updated_at: datetime = Field(..., description="Updated UTC timestamp")


class SavedQueryListResponse(BaseModel):
    """Paginated response schema for listing saved queries."""

    items: List[SavedQueryResponse] = Field(..., description="List of saved queries")
    total: int = Field(..., description="Total count of saved queries matching criteria")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Items per page")
    has_more: bool = Field(..., description="True if more pages exist")
