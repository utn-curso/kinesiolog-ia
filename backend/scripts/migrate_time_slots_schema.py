"""
Migra la tabla time_slots del esquema antiguo (start_time/end_time TIMESTAMP)
al nuevo (start_time/end_time DATE + start_hour/end_hour TIME).

Idempotente: si ya existen start_hour y end_hour, no hace nada.

Uso (desde el directorio backend, con venv activado):

    python scripts/migrate_time_slots_schema.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from sqlalchemy import inspect, text

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.config import settings  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine  # noqa: E402


def _migrate_postgresql(sync_conn) -> None:
    sync_conn.execute(text("ALTER TABLE time_slots ADD COLUMN start_hour TIME"))
    sync_conn.execute(text("ALTER TABLE time_slots ADD COLUMN end_hour TIME"))
    sync_conn.execute(
        text(
            """
            UPDATE time_slots SET
              start_hour = CAST(start_time AS time),
              end_hour = CAST(end_time AS time)
            """
        )
    )
    sync_conn.execute(
        text(
            """
            ALTER TABLE time_slots
              ALTER COLUMN start_time TYPE date USING (start_time::date),
              ALTER COLUMN end_time TYPE date USING (end_time::date)
            """
        )
    )
    sync_conn.execute(text("ALTER TABLE time_slots ALTER COLUMN start_hour SET NOT NULL"))
    sync_conn.execute(text("ALTER TABLE time_slots ALTER COLUMN end_hour SET NOT NULL"))


def _migrate_sqlite(sync_conn) -> None:
    sync_conn.execute(
        text(
            """
            CREATE TABLE time_slots__new (
              id INTEGER NOT NULL PRIMARY KEY,
              kinesiologo_id INTEGER NOT NULL,
              start_time DATE NOT NULL,
              end_time DATE NOT NULL,
              start_hour TIME NOT NULL,
              end_hour TIME NOT NULL,
              is_available BOOLEAN,
              FOREIGN KEY (kinesiologo_id) REFERENCES kinesiologos (id)
            )
            """
        )
    )
    sync_conn.execute(
        text(
            """
            INSERT INTO time_slots__new (
              id, kinesiologo_id, start_time, end_time, start_hour, end_hour, is_available
            )
            SELECT
              id,
              kinesiologo_id,
              date(start_time),
              date(end_time),
              time(start_time),
              time(end_time),
              is_available
            FROM time_slots
            """
        )
    )
    sync_conn.execute(text("DROP TABLE time_slots"))
    sync_conn.execute(text("ALTER TABLE time_slots__new RENAME TO time_slots"))


def _run(sync_conn) -> str:
    insp = inspect(sync_conn)
    if "time_slots" not in insp.get_table_names():
        return "skip: tabla time_slots no existe"
    cols = {c["name"]: c for c in insp.get_columns("time_slots")}
    if "start_hour" in cols and "end_hour" in cols:
        return "skip: esquema ya actualizado"
    if "start_time" not in cols or "end_time" not in cols:
        return "error: faltan columnas start_time / end_time"

    dialect = sync_conn.engine.dialect.name
    if dialect == "postgresql":
        _migrate_postgresql(sync_conn)
        return "ok: PostgreSQL migrado"
    if dialect == "sqlite":
        _migrate_sqlite(sync_conn)
        return "ok: SQLite migrado"
    return f"error: dialecto no soportado ({dialect})"


async def main() -> None:
    engine = create_async_engine(settings.database_url, future=True)
    async with engine.begin() as conn:

        def runner(c):
            msg = _run(c)
            print(msg)
            if msg.startswith("error"):
                raise RuntimeError(msg)

        await conn.run_sync(runner)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
