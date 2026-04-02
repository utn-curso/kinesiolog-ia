from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String(50), default="patient")  # patient, kinesiologo, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    kinesiologo_profile = relationship("Kinesiologo", back_populates="user", uselist=False)
    appointments = relationship("Appointment", back_populates="patient")


class Kinesiologo(Base):
    __tablename__ = "kinesiologos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    license_number = Column(String(100), unique=True)
    specialty = Column(String(255))
    experience_years = Column(Integer)
    bio = Column(Text)
    profile_image = Column(String(500))
    is_available = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="kinesiologo_profile")
    services = relationship("Service", back_populates="kinesiologo")
    time_slots = relationship("TimeSlot", back_populates="kinesiologo")
    appointments = relationship("Appointment", back_populates="kinesiologo")