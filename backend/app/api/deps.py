from typing import Any, Dict, Optional
from fastapi import Header, Request
from app.core.config import settings
from app.core.logging import logger


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, description="Future Supabase Bearer Token (Authorization: Bearer <JWT>)"),
    request: Optional[Request] = None,
) -> Optional[Dict[str, Any]]:
    """Authentication Readiness Dependency Hook (Future Supabase Integration).

    =============================================================================
    FUTURE SUPABASE AUTHENTICATION ARCHITECTURE DESIGN:
    =============================================================================
    1. Client (Frontend) authenticates with Supabase Auth (OAuth/Email/MagicLink).
    2. Client sends HTTP requests to FastAPI backend with standard Authorization header:
       `Authorization: Bearer <supabase_jwt_access_token>`
    3. In Stage 6 (Auth), this dependency function will decode & verify the JWT:
       - Validate JWT signature using `settings.SUPABASE_JWT_SECRET` or Supabase JWKS.
       - Extract user identity claims (`sub`, `email`, `role`, `user_metadata`).
       - Query user profile if required or attach `User` domain model to request.
    4. Current Stage 5 Behavior:
       - Returns `None` or anonymous context if no token is provided.
       - Does NOT enforce mandatory authentication on development endpoints.
       - Does NOT mock fake user credentials.
    =============================================================================
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1].strip()
    req_id = getattr(request.state, "request_id", "N/A") if request else "N/A"

    logger.debug(f"[{req_id}] Auth header present. Supabase JWT token received (length={len(token)}). Verification deferred to Stage 6.")

    # Stub return for current development stage (returns raw token context without mock claims)
    return {
        "status": "unverified_token_present",
        "token_snippet": f"{token[:10]}...",
        "environment": settings.ENVIRONMENT,
    }
