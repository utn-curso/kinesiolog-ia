import logging
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from app.config import settings

# Logger
logger = logging.getLogger(__name__)


async def send_sms(to_phone: str, message: str) -> bool:
    """Send SMS using Twilio"""
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
        logger.warning("SMS not configured, skipping SMS send")
        return False

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        message = client.messages.create(
            body=message,
            from_=settings.twilio_phone_number,
            to=to_phone
        )

        logger.info(f"SMS sent successfully to {to_phone}, SID: {message.sid}")
        return True

    except TwilioException as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending SMS to {to_phone}: {str(e)}")
        return False


async def send_appointment_reminder(
    phone: str,
    patient_name: str,
    kinesiologo_name: str,
    date: str,
    time: str
) -> bool:
    """Send appointment reminder SMS"""
    message = f"""
    KineMov - Recordatorio de turno

    Hola {patient_name},
    Tu turno con {kinesiologo_name} es mañana {date} a las {time}.

    Confirma tu asistencia respondiendo SI o NO.
    """

    return await send_sms(phone, message)


async def send_appointment_cancellation(
    phone: str,
    patient_name: str,
    kinesiologo_name: str,
    date: str,
    time: str
) -> bool:
    """Send appointment cancellation SMS"""
    message = f"""
    KineMov - Turno cancelado

    Hola {patient_name},
    Tu turno con {kinesiologo_name} para {date} {time} ha sido cancelado.

    Puedes reservar un nuevo turno en nuestra app.
    """

    return await send_sms(phone, message)