from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ReportType(str, enum.Enum):
    MONTHLY = "monthly"
    CUSTOM = "custom"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    kinesiologo_id = Column(Integer, ForeignKey("kinesiologos.id"), nullable=False)
    report_type = Column(String(20), default=ReportType.MONTHLY.value)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Statistics
    total_appointments = Column(Integer, default=0)
    completed_appointments = Column(Integer, default=0)
    cancelled_appointments = Column(Integer, default=0)
    pending_appointments = Column(Integer, default=0)
    
    # Financial data
    total_revenue = Column(Float, default=0.0)  # Monto total de citas completadas
    
    # Metadata
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    kinesiologo = relationship("Kinesiologo", foreign_keys=[kinesiologo_id])
    generated_by = relationship("User", foreign_keys=[generated_by_id])
