from fastapi import APIRouter
from app.api.v1.endpoints import analysis, argo, health, query

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(argo.router, prefix="/argo", tags=["Argo Ocean Data"])
api_router.include_router(query.router, tags=["Oceanographic Query Engine"])
api_router.include_router(analysis.router, tags=["Scientific Analysis Engine"])
