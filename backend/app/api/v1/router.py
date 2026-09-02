from fastapi import APIRouter
from app.api.v1.endpoints import argo, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(argo.router, prefix="/argo", tags=["Argo Ocean Data"])
