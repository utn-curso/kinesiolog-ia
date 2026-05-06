from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from app.config import settings
from app.database import engine, create_tables
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events"""
    # Startup
    logger.info("Starting KineMov API...")

    # Create tables (ensure all models are imported)
    from app.models import user, appointment, notification, exercise, report
    await create_tables()

    # Start background reminder loop
    import asyncio
    from datetime import datetime, timedelta, timezone

    async def _reminder_loop():
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.database import async_session
        from app.models.appointment import Appointment, AppointmentStatus
        from app.models.notification import Notification
        from app.models.user import User, Kinesiologo
        from app.services.notification import NotificationService

        while True:
            try:
                async with async_session() as session:
                    now = datetime.now(timezone.utc)
                    window_start = now + timedelta(hours=23)
                    window_end = now + timedelta(hours=25)

                    result = await session.execute(
                        select(Appointment).where(
                            Appointment.date >= window_start,
                            Appointment.date <= window_end,
                            Appointment.status == AppointmentStatus.CONFIRMED.value
                        )
                    )
                    upcoming = result.scalars().all()

                    for appt in upcoming:
                        # Skip if a reminder notification already exists
                        existing = await session.execute(
                            select(Notification).where(Notification.appointment_id == appt.id, Notification.type == "reminder")
                        )
                        if existing.scalar_one_or_none():
                            continue

                        # Fetch related user and kinesiologo
                        patient_res = await session.execute(select(User).where(User.id == appt.patient_id))
                        patient = patient_res.scalar_one_or_none()
                        kin_res = await session.execute(
                            select(Kinesiologo).options(joinedload(Kinesiologo.user)).where(Kinesiologo.id == appt.kinesiologo_id)
                        )
                        kin = kin_res.scalar_one_or_none()

                        if patient and kin and kin.user:
                            service = NotificationService(session)
                            try:
                                await service.send_appointment_reminder(appt, patient, kin.user)
                            except Exception:
                                logger.exception("Failed to send reminder for appointment %s", appt.id)

            except Exception:
                logger.exception("Reminder loop error")

            await asyncio.sleep(3600)

    try:
        asyncio.create_task(_reminder_loop())
    except Exception:
        logger.exception("Failed to start reminder loop")

    logger.info("Database tables created/verified")

    yield

    # Shutdown
    logger.info("Shutting down KineMov API...")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="KineMov API",
    description="API para plataforma de gestión de turnos de kinesiología",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "KineMov API"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level="info",
    )