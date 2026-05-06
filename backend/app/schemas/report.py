from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class ReportType(str, Enum):
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReportBase(BaseModel):
    report_type: ReportType
    period_start: datetime
    period_end: datetime


class ReportCreate(ReportBase):
    kinesiologo_id: int


class ReportFilters(BaseModel):
    """Filtros para búsqueda de reportes"""
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    kinesiologo_id: Optional[int] = None
    report_type: Optional[ReportType] = None


class ReportOut(BaseModel):
    """Respuesta al cliente"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    kinesiologo_id: int
    report_type: ReportType
    period_start: datetime
    period_end: datetime
    
    # Statistics
    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    pending_appointments: int
    
    # Financial
    total_revenue: float = Field(..., description="Ingresos totales del período")
    
    # Metadata
    created_at: datetime
    updated_at: datetime


class ReportSummary(BaseModel):
    """Resumen rápido de reporte (para listas)"""
    id: int
    kinesiologo_id: int
    period_start: datetime
    period_end: datetime
    total_appointments: int
    completed_appointments: int
    total_revenue: float
    created_at: datetime


class MonthlyReportResponse(BaseModel):
    """Reporte mensual con datos calculados"""
    kinesiologo_id: int
    kinesiologo_name: str
    period_start: datetime
    period_end: datetime
    
    # Estadísticas
    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    pending_appointments: int
    completion_rate: float  # Porcentaje de turnos completados
    
    # Financiero
    total_revenue: float
    
    # Adicionales
    generated_at: datetime
