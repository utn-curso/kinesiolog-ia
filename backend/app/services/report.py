from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload

from app.models.report import Report, ReportType
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import Kinesiologo, User
from app.models.payment import Payment
from app.schemas.report import ReportCreate, ReportFilters, MonthlyReportResponse
from sqlalchemy import func


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_monthly_report_data(
        self,
        kinesiologo_id: int,
        year: int,
        month: int
    ) -> dict:
        """Calcula datos de reporte mensual en tiempo real desde appointments"""
        # Construir fechas del mes
        if month == 12:
            period_start = datetime(year, month, 1, tzinfo=timezone.utc)
            period_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            period_start = datetime(year, month, 1, tzinfo=timezone.utc)
            period_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

        # Obtener todas las citas del kinesiólogo en el período
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.kinesiologo_id == kinesiologo_id,
                    Appointment.date >= period_start,
                    Appointment.date < period_end
                )
            ).options(joinedload(Appointment.patient))
        )
        appointments = result.scalars().unique().all()

        # Calcular estadísticas
        total = len(appointments)
        completed = sum(1 for a in appointments if a.status == AppointmentStatus.COMPLETED.value)
        cancelled = sum(1 for a in appointments if a.status == AppointmentStatus.CANCELLED.value)
        pending = sum(1 for a in appointments if a.status == AppointmentStatus.PENDING.value)
        confirmed = sum(1 for a in appointments if a.status == AppointmentStatus.CONFIRMED.value)

        # Calcular ingresos usando la tabla de pagos (solo pagos completados)
        result_payments = await self.db.execute(
            select(func.sum(Payment.amount)).select_from(Appointment).join(Payment).where(
                and_(
                    Appointment.kinesiologo_id == kinesiologo_id,
                    Appointment.date >= period_start,
                    Appointment.date < period_end,
                    Payment.status == "completed"
                )
            )
        )
        total_revenue = float(result_payments.scalar() or 0.0)

        return {
            "kinesiologo_id": kinesiologo_id,
            "period_start": period_start,
            "period_end": period_end,
            "total_appointments": total,
            "completed_appointments": completed,
            "cancelled_appointments": cancelled,
            "pending_appointments": pending,
            "confirmed_appointments": confirmed,
            "total_revenue": total_revenue,
            "completion_rate": (completed / total * 100) if total > 0 else 0.0
        }

    async def get_custom_report_data(
        self,
        kinesiologo_id: int,
        period_start: datetime,
        period_end: datetime
    ) -> dict:
        """Calcula datos de reporte custom en período específico"""
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.kinesiologo_id == kinesiologo_id,
                    Appointment.date >= period_start,
                    Appointment.date <= period_end
                )
            ).options(joinedload(Appointment.patient))
        )
        appointments = result.scalars().unique().all()

        # Calcular estadísticas
        total = len(appointments)
        completed = sum(1 for a in appointments if a.status == AppointmentStatus.COMPLETED.value)
        cancelled = sum(1 for a in appointments if a.status == AppointmentStatus.CANCELLED.value)
        pending = sum(1 for a in appointments if a.status == AppointmentStatus.PENDING.value)

        # Calcular ingresos usando la tabla de pagos (solo pagos completados)
        result_payments = await self.db.execute(
            select(func.sum(Payment.amount)).select_from(Appointment).join(Payment).where(
                and_(
                    Appointment.kinesiologo_id == kinesiologo_id,
                    Appointment.date >= period_start,
                    Appointment.date <= period_end,
                    Payment.status == "completed"
                )
            )
        )
        total_revenue = float(result_payments.scalar() or 0.0)

        return {
            "kinesiologo_id": kinesiologo_id,
            "period_start": period_start,
            "period_end": period_end,
            "total_appointments": total,
            "completed_appointments": completed,
            "cancelled_appointments": cancelled,
            "pending_appointments": pending,
            "total_revenue": total_revenue,
            "completion_rate": (completed / total * 100) if total > 0 else 0.0
        }

    async def create_report(
        self,
        report_data: ReportCreate,
        current_user_id: int
    ) -> Report:
        """Crea un reporte en BD"""
        # Calcular datos según tipo de reporte
        if report_data.report_type == ReportType.MONTHLY:
            calc_data = await self.get_monthly_report_data(
                report_data.kinesiologo_id,
                report_data.period_start.year,
                report_data.period_start.month
            )
        else:
            calc_data = await self.get_custom_report_data(
                report_data.kinesiologo_id,
                report_data.period_start,
                report_data.period_end
            )

        # Crear objeto Report
        report = Report(
            kinesiologo_id=report_data.kinesiologo_id,
            report_type=report_data.report_type,
            period_start=calc_data["period_start"],
            period_end=calc_data["period_end"],
            total_appointments=calc_data["total_appointments"],
            completed_appointments=calc_data["completed_appointments"],
            cancelled_appointments=calc_data["cancelled_appointments"],
            pending_appointments=calc_data["pending_appointments"],
            total_revenue=calc_data["total_revenue"],
            generated_by_id=current_user_id
        )

        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def get_report(self, report_id: int) -> Optional[Report]:
        """Obtiene un reporte por ID"""
        result = await self.db.execute(
            select(Report).where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def get_reports(
        self,
        filters: ReportFilters,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None
    ) -> List[Report]:
        """Obtiene lista de reportes con filtros y autorización"""
        query = select(Report)

        # Aplicar autorización
        if user_role == "kinesiologo":
            # Obtener ID del kinesiólogo
            result = await self.db.execute(
                select(Kinesiologo).where(Kinesiologo.user_id == user_id)
            )
            kinesiologo = result.scalar_one_or_none()
            if kinesiologo:
                query = query.where(Report.kinesiologo_id == kinesiologo.id)
            else:
                return []  # Kinesiólogo sin perfil, no puede ver reportes
        # Si es admin, puede ver todos (sin restricción)

        # Aplicar filtros
        if filters.period_start:
            query = query.where(Report.period_start >= filters.period_start)
        if filters.period_end:
            query = query.where(Report.period_end <= filters.period_end)
        if filters.kinesiologo_id:
            query = query.where(Report.kinesiologo_id == filters.kinesiologo_id)
        if filters.report_type:
            query = query.where(Report.report_type == filters.report_type)

        # Paginar
        query = query.offset(skip).limit(limit).order_by(Report.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_monthly_report_response(
        self,
        kinesiologo_id: int,
        year: int,
        month: int
    ) -> MonthlyReportResponse:
        """Retorna un reporte mensual formateado para el cliente (sin guardar en BD)"""
        # Obtener datos del kinesiólogo
        result = await self.db.execute(
            select(Kinesiologo).where(Kinesiologo.id == kinesiologo_id).options(
                joinedload(Kinesiologo.user)
            )
        )
        kinesiologo = result.scalar_one_or_none()
        if not kinesiologo:
            raise ValueError(f"Kinesiólogo {kinesiologo_id} no encontrado")

        # Obtener datos del reporte
        report_data = await self.get_monthly_report_data(kinesiologo_id, year, month)

        return MonthlyReportResponse(
            kinesiologo_id=kinesiologo_id,
            kinesiologo_name=kinesiologo.user.full_name,
            period_start=report_data["period_start"],
            period_end=report_data["period_end"],
            total_appointments=report_data["total_appointments"],
            completed_appointments=report_data["completed_appointments"],
            cancelled_appointments=report_data["cancelled_appointments"],
            pending_appointments=report_data["pending_appointments"],
            completion_rate=report_data["completion_rate"],
            total_revenue=report_data["total_revenue"],
            generated_at=datetime.now(timezone.utc)
        )

    async def delete_report(self, report_id: int) -> bool:
        """Elimina un reporte"""
        report = await self.get_report(report_id)
        if not report:
            return False
        await self.db.delete(report)
        await self.db.commit()
        return True
