import sys
from pathlib import Path

# Ensure project root is available for imports
_file = Path(__file__).resolve()
_root_dir = _file.parent.parent.parent.parent.parent  # FloatChat root
_backend_dir = _file.parent.parent.parent.parent       # FloatChat/backend

for _p in (str(_root_dir), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import APIRouter
from app.api.v1.endpoints import analysis, argo, auth, chat, health, preferences, query, saved_queries
from ai.router import router as ai_chat_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["User Authentication"])
api_router.include_router(ai_chat_router, tags=["FloatChat AI Conversational Engine"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat & Conversations"])
api_router.include_router(saved_queries.router, prefix="/saved-queries", tags=["Saved Ocean Queries"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["User Preferences"])
api_router.include_router(argo.router, prefix="/argo", tags=["Argo Ocean Data"])
api_router.include_router(query.router, tags=["Oceanographic Query Engine"])
api_router.include_router(analysis.router, tags=["Scientific Analysis Engine"])
