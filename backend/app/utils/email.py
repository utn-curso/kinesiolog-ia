import logging
from typing import Optional
from aiosmtplib import send
from email.message import EmailMessage
from pathlib import Path
from datetime import datetime, timezone

from app.config import settings

# Logger
logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> bool:
    """Send email using SMTP when credentials are available, otherwise use a development fallback (writes to disk)."""

    has_creds = bool(settings.email_user and settings.email_pass)

    # If credentials provided, attempt to send via SMTP.
    if has_creds:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = to_email
        message["Subject"] = subject

        if html_body:
            message.set_content(body)
            message.add_alternative(html_body, subtype="html")
        else:
            message.set_content(body)

        # Choose TLS mode: port 465 -> implicit TLS, otherwise use STARTTLS
        use_tls = bool(settings.email_port == 465)
        start_tls = not use_tls

        try:
            await send(
                message,
                hostname=settings.email_host,
                port=settings.email_port,
                username=settings.email_user,
                password=settings.email_pass,
                start_tls=start_tls,
                use_tls=use_tls,
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.warning(f"Primary SMTP send failed (host={settings.email_host} port={settings.email_port}): {e}")
            # Try implicit TLS on port 465 as a fallback
            try:
                await send(
                    message,
                    hostname=settings.email_host,
                    port=465,
                    username=settings.email_user,
                    password=settings.email_pass,
                    start_tls=False,
                    use_tls=True,
                )
                logger.info(f"Email sent successfully (fallback implicit TLS) to {to_email}")
                return True
            except Exception as e2:
                logger.error(f"Fallback SMTP send failed: {e2}")
                return False

    # No credentials: in development write emails to disk for testing, otherwise skip
    if settings.environment == "development":
        try:
            base_dir = Path(__file__).resolve().parents[2]
            out_dir = base_dir / "tmp_emails"
            out_dir.mkdir(parents=True, exist_ok=True)
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
            safe_to = to_email.replace("@", "_at_").replace(".", "_")
            fname = f"{stamp}_{safe_to}.txt"
            content = f"From: {settings.email_from}\nTo: {to_email}\nSubject: {subject}\n\n"
            content += html_body or body
            with open(out_dir / fname, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info("Development email written to %s", str(out_dir / fname))
            return True
        except Exception as e:
            logger.error("Failed to write development email: %s", e)
            return False

    logger.warning("Email not configured and not in development mode, skipping email send")
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