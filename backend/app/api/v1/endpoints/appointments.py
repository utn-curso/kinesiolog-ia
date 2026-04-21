from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import AppointmentOut, AppointmentCreate, AppointmentUpdate
from app.services.appointment import AppointmentService
from app.middlewares.auth import get_current_user
from app.models.user import User
from app.models.appointment import Appointment as AppointmentModel

router = APIRouter()


@router.get("/", response_model=List[AppointmentOut])
async def get_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[AppointmentStatus] = None
):
    service = AppointmentService(db)
    appointments = await service.get_appointments(
        user_id=current_user.id,
        user_role=current_user.role,
        skip=skip,
        limit=limit,
        status=status
    )

    def to_dict(a: AppointmentModel):
        return {
            "id": a.id,
            "patient_id": a.patient_id,
            "kinesiologo_id": a.kinesiologo_id,
            "date": a.date,
            "duration_minutes": a.duration_minutes,
            "notes": a.notes,
            "status": a.status,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }

    return [to_dict(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AppointmentService(db)
    appointment = await service.get_appointment(appointment_id, current_user.id, current_user.role)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "kinesiologo_id": appointment.kinesiologo_id,
        "date": appointment.date,
        "duration_minutes": appointment.duration_minutes,
        "notes": appointment.notes,
        "status": appointment.status,
        "created_at": appointment.created_at,
        "updated_at": appointment.updated_at,
    }


@router.post("/", response_model=AppointmentOut)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["patient", "admin"]:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    service = AppointmentService(db)
    try:
        appointment = await service.create_appointment(appointment_data, current_user.id)
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "kinesiologo_id": appointment.kinesiologo_id,
            "date": appointment.date,
            "duration_minutes": appointment.duration_minutes,
            "notes": appointment.notes,
            "status": appointment.status,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AppointmentService(db)
    appointment = await service.update_appointment(appointment_id, update_data, current_user.id, current_user.role)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or access denied")

    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "kinesiologo_id": appointment.kinesiologo_id,
        "date": appointment.date,
        "duration_minutes": appointment.duration_minutes,
        "notes": appointment.notes,
        "status": appointment.status,
        "created_at": appointment.created_at,
        "updated_at": appointment.updated_at,
    }


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AppointmentService(db)
    success = await service.delete_appointment(appointment_id, current_user.id, current_user.role)
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found or access denied")
    return {"message": "Appointment deleted successfully"}


@router.get("/available-slots/{kinesiologo_id}")
async def get_available_slots(
    kinesiologo_id: int,
    date: str,  # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        slot_date = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    service = AppointmentService(db)
    slots = await service.get_available_slots(kinesiologo_id, slot_date)
    return {"available_slots": [slot.isoformat() for slot in slots]}