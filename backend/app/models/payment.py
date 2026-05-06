from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    status = Column(String(20), default="pending")  # pending, completed, refunded
    payment_method = Column(String(50), nullable=True)  # cash, card, transfer, etc.
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    appointment = relationship("Appointment", backref="payment")
