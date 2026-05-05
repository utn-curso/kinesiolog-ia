from datetime import datetime, timedelta, time, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.time_slot import TimeSlot
from app.models.user import User, Kinesiologo
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.notification import NotificationService
from app.services.time_slot import ZONE_AR, appointment_overlaps_interval

DEFAULT_BOOKING_DURATION_MINUTES = 60
BOOKING_GRID_STEP_MINUTES = 60


def normalize_appointment_start(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(ZONE_AR).replace(tzinfo=None)
    return dt


async def appointment_fully_inside_availability(
    db: AsyncSession,
    kinesiologo_id: int,
    start_naive: datetime,
    end_naive: datetime,
) -> bool:
    day = start_naive.date()
    result = await db.execute(
        select(TimeSlot).where(
            and_(
                TimeSlot.kinesiologo_id == kinesiologo_id,
                TimeSlot.is_available.is_(True),
                TimeSlot.start_time <= day,
                TimeSlot.end_time >= day,
            )
        )
    )
    for slot in result.scalars().all():
        w_start = datetime.combine(day, slot.start_hour)
        w_end = datetime.combine(day, slot.end_hour)
        if w_start <= start_naive and end_naive <= w_end:
            return True
    return False


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_appointments(
        self,
        user_id: int,
        user_role: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[AppointmentStatus] = None
    ) -> List[Appointment]:
        query = select(Appointment)

        if user_role == "patient":
            query = query.where(Appointment.patient_id == user_id)
        elif user_role == "kinesiologo":
            # Get kinesiologo profile
            kinesiologo_result = await self.db.execute(
                select(Kinesiologo).where(Kinesiologo.user_id == user_id)
            )
            kinesiologo = kinesiologo_result.scalar_one_or_none()
            if kinesiologo:
                query = query.where(Appointment.kinesiologo_id == kinesiologo.id)
        # Admin can see all

        if status:
            query = query.where(Appointment.status == status)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_appointment(self, appointment_id: int, user_id: int, user_role: str) -> Optional[Appointment]:
        result = await self.db.execute(select(Appointment).where(Appointment.id == appointment_id))
        appointment = result.scalar_one_or_none()
        if not appointment:
            return None

        # Check permissions
        if user_role == "patient" and appointment.patient_id != user_id:
            return None
        elif user_role == "kinesiologo":
            kinesiologo_result = await self.db.execute(
                select(Kinesiologo).where(Kinesiologo.user_id == user_id)
            )
            kinesiologo = kinesiologo_result.scalar_one_or_none()
            if not kinesiologo or appointment.kinesiologo_id != kinesiologo.id:
                return None

        return appointment

    async def create_appointment(self, appointment_data: AppointmentCreate, patient_id: int) -> Appointment:
        # Check if kinesiologo exists and is available
        kinesiologo_result = await self.db.execute(
            select(Kinesiologo).options(joinedload(Kinesiologo.user)).where(Kinesiologo.id == appointment_data.kinesiologo_id)
        )
        kinesiologo = kinesiologo_result.scalar_one_or_none()
        if not kinesiologo or not kinesiologo.is_available:
            raise ValueError("Kinesiologo not available")

        duration_minutes = appointment_data.duration_minutes or DEFAULT_BOOKING_DURATION_MINUTES
        start_naive = normalize_appointment_start(appointment_data.date)
        end_naive = start_naive + timedelta(minutes=duration_minutes)

        if not await appointment_fully_inside_availability(
            self.db,
            appointment_data.kinesiologo_id,
            start_naive,
            end_naive,
        ):
            raise ValueError("Time slot not within kinesiologo's availability")

        if await appointment_overlaps_interval(
            self.db,
            appointment_data.kinesiologo_id,
            start_naive,
            end_naive,
        ):
            raise ValueError("Time slot not available")

        appointment = Appointment(
            patient_id=patient_id,
            kinesiologo_id=appointment_data.kinesiologo_id,
            date=start_naive,
            duration_minutes=duration_minutes,
            notes=appointment_data.notes,
            status=AppointmentStatus.PENDING.value
        )

        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)

        # Send confirmation email (async)
        patient_result = await self.db.execute(select(User).where(User.id == patient_id))
        patient = patient_result.scalar_one_or_none()
        if patient and kinesiologo and kinesiologo.user:
            notif_service = NotificationService(self.db)
            await notif_service.send_appointment_confirmation(
                appointment=appointment,
                patient=patient,
                kinesiologo=kinesiologo.user,
            )

        return appointment

    async def update_appointment(
        self,
        appointment_id: int,
        update_data: AppointmentUpdate,
        user_id: int,
        user_role: str
    ) -> Optional[Appointment]:
        appointment = await self.get_appointment(appointment_id, user_id, user_role)
        if not appointment:
            return None

        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(appointment, field, value)

        appointment.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(appointment)

        # If cancelled, send notification
        is_cancelled = (
            getattr(appointment, 'status', None) == AppointmentStatus.CANCELLED.value
            or (update_data.status is not None and update_data.status == AppointmentStatus.CANCELLED)
        )
        if is_cancelled:
            patient_result = await self.db.execute(select(User).where(User.id == appointment.patient_id))
            patient = patient_result.scalar_one_or_none()
            kinesiologo_result = await self.db.execute(
                select(Kinesiologo).options(joinedload(Kinesiologo.user)).where(Kinesiologo.id == appointment.kinesiologo_id)
            )
            kinesiologo = kinesiologo_result.scalar_one_or_none()
            if patient and kinesiologo and patient.phone:
                notif_service = NotificationService(self.db)
                await notif_service.send_appointment_cancellation(
                    appointment=appointment,
                    patient=patient,
                    kinesiologo=kinesiologo.user if kinesiologo else None,
                )

        return appointment

    async def delete_appointment(self, appointment_id: int, user_id: int, user_role: str) -> bool:
        appointment = await self.get_appointment(appointment_id, user_id, user_role)
        if not appointment:
            return False

        await self.db.delete(appointment)
        await self.db.commit()
        return True

    async def get_available_slots(self, kinesiologo_id: int, date: datetime) -> List[datetime]:
        day_date = date.date() if isinstance(date, datetime) else date
        day_start = datetime.combine(day_date, time.min)
        day_end = day_start + timedelta(days=1)

        ts_result = await self.db.execute(
            select(TimeSlot).where(
                and_(
                    TimeSlot.kinesiologo_id == kinesiologo_id,
                    TimeSlot.is_available.is_(True),
                    TimeSlot.start_time <= day_date,
                    TimeSlot.end_time >= day_date,
                )
            ).order_by(TimeSlot.start_time, TimeSlot.start_hour)
        )
        time_slots = ts_result.scalars().all()

        candidates: List[datetime] = []
        appt_duration = DEFAULT_BOOKING_DURATION_MINUTES
        duration_td = timedelta(minutes=appt_duration)
        step = timedelta(minutes=BOOKING_GRID_STEP_MINUTES)

        for slot in time_slots:
            slot_start = datetime.combine(day_date, slot.start_hour)
            slot_end = datetime.combine(day_date, slot.end_hour)
            t = slot_start
            while True:
                block_end = t + duration_td
                if block_end > slot_end:
                    break
                if block_end.date() != day_date or t.date() != day_date:
                    t += step
                    continue
                if t >= day_start and block_end <= day_end:
                    if not await appointment_overlaps_interval(
                        self.db,
                        kinesiologo_id,
                        t,
                        block_end,
                    ):
                        candidates.append(t)
                t += step

        return sorted(set(candidates))