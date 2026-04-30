from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middlewares.auth import get_current_active_user
from app.models.user import User
from app.models.exercise import Exercise
from app.schemas.exercise import Exercise as ExerciseSchema, ExerciseCreate, ExerciseUpdate

router = APIRouter()


@router.get("/", response_model=list[ExerciseSchema])
async def read_exercises(
    skip: int = 0,
    limit: int = 100,
    treatment: str | None = None,
    body_part: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Get list of exercises (public access)"""
    query = select(Exercise)
    
    if treatment:
        query = query.where(Exercise.treatment == treatment)
    
    if body_part:
        query = query.where(Exercise.body_part == body_part)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    exercises = result.scalars().all()
    return exercises


@router.post("/", response_model=ExerciseSchema)
async def create_exercise(
    exercise: ExerciseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new exercise (admin and kinesiologo only)"""
    if current_user.role not in ["admin", "kinesiologo"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_exercise = Exercise(
        name=exercise.name,
        treatment=exercise.treatment,
        body_part=exercise.body_part,
        description=exercise.description,
        youtube_url=exercise.youtube_url
    )
    db.add(db_exercise)
    await db.commit()
    await db.refresh(db_exercise)
    return db_exercise


@router.get("/{exercise_id}", response_model=ExerciseSchema)
async def read_exercise(
    exercise_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get exercise details (public access)"""
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    exercise = result.scalars().first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.put("/{exercise_id}", response_model=ExerciseSchema)
async def update_exercise(
    exercise_id: int,
    exercise_update: ExerciseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an exercise (admin and kinesiologo only)"""
    if current_user.role not in ["admin", "kinesiologo"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    db_exercise = result.scalars().first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    update_data = exercise_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_exercise, field, value)

    db.add(db_exercise)
    await db.commit()
    await db.refresh(db_exercise)
    return db_exercise


@router.delete("/{exercise_id}")
async def delete_exercise(
    exercise_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an exercise (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    db_exercise = result.scalars().first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    await db.delete(db_exercise)
    await db.commit()
    return {"message": "Exercise deleted successfully"}
