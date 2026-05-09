# Import all models here for Alembic and schema sync (Base.metadata.create_all).
from app.models.user import User, Kinesiologo
from app.models.appointment import Appointment
from app.models.service import Service
from app.models.time_slot import TimeSlot
from app.models.notification import Notification
<<<<<<< HEAD
from app.models.exercise import Exercise

__all__ = [
    "User",
    "Kinesiologo",
    "Appointment",
    "Service",
    "TimeSlot",
    "Notification",
    "Exercise",
]
=======
from app.models.payment import Payment

__all__ = ["User", "Kinesiologo", "Appointment", "Service", "TimeSlot", "Notification", "Payment"]
>>>>>>> main
