from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.frontend import router as frontend_router
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from fastapi.openapi.docs import get_swagger_ui_html
from app.core.logging import logger
from app.db.repositories.chat_message import ChatMessageRepository
from app.db.repositories.chat_session import ChatSessionRepository
from app.db.repositories.saved_query import SavedQueryRepository
from app.db.repositories.user import UserRepository
from app.db.repositories.user_preferences import UserPreferencesRepository
from app.db.session import MongoDBManager
from app.middleware.request_id import RequestIDMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # Initialize MongoDB connection if MONGODB_URI configured
    try:
        await MongoDBManager.connect()
        await UserRepository().create_indexes()
        await ChatSessionRepository().create_indexes()
        await ChatMessageRepository().create_indexes()
        await SavedQueryRepository().create_indexes()
        await UserPreferencesRepository().create_indexes()
    except Exception as exc:
        logger.warning(f"MongoDB startup connection warning: {exc}")

    yield

    # Teardown MongoDB client connection
    try:
        await MongoDBManager.disconnect()
    except Exception as exc:
        logger.warning(f"MongoDB shutdown disconnect error: {exc}")

    logger.info(f"Shutting down {settings.PROJECT_NAME}")


def create_application() -> FastAPI:
    """Application factory for FastAPI instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Register Correlation ID Middleware
    app.add_middleware(RequestIDMiddleware)

    # Configure CORS
    if settings.CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["X-Request-ID"],
        )

    # Register Exception Handlers
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # Include API Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)
    app.include_router(frontend_router, prefix="/api", tags=["Frontend Product Contract"])

    @app.get("/docs", include_in_schema=False)
    async def get_swagger_docs():
        return get_swagger_ui_html(openapi_url=f"{settings.API_V1_STR}/openapi.json", title=settings.PROJECT_NAME)

    @app.get("/openapi.json", include_in_schema=False)
    async def get_root_openapi():
        return app.openapi()

    return app


app = create_application()
