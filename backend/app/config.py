from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - fallback to SQLite for development if PostgreSQL not available
    database_url: str = "sqlite+aiosqlite:///./kinemov.db"

    # Try PostgreSQL first, fallback to SQLite
    postgres_url: Optional[str] = None

    # JWT
    jwt_secret: str = "your_super_secret_jwt_key_here_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # Email
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_user: Optional[str] = None
    email_pass: Optional[str] = None
    email_from: str = "noreply@kinemov.com"

    # SMS (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

    # CORS
    frontend_url: str = "http://localhost:5173"
    cors_origins: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

    # Environment
    environment: str = "development"

    # Cuando está activo, al arrancar la API se ejecuta create_all() según los modelos
    # (tablas nuevas y columnas nuevas donde SQLAlchemy lo permita). Desactívalo en
    # producción si usas migraciones formales (Alembic).
    sync_db_schema_on_startup: bool = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Try to use PostgreSQL if available, otherwise fallback to SQLite
        if self.postgres_url:
            self.database_url = self.postgres_url
        # Keep SQLite as fallback

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()