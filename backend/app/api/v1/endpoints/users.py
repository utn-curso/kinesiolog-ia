from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middlewares.auth import get_current_active_user
from app.models.user import User, Kinesiologo
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information"""
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/", response_model=list[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of users (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users


@router.get("/kinesiologos", response_model=list[UserSchema])
async def read_kinesiologos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of kinesiologos"""
    result = await db.execute(
        select(User).where(User.role == "kinesiologo")
    )
    kinesiologos = result.scalars().all()
    return kinesiologos


@router.get("/pacientes", response_model=list[UserSchema])
async def read_pacientes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of patients (kinesiologo and admin only)"""
    if current_user.role not in ["kinesiologo", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(User).where(User.role == "patient").offset(skip).limit(limit)
    )
    patients = result.scalars().all()
    return patients


@router.get("/kinesiologos-profiles")
async def read_kinesiologos_profiles(
    db: AsyncSession = Depends(get_db)
):
    """Get list of kinesiologo profiles with user info (public access for booking)"""
    result = await db.execute(
        select(Kinesiologo)
    )
    kinesiologos = result.scalars().all()

    profiles = []
    for k in kinesiologos:
        # Eagerly load user data
        user_result = await db.execute(select(User).where(User.id == k.user_id))
        user = user_result.scalars().first()
        if user:
            profiles.append({
                "kinesiologo_id": k.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "specialty": k.specialty,
                "license_number": k.license_number,
                "is_available": k.is_available,
            })

    return profiles