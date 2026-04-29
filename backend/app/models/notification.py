from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    # Tipos de notificación
    type = Column(String(50), nullable=False)  # confirmation, reminder, cancellation, reschedule
    channel = Column(String(20), nullable=False)  # email, sms, both
    
    # Estado
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Contenido
    subject = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())