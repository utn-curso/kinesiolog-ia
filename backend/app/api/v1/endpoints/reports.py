from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.user import User, Kinesiologo
from app.middlewares.auth import get_current_user
from app.schemas.report import (
    ReportCreate,
    ReportOut,
    ReportFilters,
    MonthlyReportResponse,
    ReportSummary,
    ReportType
)
from app.services.report import ReportService

router = APIRouter()


async def get_user_kinesiologo(db: AsyncSession, user_id: int) -> Optional[Kinesiologo]:
    """Obtiene el perfil de kinesiólogo del usuario"""
    result = await db.execute(
        select(Kinesiologo).where(Kinesiologo.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def validate_kinesiologo_access(
    db: AsyncSession,
    requested_kinesiologo_id: int,
    current_user: User
) -> bool:
    """Valida si el usuario puede acceder a los datos del kinesiólogo"""
    if current_user.role == "admin":
        return True
    
    if current_user.role == "kinesiologo":
        kinesiologo = await get_user_kinesiologo(db, current_user.id)
        return kinesiologo and kinesiologo.id == requested_kinesiologo_id
    
    return False


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene resumen de datos para el dashboard del kinesiólogo"""
    if current_user.role == "patient":
        raise HTTPException(status_code=403, detail="Pacientes no tienen acceso a este resumen")

    service = ReportService(db)
    kinesiologo_id = None
    
    if current_user.role == "kinesiologo":
        kine = await get_user_kinesiologo(db, current_user.id)
        if not kine:
            raise HTTPException(status_code=400, detail="Kinesiólogo no tiene perfil")
        kinesiologo_id = kine.id
    elif current_user.role == "admin":
        # For admin, we could aggregate all or just pick first one for demo
        # For now, let's pick the first kinesiologist
        from app.models.user import Kinesiologo
        res = await db.execute(select(Kinesiologo).limit(1))
        kine = res.scalar_one_or_none()
        if kine:
            kinesiologo_id = kine.id
    
    if not kinesiologo_id:
        return {"error": "No kinesiologist data available"}

    # 1. Revenue trend (last 5 months)
    from datetime import timedelta
    revenue_trend = []
    now = datetime.now()
    # Months in Spanish
    months_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for i in range(4, -1, -1):
        # Calculate year and month for i months ago
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        
        data = await service.get_monthly_report_data(kinesiologo_id, y, m)
        revenue_trend.append({
            "label": months_es[m-1],
            "revenue": data["total_revenue"]
        })

    # 2. Recent activity (latest notifications)
    from app.models.notification import Notification
    res_notif = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
    )
    recent_activity = res_notif.scalars().all()

    # 3. Stats for current month
    current_stats = await service.get_monthly_report_data(kinesiologo_id, now.year, now.month)

    return {
        "revenue_trend": revenue_trend,
        "recent_activity": [
            {
                "id": n.id,
                "message": n.message,
                "subject": n.subject,
                "type": n.type,
                "created_at": n.created_at
            } for n in recent_activity
        ],
        "stats": current_stats
    }


@router.get("/monthly", response_model=MonthlyReportResponse)
async def get_monthly_report(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    kinesiologo_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene reporte mensual (sin guardar en BD, cálculo en tiempo real).
    
    - **year**: Año del reporte
    - **month**: Mes del reporte (1-12)
    - **kinesiologo_id**: ID del kinesiólogo (solo admin puede ver ajenos, kinesiólogo solo ve el suyo)
    """
    service = ReportService(db)

    # Autorización
    if current_user.role == "patient":
        raise HTTPException(status_code=403, detail="Pacientes no pueden ver reportes")

    # Determinar qué kinesiólogo consultar
    if kinesiologo_id is None:
        if current_user.role == "kinesiologo":
            kinesiologo = await get_user_kinesiologo(db, current_user.id)
            if not kinesiologo:
                raise HTTPException(
                    status_code=400,
                    detail="Usuario kinesiólogo no tiene perfil asociado"
                )
            kinesiologo_id = kinesiologo.id
        else:
            raise HTTPException(
                status_code=400,
                detail="Admin debe especificar kinesiologo_id"
            )
    else:
        # Validar permisos
        has_access = await validate_kinesiologo_access(db, kinesiologo_id, current_user)
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para ver este reporte"
            )

    try:
        report = await service.get_monthly_report_response(kinesiologo_id, year, month)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/custom", response_model=MonthlyReportResponse)
async def get_custom_report(
    period_start: datetime = Query(...),
    period_end: datetime = Query(...),
    kinesiologo_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene reporte en período custom (sin guardar en BD).
    
    - **period_start**: Fecha inicio del período
    - **period_end**: Fecha fin del período
    - **kinesiologo_id**: ID del kinesiólogo
    """
    service = ReportService(db)

    # Autorización
    if current_user.role == "patient":
        raise HTTPException(status_code=403, detail="Pacientes no pueden ver reportes")

    if period_start >= period_end:
        raise HTTPException(
            status_code=400,
            detail="period_start debe ser menor a period_end"
        )

    # Determinar qué kinesiólogo consultar
    if kinesiologo_id is None:
        if current_user.role == "kinesiologo":
            kinesiologo = await get_user_kinesiologo(db, current_user.id)
            if not kinesiologo:
                raise HTTPException(
                    status_code=400,
                    detail="Usuario kinesiólogo no tiene perfil asociado"
                )
            kinesiologo_id = kinesiologo.id
        else:
            raise HTTPException(
                status_code=400,
                detail="Admin debe especificar kinesiologo_id"
            )
    else:
        # Validar permisos
        has_access = await validate_kinesiologo_access(db, kinesiologo_id, current_user)
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para ver este reporte"
            )

    # Obtener datos custom
    report_data = await service.get_custom_report_data(
        kinesiologo_id, period_start, period_end
    )

    result = await db.execute(
        select(Kinesiologo).where(Kinesiologo.id == kinesiologo_id).options(
            joinedload(Kinesiologo.user)
        )
    )
    kinesiologo = result.unique().scalar_one_or_none()

    return MonthlyReportResponse(
        kinesiologo_id=kinesiologo_id,
        kinesiologo_name=kinesiologo.user.full_name if kinesiologo else "Unknown",
        period_start=report_data["period_start"],
        period_end=report_data["period_end"],
        total_appointments=report_data["total_appointments"],
        completed_appointments=report_data["completed_appointments"],
        cancelled_appointments=report_data["cancelled_appointments"],
        pending_appointments=report_data["pending_appointments"],
        completion_rate=report_data["completion_rate"],
        total_revenue=report_data["total_revenue"],
        generated_at=datetime.now()
    )


@router.post("/", response_model=ReportOut)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Genera y guarda un nuevo reporte en BD.
    
    Solo admin puede crear reportes.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo admins pueden crear reportes")

    service = ReportService(db)
    report = await service.create_report(report_data, current_user.id)
    return report


@router.get("/", response_model=List[ReportSummary])
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    kinesiologo_id: Optional[int] = None,
    report_type: Optional[ReportType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista reportes guardados con paginación y filtros.
    
    - Admin: ve todos los reportes
    - Kinesiólogo: solo sus reportes
    - Paciente: acceso denegado
    """
    if current_user.role == "patient":
        raise HTTPException(status_code=403, detail="Pacientes no pueden ver reportes")

    service = ReportService(db)
    filters = ReportFilters(
        period_start=period_start,
        period_end=period_end,
        kinesiologo_id=kinesiologo_id,
        report_type=report_type
    )

    reports = await service.get_reports(
        filters=filters,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        user_role=current_user.role
    )

    return [
        ReportSummary(
            id=r.id,
            kinesiologo_id=r.kinesiologo_id,
            period_start=r.period_start,
            period_end=r.period_end,
            total_appointments=r.total_appointments,
            completed_appointments=r.completed_appointments,
            total_revenue=r.total_revenue,
            created_at=r.created_at
        )
        for r in reports
    ]


@router.get("/{report_id}", response_model=ReportOut)
async def get_report_detail(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene detalle de un reporte guardado.
    
    Validar permisos: admin ve todos, kinesiólogo ve solo suyos.
    """
    if current_user.role == "patient":
        raise HTTPException(status_code=403, detail="Pacientes no pueden ver reportes")

    service = ReportService(db)
    report = await service.get_report(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Validar permisos
    has_access = await validate_kinesiologo_access(db, report.kinesiologo_id, current_user)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para ver este reporte"
        )

    return report


@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina un reporte.
    
    Solo admin puede eliminar.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo admins pueden eliminar reportes")

    service = ReportService(db)
    deleted = await service.delete_report(report_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    return {"message": "Reporte eliminado exitosamente"}
