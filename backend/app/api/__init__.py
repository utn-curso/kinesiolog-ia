from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, appointments, notifications, exercises, time_slots

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(time_slots.router, prefix="/time-slots", tags=["time_slots"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["exercises"])