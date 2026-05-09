from sqlalchemy import Column, Integer, Date, Time, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    kinesiologo_id = Column(Integer, ForeignKey("kinesiologos.id"), nullable=False)
    # Rango de días (solo fecha)
    start_time = Column(Date, nullable=False)
    end_time = Column(Date, nullable=False)
    # Franja horaria del mismo día (o repetida en cada día del rango)
    start_hour = Column(Time, nullable=False)
    end_hour = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)

    kinesiologo = relationship("Kinesiologo", back_populates="time_slots")
