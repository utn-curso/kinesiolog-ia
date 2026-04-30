from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, ConfigDict


class ExerciseBase(BaseModel):
    name: str
    treatment: str
    body_part: Optional[str] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    treatment: Optional[str] = None
    body_part: Optional[str] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None


class Exercise(ExerciseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
