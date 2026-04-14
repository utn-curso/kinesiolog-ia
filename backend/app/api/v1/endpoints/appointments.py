from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import Appointment, AppointmentCreate, AppointmentUpdate
from app.services.appointment import AppointmentService
from app.middlewares.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Appointment])
async def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[AppointmentStatus] = None
):
    service = AppointmentService(db)
    return await service.get_appointments(
        user_id=current_user.id,
        user_role=current_user.role,
        skip=skip,
        limit=limit,
        status=status
    )


@router.get("/{appointment_id}", response_model=Appointment)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AppointmentService(db)
    appointment = await service.get_appointment(appointment_id, current_user.id, current_user.role)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/", response_model=Appointment)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["patient", "admin"]:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    service = AppointmentService(db)
    try:
        return await service.create_appointment(appointment_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{appointment_id}", response_model=Appointment)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AppointmentService(db)
    appointment = await service.update_appointment(appointment_id, update_data, current_user.id, current_user.role)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or access denied")
    return appointment


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        slot_date = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    service = AppointmentService(db)
    slots = await service.get_available_slots(kinesiologo_id, slot_date)
    return {"available_slots": [slot.isoformat() for slot in slots]}