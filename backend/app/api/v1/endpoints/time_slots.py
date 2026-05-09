from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middlewares.auth import get_current_active_user
from app.models.user import User
from app.schemas.time_slot import TimeSlotCreate, TimeSlotOut, TimeSlotUpdate
from app.services.time_slot import TimeSlotService, resolve_kinesiologo_profile

router = APIRouter()


def _parse_query_date(raw: Optional[str]) -> Optional[date]:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        pass
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _value_error_http(exc: ValueError) -> HTTPException:
    msg = str(exc)
    status = 409 if "assigned appointments" in msg else 400
    return HTTPException(status_code=status, detail=msg)


@router.get("/me", response_model=List[TimeSlotOut])
async def list_my_time_slots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    from_date: Optional[str] = Query(None, description="Fecha mínima (ISO YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Fecha máxima (ISO YYYY-MM-DD)"),
):
    profile = await resolve_kinesiologo_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=403, detail="Only kinesiologos manage availability")

    from_d = _parse_query_date(from_date)
    to_d = _parse_query_date(to_date)

    service = TimeSlotService(db)
    slots = await service.list_for_kinesiologo(profile.id, from_d, to_d)
    return slots


@router.post("/me", response_model=TimeSlotOut)
async def create_my_time_slot(
    data: TimeSlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = await resolve_kinesiologo_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=403, detail="Only kinesiologos manage availability")

    service = TimeSlotService(db)
    try:
        return await service.create(profile.id, data)
    except ValueError as e:
        raise _value_error_http(e) from e


@router.put("/me/{slot_id}", response_model=TimeSlotOut)
async def update_my_time_slot(
    slot_id: int,
    data: TimeSlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = await resolve_kinesiologo_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=403, detail="Only kinesiologos manage availability")

    service = TimeSlotService(db)
    try:
        slot = await service.update(slot_id, profile.id, data)
    except ValueError as e:
        raise _value_error_http(e) from e

    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    return slot


@router.delete("/me/{slot_id}")
async def delete_my_time_slot(
    slot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = await resolve_kinesiologo_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=403, detail="Only kinesiologos manage availability")

    service = TimeSlotService(db)
    try:
        ok = await service.delete(slot_id, profile.id)
    except ValueError as e:
        raise _value_error_http(e) from e

    if not ok:
        raise HTTPException(status_code=404, detail="Time slot not found")
    return {"message": "Time slot deleted"}
