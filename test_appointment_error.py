import asyncio
import httpx
from datetime import datetime, timedelta

async def test_appointment():
    async with httpx.AsyncClient() as client:
        # 1. Register a patient
        print("1. Registering patient...")
        response = await client.post(
            "http://127.0.0.1:8001/api/auth/register",
            json={
                "email": "patient_test2@example.com",
                "password": "testpass123",
                "full_name": "Test Patient",
                "role": "patient",
                "phone": "+56912345678"
            }
        )
        print(f"   Register response: {response.status_code}")
        
        # 2. Login
        print("\n2. Logging in...")
        response = await client.post(
            "http://127.0.0.1:8001/api/auth/login",
            data={
                "username": "patient_test2@example.com",
                "password": "testpass123"
            }
        )
        
        if response.status_code != 200:
            print(f"   Login failed: {response.text}")
            return
        
        auth_data = response.json()
        token = auth_data.get("access_token")
        if not token:
            print(f"   No token in response: {auth_data}")
            return
        print(f"   Token: {token[:20]}...")

        # 3. Get kinesiologos
        print("\n3. Getting kinesiologos...")
        response = await client.get(
            "http://127.0.0.1:8001/api/users/kinesiologos",
            headers={"Authorization": f"Bearer {token}"}
        )
        kinesiologos = response.json()
        print(f"   Found {len(kinesiologos)} kinesiologos")
        if not kinesiologos:
            print("   No kinesiologos available, creating one...")
            # Register a kinesiologo
            response = await client.post(
                "http://127.0.0.1:8001/api/auth/register",
                json={
                    "email": "kinesiologo_test2@example.com",
                    "password": "testpass123",
                    "full_name": "Test Kinesiologo",
                    "role": "kinesiologo",
                    "phone": "+56912345679"
                }
            )
            print(f"   Kinesiologo registered: {response.status_code}")
            
            # Get kinesiologos again
            response = await client.get(
                "http://127.0.0.1:8001/api/users/kinesiologos",
                headers={"Authorization": f"Bearer {token}"}
            )
            kinesiologos = response.json()
            print(f"   Now have {len(kinesiologos)} kinesiologos")

        if not kinesiologos:
            print("   ERROR: No kinesiologos available")
            return
        
        kinesiologo_id = kinesiologos[0]["id"]
        print(f"   Using kinesiologo ID: {kinesiologo_id}")

        # 4. Create appointment
        print("\n4. Creating appointment...")
        tomorrow = datetime.now() + timedelta(days=1)
        # Create a unique time using seconds to avoid conflicts
        appointment_time = tomorrow.replace(
            hour=10, 
            minute=0, 
            second=0, 
            microsecond=0
        ) + timedelta(seconds=int(datetime.now().timestamp() % 3600))
        
        payload = {
            "kinesiologo_id": kinesiologo_id,
            "date": appointment_time.isoformat(),
            "notes": "Test appointment"
        }
        
        print(f"   Payload: {payload}")
        
        response = await client.post(
            "http://127.0.0.1:8001/api/appointments/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_appointment())
