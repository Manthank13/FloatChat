from fastapi import APIRouter
from app.api.v1.endpoints import analysis, argo, auth, health, query
from ai.router import router as chat_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["User Authentication"])
api_router.include_router(argo.router, prefix="/argo", tags=["Argo Ocean Data"])
api_router.include_router(query.router, tags=["Oceanographic Query Engine"])
api_router.include_router(analysis.router, tags=["Scientific Analysis Engine"])
api_router.include_router(chat_router, tags=["FloatChat AI Conversational Engine"])
