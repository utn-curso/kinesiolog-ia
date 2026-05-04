import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


def validate_youtube_url(url: str) -> str:
    youtube_regex = re.compile(
        r'^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)[^&\s]{11}(&.*)?$',
        re.IGNORECASE,
    )
    if not youtube_regex.match(url.strip()):
        raise ValueError('URL de YouTube inválida. Debe usar un enlace válido de YouTube.')
    return url.strip()


class ExerciseBase(BaseModel):
    name: str
    treatment: str
    body_part: Optional[str] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None

    @field_validator('youtube_url')
    def check_youtube_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        return validate_youtube_url(value)


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    treatment: Optional[str] = None
    body_part: Optional[str] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None

    @field_validator('youtube_url')
    def check_youtube_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        return validate_youtube_url(value)


class Exercise(ExerciseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
