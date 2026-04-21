import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api"

# Test 1: Simple register test
print("="*60)
print("TEST 1: Register User - Detailed Error Capture")
print("="*60)

user_data = {
    "email": f"test_{int(datetime.now().timestamp())}@example.com",
    "password": "TestPass123",
    "full_name": "Test User",
    "phone": "1234567890",
    "role": "patient"
}

print(f"Enviando datos: {json.dumps(user_data, indent=2)}")

try:
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body:\n{response.text}")
    
    if response.status_code != 200:
        print(f"\n✗ FALLO: {response.status_code}")
    else:
        print(f"\n✓ ÉXITO")
        data = response.json()
        print(f"Usuario creado: {data}")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("TEST 2: Check Health")
print("="*60)

try:
    response = requests.get("http://localhost:8001/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\nTest completado.")
