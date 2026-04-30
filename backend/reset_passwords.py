"""Reset password for existing users to 'password123'"""
import asyncio
from app.database import async_session
from app.services.auth import get_password_hash
from sqlalchemy import text


async def reset_passwords():
    async with async_session() as session:
        result = await session.execute(
            text("SELECT id, email, role FROM users WHERE email NOT LIKE 'test_%' AND email NOT LIKE 'debug_%' AND email NOT LIKE 'kinesiologo_%'")
        )
        users = result.fetchall()

        new_hash = get_password_hash("password123")
        print(f"New hash: {new_hash[:50]}...")
        print()

        for user_id, email, role in users:
            await session.execute(
                text("UPDATE users SET hashed_password = :hash WHERE id = :id"),
                {"hash": new_hash, "id": user_id},
            )
            print(f"  OK Reset: {email} (role: {role}) -> password123")

        await session.commit()
        print("\nDone! All passwords reset to 'password123'")


asyncio.run(reset_passwords())
