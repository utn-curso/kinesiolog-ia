from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, appointments, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])