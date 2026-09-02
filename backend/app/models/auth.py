from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    """Schema for user registration request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User plaintext password (min 8 characters)")
    display_name: str = Field(..., min_length=2, max_length=50, description="User display name")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class UserLogin(BaseModel):
    """Schema for user login request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """Schema for returning public user profile information (never returns password_hash)."""

    id: str = Field(..., description="Unique User ID string")
    email: EmailStr = Field(..., description="Normalized user email")
    display_name: str = Field(..., description="User display name")
    is_active: bool = Field(True, description="Account active status")
    created_at: datetime = Field(..., description="Creation UTC timestamp")


class AuthTokenResponse(BaseModel):
    """Schema for authentication token response on login/register."""

    access_token: str = Field(..., description="Signed JWT access token")
    token_type: str = Field("bearer", description="Token type identifier")
    user: UserResponse = Field(..., description="Authenticated user profile")
