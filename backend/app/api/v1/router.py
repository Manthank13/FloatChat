from fastapi import APIRouter
from app.api.v1.endpoints import analysis, argo, auth, chat, health, preferences, query, saved_queries

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["User Authentication"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat & Conversations"])
api_router.include_router(saved_queries.router, prefix="/saved-queries", tags=["Saved Ocean Queries"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["User Preferences"])
api_router.include_router(argo.router, prefix="/argo", tags=["Argo Ocean Data"])
api_router.include_router(query.router, tags=["Oceanographic Query Engine"])
api_router.include_router(analysis.router, tags=["Scientific Analysis Engine"])
