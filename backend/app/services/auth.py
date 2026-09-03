from typing import Optional
from app.core.logging import logger
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.repositories.user import UserRepository
from app.models.auth import AuthTokenResponse, UserLogin, UserRegister, UserResponse
from app.models.user import User


class AuthService:
    """Service layer handling user registration, authentication, password verification, and JWT generation."""

    def __init__(self, user_repo: Optional[UserRepository] = None):
        self.user_repo = user_repo or UserRepository()

    async def register_user(self, data: UserRegister) -> AuthTokenResponse:
        """Registers a new user account."""
        norm_email = data.email.strip().lower()
        logger.info(f"Processing registration request for email: {norm_email}")

        existing = await self.user_repo.find_by_email(norm_email)
        if existing:
            raise ValueError(f"Email '{norm_email}' is already registered.")

        # Hash password securely using Argon2
        pwd_hash = get_password_hash(data.password)

        user = await self.user_repo.create_user(
            email=norm_email,
            password_hash=pwd_hash,
            display_name=data.display_name,
        )

        token = create_access_token(subject=user.id)
        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

        return AuthTokenResponse(access_token=token, token_type="bearer", user=user_resp)

    async def login_user(self, data: UserLogin) -> AuthTokenResponse:
        """Authenticates user credentials and issues a JWT access token."""
        norm_email = data.email.strip().lower()

        user = await self.user_repo.find_by_email(norm_email)
        if not user:
            # Generic error to prevent user enumeration
            raise ValueError("Invalid email or password.")

        if not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("User account is inactive.")

        token = create_access_token(subject=user.id)
        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

        return AuthTokenResponse(access_token=token, token_type="bearer", user=user_resp)

    async def get_user_profile(self, user_id: str) -> UserResponse:
        """Retrieves user profile for authenticated user ID."""
        user = await self.user_repo.find_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive.")

        return UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )
