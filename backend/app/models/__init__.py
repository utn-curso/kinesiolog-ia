# Import all models here for Alembic
from app.models.user import User, Kinesiologo
from app.models.appointment import Appointment
from app.models.service import Service
from app.models.time_slot import TimeSlot
from app.models.notification import Notification

__all__ = ["User", "Kinesiologo", "Appointment", "Service", "TimeSlot", "Notification"]