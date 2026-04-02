import logging
from typing import Optional
from aiosmtplib import send
from email.message import EmailMessage

from app.config import settings

# Logger
logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> bool:
    """Send email using SMTP"""
    if not settings.email_user or not settings.email_pass:
        logger.warning("Email not configured, skipping email send")
        return False

    try:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = to_email
        message["Subject"] = subject

        if html_body:
            message.set_content(body)
            message.add_alternative(html_body, subtype="html")
        else:
            message.set_content(body)

        await send(
            message,
            hostname=settings.email_host,
            port=settings.email_port,
            username=settings.email_user,
            password=settings.email_pass,
            use_tls=True,
        )

        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_welcome_email(email: str, full_name: str) -> bool:
    """Send welcome email to new user"""
    subject = "Bienvenido a KineMov"
    body = f"""
    ¡Hola {full_name}!

    Bienvenido a KineMov, tu plataforma de gestión de turnos de kinesiología.

    Ya puedes reservar turnos con nuestros profesionales calificados.

    Saludos,
    El equipo de KineMov
    """

    return await send_email(email, subject, body)


async def send_appointment_confirmation(
    email: str,
    patient_name: str,
    kinesiologo_name: str,
    service: str,
    date: str,
    time: str
) -> bool:
    """Send appointment confirmation email"""
    subject = "Confirmación de turno - KineMov"
    body = f"""
    ¡Hola {patient_name}!

    Tu turno ha sido confirmado:

    Profesional: {kinesiologo_name}
    Servicio: {service}
    Fecha: {date}
    Hora: {time}

    Si necesitas cancelar o modificar, por favor contáctanos.

    Saludos,
    El equipo de KineMov
    """

    return await send_email(email, subject, body)