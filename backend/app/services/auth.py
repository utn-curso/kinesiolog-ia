from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User, Kinesiologo
from app.schemas.user import UserCreate

import bcrypt
from passlib.hash import pbkdf2_sha256

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Check if it's an old bcrypt hash
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        return bcrypt.checkpw(plain_password[:72].encode('utf-8'), hashed_password.encode('utf-8'))
    # Otherwise, it's pbkdf2_sha256
    return pbkdf2_sha256.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password (new passwords always use pbkdf2_sha256)"""
    return pbkdf2_sha256.hash(password[:72])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """Create new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        role=getattr(user, 'role', 'patient') or 'patient',
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Create Kinesiologo profile if role is kinesiologo
    if db_user.role == "kinesiologo":
        kinesiologo = Kinesiologo(
            user_id=db_user.id,
            is_available=True
        )
        db.add(kinesiologo)
        await db.commit()
    
    return db_user