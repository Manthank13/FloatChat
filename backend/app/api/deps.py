from typing import Optional
import jwt
from fastapi import Header, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.core.security import decode_access_token
from app.db.repositories.user import UserRepository
from app.models.auth import UserResponse


def get_user_repository() -> UserRepository:
    """Dependency helper returning active UserRepository instance."""
    return UserRepository()


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer JWT Access Token (Authorization: Bearer <token>)"),
) -> UserResponse:
    """FastAPI dependency validating Bearer JWT and returning the current authenticated UserResponse.

    Raises HTTP 401 Unauthorized on missing, expired, or malformed credentials.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected format: 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split("Bearer ")[1].strip()

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: invalid token subject.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_repo = UserRepository()
    user = await user_repo.find_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, description="Optional Bearer JWT Token"),
) -> Optional[UserResponse]:
    """Optional authentication dependency returning UserResponse if valid token present, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user(authorization=authorization)
    except HTTPException:
        return None
