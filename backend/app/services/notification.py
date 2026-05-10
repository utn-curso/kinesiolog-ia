import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.notification import Notification
from app.models.appointment import Appointment
from app.models.user import User
from app.utils.email import send_email as send_email_util
from app.utils.sms import send_sms

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        notification_type: str,
        channel: str,
        message: str,
        subject: Optional[str] = None,
        appointment_id: Optional[int] = None
    ) -> Notification:
        """Crear una notificación en la cola"""
        notification = Notification(
            user_id=user_id,
            appointment_id=appointment_id,
            type=notification_type,
            channel=channel,
            subject=subject,
            message=message
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def send_appointment_confirmation(
        self,
        appointment: Appointment,
        patient: User,
        kinesiologo: User
    ) -> bool:
        """Enviar confirmación de turno"""
        subject = "Confirmación de Turno - KineMov"
        message = f"""
Hola {patient.full_name},

Tu turno ha sido confirmado:

📅 Fecha: {appointment.date.strftime('%d/%m/%Y')}
⏰ Hora: {appointment.date.strftime('%H:%M')}
👨‍⚕️ Kinesiólogo: {kinesiologo.full_name}
📝 Notas: {appointment.notes or 'Sin notas'}

Si necesitas cancelar o reprogramar, hacerlo con al menos 24 horas de anticipación.

Saludos,
Equipo KineMov
"""
        # Crear notificación
        notification = await self.create_notification(
            user_id=patient.id,
            notification_type="confirmation",
            channel="email",
            message=message,
            subject=subject,
            appointment_id=appointment.id
        )

        # Enviar inmediatamente y actualizar registro para el paciente
        success = await self._process_notification(
            notification=notification,
            email=patient.email,
            subject=subject,
            message=message,
            phone=patient.phone,
            channel="email",
        )

        # Notificar al kinesiólogo
        kine_subject = "Nuevo Turno Asignado - KineMov"
        kine_message = f"""
Hola {kinesiologo.full_name},

Se te ha asignado un nuevo turno:

📅 Fecha: {appointment.date.strftime('%d/%m/%Y')}
⏰ Hora: {appointment.date.strftime('%H:%M')}
👤 Paciente: {patient.full_name}
📝 Notas: {appointment.notes or 'Sin notas'}

Saludos,
Equipo KineMov
"""
        kine_notification = await self.create_notification(
            user_id=kinesiologo.id,
            notification_type="new_assignment",
            channel="email",
            message=kine_message,
            subject=kine_subject,
            appointment_id=appointment.id
        )
        await self._process_notification(
            notification=kine_notification,
            email=kinesiologo.email,
            subject=kine_subject,
            message=kine_message,
            phone=kinesiologo.phone,
            channel="email",
        )

        return success

    async def send_appointment_reminder(
        self,
        appointment: Appointment,
        patient: User,
        kinesiologo: User
    ) -> bool:
        """Enviar recordatorio de turno (24 horas antes)"""
        subject = "Recordatorio de Turno - KineMov"
        message = f"""
Hola {patient.full_name},

Te recordamos que tienes un turno mañana:

📅 Fecha: {appointment.date.strftime('%d/%m/%Y')}
⏰ Hora: {appointment.date.strftime('%H:%M')}
👨‍⚕️ Kinesiólogo: {kinesiologo.full_name}

Por favor, arrive 10 minutos antes.

Saludos,
Equipo KineMov
"""
        notification = await self.create_notification(
            user_id=patient.id,
            notification_type="reminder",
            channel="both",
            message=message,
            subject=subject,
            appointment_id=appointment.id
        )

        return await self._process_notification(
            notification=notification,
            email=patient.email,
            subject=subject,
            message=message,
            phone=patient.phone,
            channel="both",
        )

    async def send_appointment_cancellation(
        self,
        appointment: Appointment,
        patient: User,
        kinesiologo: User,
        reason: Optional[str] = None
    ) -> bool:
        """Enviar notificación de cancelación"""
        subject = "Turno Cancelado - KineMov"
        message = f"""
Hola {patient.full_name},

Tu turno ha sido cancelado:

📅 Fecha: {appointment.date.strftime('%d/%m/%Y')}
⏰ Hora: {appointment.date.strftime('%H:%M')}
👨‍⚕️ Kinesiólogo: {kinesiologo.full_name}
{f'Motivo: {reason}' if reason else ''}

Puedes reservar un nuevo turno desde nuestra plataforma.

Saludos,
Equipo KineMov
"""
        notification = await self.create_notification(
            user_id=patient.id,
            notification_type="cancellation",
            channel="both",
            message=message,
            subject=subject,
            appointment_id=appointment.id
        )

        return await self._process_notification(
            notification=notification,
            email=patient.email,
            subject=subject,
            message=message,
            phone=patient.phone,
            channel="both",
        )

    async def send_appointment_reschedule(
        self,
        appointment: Appointment,
        old_date: datetime,
        patient: User,
        kinesiologo: User
    ) -> bool:
        """Enviar notificación de reprogramación"""
        subject = "Turno Reprogramado - KineMov"
        message = f"""
Hola {patient.full_name},

Tu turno ha sido reprogramado:

📅 Fecha y hora anterior: {old_date.strftime('%d/%m/%Y %H:%M')} hs
📅 Nueva fecha: {appointment.date.strftime('%d/%m/%Y')}
⏰ Nueva hora: {appointment.date.strftime('%H:%M')} hs
👨‍⚕️ Kinesiólogo: {kinesiologo.full_name}

Saludos,
Equipo KineMov
"""
        notification = await self.create_notification(
            user_id=patient.id,
            notification_type="reschedule",
            channel="both",
            message=message,
            subject=subject,
            appointment_id=appointment.id
        )

        # También notificar al kinesiólogo
        await self.create_notification(
            user_id=kinesiologo.id,
            notification_type="reschedule",
            channel="in_app",
            message=f"Has reprogramado el turno del paciente {patient.full_name}.\n\n📅 Fecha anterior: {old_date.strftime('%d/%m/%Y %H:%M')} hs\n📅 Nueva fecha: {appointment.date.strftime('%d/%m/%Y %H:%M')} hs",
            subject="Turno Reprogramado (Saliente)",
            appointment_id=appointment.id
        )

        return await self._process_notification(
            notification=notification,
            email=patient.email,
            subject=subject,
            message=message,
            phone=patient.phone,
            channel="both",
        )

    async def _process_notification(
        self,
        notification: Notification,
        email: str,
        subject: str,
        message: str,
        phone: Optional[str] = None,
        channel: str = "both"
    ) -> bool:
        """Procesar y enviar la notificación y actualizar el registro"""
        success = True
        error_messages: list[str] = []

        # Enviar email
        if channel in ["email", "both"]:
            try:
                email_sent = await send_email_util(
                    to_email=email,
                    subject=subject,
                    body=message
                )
                if not email_sent:
                    logger.warning(f"Email not sent to {email}")
                    success = False
                    error_messages.append("email_failed")
            except Exception as e:
                logger.error(f"Error sending email: {e}")
                success = False
                error_messages.append(str(e))

        # Enviar SMS
        if phone and channel in ["sms", "both"]:
            try:
                sms_sent = await send_sms(phone, message)
                if not sms_sent:
                    logger.warning(f"SMS not sent to {phone}")
                    success = False
                    error_messages.append("sms_failed")
            except Exception as e:
                logger.error(f"Error sending SMS: {e}")
                success = False
                error_messages.append(str(e))

        # Actualizar registro de notificación
        try:
            notification.sent = success
            # Columnas TIMESTAMP WITHOUT TIME ZONE (PostgreSQL): usar naive UTC, no tz-aware (asyncpg falla si mezcla).
            notification.sent_at = (
                datetime.now(timezone.utc).replace(tzinfo=None) if success else None
            )
            if error_messages:
                notification.error_message = "; ".join(error_messages)

            self.db.add(notification)
            await self.db.commit()
            await self.db.refresh(notification)
        except Exception as e:
            logger.error(f"Error updating notification record: {e}")

        return success

    async def get_user_notifications(
        self,
        user_id: int,
        limit: int = 50
    ) -> List[Notification]:
        """Obtener notificaciones de un usuario"""
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_pending_notifications(self) -> List[Notification]:
        """Obtener notificaciones pendientes"""
        result = await self.db.execute(
            select(Notification)
            .where(Notification.sent == False)
            .order_by(Notification.created_at)
        )
        return result.scalars().all()

    async def mark_notification_as_read(self, notification_id: int, user_id: int) -> bool:
        """Marcar una notificación como leída"""
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await self.db.commit()
            return True
        return False

    async def mark_all_as_read(self, user_id: int) -> int:
        """Marcar todas las notificaciones de un usuario como leídas"""
        from sqlalchemy import update
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount