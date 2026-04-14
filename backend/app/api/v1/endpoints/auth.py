from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.auth import authenticate_user, create_user, create_access_token
from app.schemas.user import User, UserCreate, Token
from app.utils.email import send_welcome_email

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token"""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
    try:
        print("Starting register")
        # Check if user already exists
        from app.services.auth import get_user_by_email
        print("Checking existing user")
        existing_user = await get_user_by_email(db, user_data.email)
        print(f"Existing user: {existing_user}")
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        print("Creating user")
        user = await create_user(db, user_data)
        print(f"User created: {user}")

        # Send welcome email (async, don't wait)
        # import asyncio
        # print("Sending email")
        # asyncio.create_task(send_welcome_email(user.email, user.full_name))

        print("Returning user")
        return user
    except Exception as e:
        print(f"Error in register: {e}")
        import traceback
        traceback.print_exc()
        raise