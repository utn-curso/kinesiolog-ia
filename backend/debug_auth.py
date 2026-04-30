"""Debug script to test authentication"""
import asyncio
import bcrypt
from app.database import async_session
from sqlalchemy import text


async def check():
    async with async_session() as session:
        query = "SELECT email, hashed_password FROM users WHERE email='doctor@gmail.com'"
        result = await session.execute(text(query))
        row = result.fetchone()

        if not row:
            print("User 'doctor@gmail.com' not found!")
            return

        email, stored_hash = row
        print(f"Email: {email}")
        print(f"Full hash: {repr(stored_hash)}")
        print(f"Hash length: {len(stored_hash)}")
        print(f"Hash prefix: {stored_hash[:4]}")
        print()

        # Test with common passwords
        passwords_to_try = ["password123", "doctor123", "admin123", "12345678", "doctor"]
        for pw in passwords_to_try:
            try:
                result = bcrypt.checkpw(pw.encode("utf-8"), stored_hash.encode("utf-8"))
                print(f"  '{pw}' -> {result}")
                if result:
                    print(f"  *** FOUND CORRECT PASSWORD: {pw} ***")
            except Exception as e:
                print(f"  '{pw}' -> ERROR: {e}")

        # Also check: can we register a new user and log in?
        print("\n--- Testing fresh registration flow ---")
        from app.services.auth import get_password_hash, verify_password

        test_pw = "testpassword"
        new_hash = get_password_hash(test_pw)
        print(f"New hash format: {new_hash[:30]}...")
        verified = verify_password(test_pw, new_hash)
        print(f"Verify new hash: {verified}")

        # Check what the registration endpoint actually produces
        print("\n--- Checking registration endpoint auth.py ---")
        from app.services.auth import get_password_hash
        h = get_password_hash("password123")
        print(f"get_password_hash('password123') = {h[:40]}...")
        print(f"verify_password('password123', h) = {verify_password('password123', h)}")


asyncio.run(check())
