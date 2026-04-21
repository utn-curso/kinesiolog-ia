import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api"

print("=" * 60)
print("DEBUG: Kinesiologo Creation and Appointment")
print("=" * 60)

# 1. Register a kinesiologo
print("\n1. Registering kinesiologo...")
kinesiologo_data = {
    "email": f"debug_kinesiologo_{datetime.now().timestamp()}@example.com",
    "password": "KinPass123",
    "full_name": "Debug Kinesiologo",
    "phone": "0987654321",
    "role": "kinesiologo"
}

response = requests.post(f"{BASE_URL}/auth/register", json=kinesiologo_data)
print(f"Status: {response.status_code}")
print(f"User data: {json.dumps(response.json(), indent=2)}")
user_id = response.json().get("id")

# 1b. Login as kinesiologo to get token
print("\n1b. Logging in as kinesiologo...")
response = requests.post(f"{BASE_URL}/auth/login", 
    data={
        "username": kinesiologo_data["email"],
        "password": kinesiologo_data["password"]
    }
)
print(f"Status: {response.status_code}")
token = response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print(f"Token obtained: {token is not None}")

# 2. Get kinesiologos list
print("\n2. Getting kinesiologos list...")
response = requests.get(f"{BASE_URL}/users/kinesiologos", headers=headers)
print(f"Status: {response.status_code}")
kinesiologos = response.json()
print(f"Kinesiologos: {json.dumps(kinesiologos, indent=2)}")

if kinesiologos:
    kinesiologo_id = kinesiologos[-1].get("id")
    print(f"\nUsing kinesiologo_id: {kinesiologo_id}")
    
    # 3. Register a patient for the appointment
    print("\n3. Registering patient...")
    patient_data = {
        "email": f"debug_patient_{datetime.now().timestamp()}@example.com",
        "password": "PatientPass123",
        "full_name": "Debug Patient",
        "phone": "1234567890",
        "role": "patient"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=patient_data)
    print(f"Status: {response.status_code}")
    patient_user = response.json()
    print(f"Patient: {patient_user.get('email')}")
    
    # 4. Login as patient
    print("\n4. Logging in as patient...")
    response = requests.post(f"{BASE_URL}/auth/login", 
        data={
            "username": patient_data["email"],
            "password": patient_data["password"]
        }
    )
    print(f"Status: {response.status_code}")
    patient_token = response.json().get("access_token")
    patient_headers = {"Authorization": f"Bearer {patient_token}"}
    print(f"Token obtained: {patient_token is not None}")
    
    # 5. Create appointment
    print("\n5. Creating appointment...")
    appointment_date = (datetime.now() + timedelta(days=1)).isoformat()
    appointment_data = {
        "kinesiologo_id": kinesiologo_id,
        "date": appointment_date,
        "duration_minutes": 60,
        "notes": "Debug appointment"
    }
    
    print(f"Appointment data: {json.dumps(appointment_data, indent=2)}")
    response = requests.post(f"{BASE_URL}/appointments/", json=appointment_data, headers=patient_headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
else:
    print("No kinesiologos found!")

print("\n" + "=" * 60)
