from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.core.logging import logger


def _get_request_id(request: Request) -> str:
    """Safely retrieves correlation request ID from request state."""
    return getattr(request.state, "request_id", "N/A")


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Custom handler for HTTP exceptions returning standardized error JSON."""
    req_id = _get_request_id(request)
    logger.warning(f"[{req_id}] HTTP exception on {request.method} {request.url.path}: {exc.detail}")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "path": str(request.url.path),
                "request_id": req_id,
            }
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Custom handler for Pydantic RequestValidationErrors returning clean JSON without internal implementation leakage."""
    req_id = _get_request_id(request)
    logger.warning(f"[{req_id}] Validation error on {request.method} {request.url.path}: {exc.errors()}")

    # Simplify validation error messages for client output
    simplified_errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        simplified_errors.append({"field": field, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": 422,
                "message": "Input validation failed.",
                "path": str(request.url.path),
                "request_id": req_id,
                "details": simplified_errors,
            }
        },
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Unhandled exception handler to prevent internal server crashes from leaking tracebacks in production."""
    req_id = _get_request_id(request)
    logger.error(f"[{req_id}] Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)

    # In production, mask internal server error message
    error_msg = "Internal server error occurred." if settings.is_production() else str(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": error_msg,
                "path": str(request.url.path),
                "request_id": req_id,
            }
        },
    )
