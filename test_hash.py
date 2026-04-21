from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "TestPass123"
print(f"Password: {password}")
print(f"Password length: {len(password)}")

try:
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    print("✓ Success")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
