from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from enum import Enum

from .user import User, Kinesiologo


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class AppointmentBase(BaseModel):
    date: datetime
    duration_minutes: Optional[int] = 60
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    kinesiologo_id: int


class AppointmentUpdate(BaseModel):
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class Appointment(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    kinesiologo_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class AppointmentOut(AppointmentBase):
    """Response model for appointments without nested relations to avoid
    lazy-loading issues during serialization.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    kinesiologo_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None