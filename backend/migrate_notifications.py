"""
Añade columnas nuevas del modelo Notification si la tabla ya existía (sin Alembic).

- SQLite: alter en kinemov.db (cwd = directorio donde ejecutes el script; suele ser backend/).
- PostgreSQL: ALTER ... IF NOT EXISTS usando la misma URL que app.config (DATABASE_URL / POSTGRES_URL).

Uso desde la carpeta backend/:
    python migrate_notifications.py
"""

import os
import sqlite3

from sqlalchemy import create_engine, text


def sync_url_from_async(url: str) -> str:
    if "+asyncpg" in url:
        return url.replace("postgresql+asyncpg://", "postgresql://")
    if "+aiosqlite" in url:
        return url.replace("sqlite+aiosqlite:", "sqlite:")
    return url


def migrate_sqlite_file(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT 0")
        conn.commit()
        print("SQLite: columna notifications.is_read agregada.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("SQLite: notifications.is_read ya existe.")
        else:
            raise
    finally:
        conn.close()


def migrate_postgresql(url: str) -> None:
    engine = create_engine(sync_url_from_async(url), future=True)
    stmt = text(
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE"
    )
    with engine.begin() as conn:
        conn.execute(stmt)
    print("PostgreSQL: columna notifications.is_read verificada (IF NOT EXISTS).")


def main() -> None:
    from app.config import settings

    url = settings.database_url
    if "sqlite" in url:
        cwd_path = "./kinemov.db"
        if os.path.exists(cwd_path):
            migrate_sqlite_file(cwd_path)
            return
        print("SQLite: no existe kinemov.db en el cwd; el esquema se crea al levantar la API.")
        return

    if "postgresql" in url:
        migrate_postgresql(url)
        return

    print(f"No hay migración automática para esta database_url ({url[:48]}…).")


if __name__ == "__main__":
    main()
