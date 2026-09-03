from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, field_validator


class User(BaseModel):
    """Internal domain model representing a FloatChat user stored in MongoDB."""

    id: str = Field(..., description="User ID string (derived from MongoDB ObjectId)")
    email: str = Field(..., description="Normalized unique email address")
    password_hash: str = Field(..., description="Argon2 hashed password")
    display_name: str = Field(..., description="User display name")
    is_active: bool = Field(True, description="Active status flag")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Created UTC timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Updated UTC timestamp")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not v or "@" not in v:
            raise ValueError("Invalid email format.")
        return v.strip().lower()

    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> "User":
        """Converts raw MongoDB document dict into User model."""
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)
