from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middlewares.auth import get_current_user
from app.models.user import User
from app.services.notification import NotificationService
from pydantic import BaseModel

router = APIRouter()


class NotificationOut(BaseModel):
    id: int
    appointment_id: Optional[int]
    type: str
    channel: str
    sent: bool
    sent_at: Optional[str]
    subject: Optional[str]
    message: str
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationOut])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener notificaciones del usuario actual"""
    service = NotificationService(db)
    notifications = await service.get_user_notifications(current_user.id)
    
    return [
        NotificationOut(
            id=n.id,
            appointment_id=n.appointment_id,
            type=n.type,
            channel=n.channel,
            sent=n.sent,
            sent_at=n.sent_at.isoformat() if n.sent_at else None,
            subject=n.subject,
            message=n.message,
            created_at=n.created_at.isoformat()
        )
        for n in notifications
    ]


@router.post("/test")
async def send_test_notification(
    email: str,
    phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enviar notificación de prueba"""
    service = NotificationService(db)
    
    message = f"""
Hola {current_user.full_name},

Este es un mensaje de prueba del sistema de notificaciones de KineMov.

Si recibiste este email, el sistema está funcionando correctamente.

Saludos,
Equipo KineMov
"""
    
    # Persist test notification then process it
    notification = await service.create_notification(
        user_id=current_user.id,
        notification_type="test",
        channel="both" if phone else "email",
        message=message,
        subject="Test - KineMov",
    )

    success = await service._process_notification(
        notification=notification,
        email=email,
        subject="Test - KineMov",
        message=message,
        phone=phone,
        channel="both" if phone else "email",
    )

    return {"success": success, "message": "Notificación de prueba enviada" if success else "Error al enviar"}