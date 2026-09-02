import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware attaching a unique X-Request-ID header to every incoming HTTP request and response for correlation tracking."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        # Check if client passed custom correlation ID header
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
