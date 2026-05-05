from datetime import date, datetime, time, timedelta
from typing import Optional, Sequence
from zoneinfo import ZoneInfo

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.time_slot import TimeSlot
from app.models.user import User, Kinesiologo
from app.schemas.time_slot import TimeSlotCreate, TimeSlotUpdate

ZONE_AR = ZoneInfo("America/Argentina/Buenos_Aires")


def _validate_interval(
    start_d: date,
    end_d: date,
    start_t: time,
    end_t: time,
) -> None:
    if end_d < start_d:
        raise ValueError("end_time must be on or after start_time")
    if end_t <= start_t:
        raise ValueError("end_hour must be after start_hour")
    delta = datetime.combine(date.min, end_t) - datetime.combine(date.min, start_t)
    if delta < timedelta(hours=1):
        raise ValueError("Duration must be at least 60 minutes")
    if delta.total_seconds() % 3600 != 0:
        raise ValueError("Duration must be a multiple of 60 minutes")


def _validate_dates_not_in_past(start_d: date, end_d: date) -> None:
    today = datetime.now(ZONE_AR).date()
    if start_d < today or end_d < today:
        raise ValueError("Dates must be today or later (Argentina time)")


def _date_ranges_overlap(a0: date, a1: date, b0: date, b1: date) -> bool:
    return a0 <= b1 and a1 >= b0


def _time_ranges_overlap(t0: time, t1: time, u0: time, u1: time) -> bool:
    return t0 < u1 and t1 > u0


def slots_calendar_overlap(a: TimeSlot, b: TimeSlot) -> bool:
    return _date_ranges_overlap(
        a.start_time,
        a.end_time,
        b.start_time,
        b.end_time,
    ) and _time_ranges_overlap(
        a.start_hour,
        a.end_hour,
        b.start_hour,
        b.end_hour,
    )


def appointment_interval_end(appt: Appointment) -> datetime:
    mins = appt.duration_minutes if appt.duration_minutes is not None else 60
    return appt.date + timedelta(minutes=mins)


async def appointment_overlaps_interval(
    db: AsyncSession,
    kinesiologo_id: int,
    start: datetime,
    end: datetime,
) -> bool:
    result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.kinesiologo_id == kinesiologo_id,
                Appointment.status.in_([AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value]),
                Appointment.date < end,
            )
        )
    )
    for appt in result.scalars().all():
        ap_end = appointment_interval_end(appt)
        if start < ap_end and end > appt.date:
            return True
    return False


async def slot_has_booked_appointments(db: AsyncSession, slot: TimeSlot) -> bool:
    d = slot.start_time
    while d <= slot.end_time:
        day_start = datetime.combine(d, slot.start_hour)
        day_end = datetime.combine(d, slot.end_hour)
        if await appointment_overlaps_interval(db, slot.kinesiologo_id, day_start, day_end):
            return True
        d += timedelta(days=1)
    return False


async def slot_overlaps_sibling_slots(
    db: AsyncSession,
    kinesiologo_id: int,
    slot: TimeSlot,
    exclude_id: Optional[int],
) -> bool:
    q = select(TimeSlot).where(TimeSlot.kinesiologo_id == kinesiologo_id)
    result = await db.execute(q)
    for other in result.scalars().all():
        if exclude_id is not None and other.id == exclude_id:
            continue
        if slots_calendar_overlap(slot, other):
            return True
    return False


async def resolve_kinesiologo_profile(db: AsyncSession, user: User) -> Optional[Kinesiologo]:
    if user.role != "kinesiologo":
        return None
    result = await db.execute(select(Kinesiologo).where(Kinesiologo.user_id == user.id))
    return result.scalar_one_or_none()


class TimeSlotService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_kinesiologo(
        self,
        kinesiologo_id: int,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> Sequence[TimeSlot]:
        q = (
            select(TimeSlot)
            .where(TimeSlot.kinesiologo_id == kinesiologo_id)
            .order_by(TimeSlot.start_time, TimeSlot.start_hour)
        )
        if from_date is not None:
            q = q.where(TimeSlot.end_time >= from_date)
        if to_date is not None:
            q = q.where(TimeSlot.start_time <= to_date)
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_owned(self, slot_id: int, kinesiologo_id: int) -> Optional[TimeSlot]:
        result = await self.db.execute(
            select(TimeSlot).where(and_(TimeSlot.id == slot_id, TimeSlot.kinesiologo_id == kinesiologo_id))
        )
        return result.scalar_one_or_none()

    async def create(self, kinesiologo_id: int, data: TimeSlotCreate) -> TimeSlot:
        _validate_interval(data.start_time, data.end_time, data.start_hour, data.end_hour)
        _validate_dates_not_in_past(data.start_time, data.end_time)

        slot = TimeSlot(
            kinesiologo_id=kinesiologo_id,
            start_time=data.start_time,
            end_time=data.end_time,
            start_hour=data.start_hour,
            end_hour=data.end_hour,
            is_available=data.is_available,
        )
        if await slot_overlaps_sibling_slots(self.db, kinesiologo_id, slot, None):
            raise ValueError("Time slot overlaps an existing availability block")

        self.db.add(slot)
        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def update(self, slot_id: int, kinesiologo_id: int, data: TimeSlotUpdate) -> Optional[TimeSlot]:
        slot = await self.get_owned(slot_id, kinesiologo_id)
        if not slot:
            return None

        if await slot_has_booked_appointments(self.db, slot):
            raise ValueError("Cannot modify a time slot that has assigned appointments")

        updates = data.model_dump(exclude_unset=True)
        start_d = updates.get("start_time", slot.start_time)
        end_d = updates.get("end_time", slot.end_time)
        start_t = updates.get("start_hour", slot.start_hour)
        end_t = updates.get("end_hour", slot.end_hour)

        if any(
            k in updates
            for k in ("start_time", "end_time", "start_hour", "end_hour")
        ):
            _validate_interval(start_d, end_d, start_t, end_t)
            _validate_dates_not_in_past(start_d, end_d)
            candidate = TimeSlot(
                kinesiologo_id=kinesiologo_id,
                start_time=start_d,
                end_time=end_d,
                start_hour=start_t,
                end_hour=end_t,
                is_available=updates.get("is_available", slot.is_available),
            )
            if await slot_overlaps_sibling_slots(self.db, kinesiologo_id, candidate, slot_id):
                raise ValueError("Time slot overlaps an existing availability block")

        if "start_time" in updates:
            slot.start_time = updates["start_time"]
        if "end_time" in updates:
            slot.end_time = updates["end_time"]
        if "start_hour" in updates:
            slot.start_hour = updates["start_hour"]
        if "end_hour" in updates:
            slot.end_hour = updates["end_hour"]
        if "is_available" in updates:
            slot.is_available = updates["is_available"]

        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def delete(self, slot_id: int, kinesiologo_id: int) -> bool:
        slot = await self.get_owned(slot_id, kinesiologo_id)
        if not slot:
            return False
        if await slot_has_booked_appointments(self.db, slot):
            raise ValueError("Cannot delete a time slot that has assigned appointments")

        await self.db.delete(slot)
        await self.db.commit()
        return True
