import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, Kinesiologo
from app.models.payment import Payment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.notification import NotificationService


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
        query = select(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.kinesiologo).joinedload(Kinesiologo.user)
        )

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

        query = query.order_by(Appointment.date.desc())
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

        # Check for time conflicts
        conflict_result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.kinesiologo_id == appointment_data.kinesiologo_id,
                    Appointment.date == appointment_data.date,
                    Appointment.status.in_([AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value])
                )
            )
        )
        conflicting_appointment = conflict_result.scalar_one_or_none()

        if conflicting_appointment:
            raise ValueError("Time slot not available")

        appointment = Appointment(
            patient_id=patient_id,
            kinesiologo_id=appointment_data.kinesiologo_id,
            date=appointment_data.date,
            duration_minutes=appointment_data.duration_minutes,
            notes=appointment_data.notes,
            status=AppointmentStatus.PENDING.value
        )

        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)

        # Create payment record
        payment_amount = appointment_data.amount if getattr(appointment_data, 'amount', None) is not None else 0.0
        payment = Payment(
            appointment_id=appointment.id,
            amount=payment_amount,
            status="pending" if payment_amount > 0 else "completed" # if 0, nothing to pay
        )
        self.db.add(payment)
        await self.db.commit()

        # Send confirmation email (async)
        patient_result = await self.db.execute(select(User).where(User.id == patient_id))
        patient = patient_result.scalar_one_or_none()
        if patient:
            # Use NotificationService to create and send notification
            notif_service = NotificationService(self.db)
            await notif_service.send_appointment_confirmation(
                appointment=appointment,
                patient=patient,
                kinesiologo=kinesiologo.user if kinesiologo else None,
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

        old_date = appointment.date
        date_changed = False
        
        if update_data.date is not None:
            if appointment.date != update_data.date:
                appointment.date = update_data.date
                date_changed = True
        if update_data.duration_minutes is not None:
            appointment.duration_minutes = update_data.duration_minutes
        if update_data.notes is not None:
            appointment.notes = update_data.notes
        if update_data.status is not None:
            appointment.status = update_data.status.value if hasattr(update_data.status, 'value') else update_data.status
            
        # Si el turno se marca como completado o cancelado, actualizar su pago
        if appointment.status == AppointmentStatus.COMPLETED.value:
            from app.models.payment import Payment
            payment_result = await self.db.execute(select(Payment).where(Payment.appointment_id == appointment.id))
            payment = payment_result.scalar_one_or_none()
            if payment and payment.status == "pending":
                payment.status = "completed"
        elif appointment.status == AppointmentStatus.CANCELLED.value:
            from app.models.payment import Payment
            payment_result = await self.db.execute(select(Payment).where(Payment.appointment_id == appointment.id))
            payment = payment_result.scalar_one_or_none()
            if payment:
                payment.status = "refunded" if payment.status == "completed" else "cancelled"

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
        
        # If date changed, send reschedule notification
        if date_changed:
            patient_result = await self.db.execute(select(User).where(User.id == appointment.patient_id))
            patient = patient_result.scalar_one_or_none()
            kinesiologo_result = await self.db.execute(
                select(Kinesiologo).options(joinedload(Kinesiologo.user)).where(Kinesiologo.id == appointment.kinesiologo_id)
            )
            kinesiologo = kinesiologo_result.scalar_one_or_none()
            if patient and kinesiologo:
                notif_service = NotificationService(self.db)
                await notif_service.send_appointment_reschedule(
                    appointment=appointment,
                    old_date=old_date,
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
        # This would integrate with TimeSlot model, but for now return basic slots
        # Assuming 9 AM to 5 PM, 1 hour slots
        start_time = datetime.combine(date.date(), datetime.min.time().replace(hour=9))
        end_time = datetime.combine(date.date(), datetime.min.time().replace(hour=17))

        slots = []
        current = start_time
        while current < end_time:
            slots.append(current)
            current += timedelta(hours=1)

        # Remove booked slots
        booked_result = await self.db.execute(
            select(Appointment.date).where(
                and_(
                    Appointment.kinesiologo_id == kinesiologo_id,
                    Appointment.date >= start_time,
                    Appointment.date < end_time,
                    Appointment.status.in_([AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value])
                )
            )
        )
        booked_times = {row[0] for row in booked_result.all()}
        available_slots = [slot for slot in slots if slot not in booked_times]

        return available_slots