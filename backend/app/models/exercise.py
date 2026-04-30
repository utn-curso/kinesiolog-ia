from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    treatment = Column(String(255), nullable=False)  # e.g., "Rehabilitación física", "Post-operatorio"
    body_part = Column(String(255), nullable=True)  # e.g., "Espalda", "Hombro", "Rodilla"
    description = Column(Text, nullable=True)
    youtube_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
