from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Literal, Optional
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: Literal['patient', 'kinesiologo'] = 'patient'


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# Kinesiologo schemas
class KinesiologoBase(BaseModel):
    license_number: str
    specialty: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_available: bool = True


class KinesiologoCreate(KinesiologoBase):
    pass


class KinesiologoUpdate(BaseModel):
    specialty: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_available: Optional[bool] = None


class Kinesiologo(KinesiologoBase):
    id: int
    user_id: int
    user: User

    class Config:
        from_attributes = True


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None