# Tests para KineMov Backend
# Ejecutar con: pytest

import pytest

pytestmark = pytest.mark.integration

from httpx import AsyncClient


# --- Helper functions ---

async def register_user(client: AsyncClient, email: str, password: str, full_name: str, role: str = "patient", phone: str = "+1234567890"):
    """Helper to register a user and return the response data"""
    user_data = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "phone": phone,
        "role": role,
    }
    response = await client.post("/api/auth/register", json=user_data)
    return response


async def login_user(client: AsyncClient, email: str, password: str) -> str:
    """Helper to login and return the access token"""
    login_data = {"username": email, "password": password}
    response = await client.post(
        "/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    """Helper to build authorization headers"""
    return {"Authorization": f"Bearer {token}"}


async def seed_kinesiologo_day_slot(
    client: AsyncClient, token: str, day: str, start_h: int = 8, end_h: int = 18
) -> None:
    """One availability block covering most of a calendar day (duration multiple of 60 min)."""
    await client.post(
        "/api/time-slots/me",
        json={
            "start_time": day,
            "end_time": day,
            "start_hour": f"{start_h:02d}:00:00",
            "end_hour": f"{end_h:02d}:00:00",
            "is_available": True,
        },
        headers=auth_headers(token),
    )


# --- Auth Tests ---

@pytest.mark.asyncio
class TestAuth:
    """Tests para autenticación"""

    async def test_register_user(self, client: AsyncClient):
        """Test user registration"""
        response = await register_user(client, "test@example.com", "testpass123", "Test User")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "test@example.com"
        assert data["role"] == "patient"

    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test that duplicate email registration fails"""
        await register_user(client, "dup@example.com", "testpass123", "First User")
        response = await register_user(client, "dup@example.com", "testpass123", "Second User")
        assert response.status_code == 400

    async def test_login_user(self, client: AsyncClient):
        """Test user login"""
        await register_user(client, "login@example.com", "testpass123", "Login User")
        response = await client.post(
            "/api/auth/login",
            data={"username": "login@example.com", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient):
        """Test login with wrong password"""
        await register_user(client, "wrongpass@example.com", "testpass123", "Wrong Pass User")
        response = await client.post(
            "/api/auth/login",
            data={"username": "wrongpass@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent email"""
        response = await client.post(
            "/api/auth/login",
            data={"username": "noone@example.com", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401


# --- Users Tests ---

@pytest.mark.asyncio
class TestUsers:
    """Tests para endpoints de usuarios"""

    async def test_get_current_user(self, client: AsyncClient):
        """Test getting current user profile"""
        await register_user(client, "me@example.com", "testpass123", "Me User")
        token = await login_user(client, "me@example.com", "testpass123")

        response = await client.get("/api/users/me", headers=auth_headers(token))
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"
        assert data["full_name"] == "Me User"

    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test that unauthenticated request to /me fails"""
        response = await client.get("/api/users/me")
        assert response.status_code in [401, 403]

    async def test_get_kinesiologos_profiles_public(self, client: AsyncClient):
        """Test public kinesiologo profiles endpoint (no auth required)"""
        response = await client.get("/api/users/kinesiologos-profiles")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_update_current_user(self, client: AsyncClient):
        """Test updating current user profile"""
        await register_user(client, "update@example.com", "testpass123", "Before Update")
        token = await login_user(client, "update@example.com", "testpass123")

        response = await client.put(
            "/api/users/me",
            json={"full_name": "After Update"},
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "After Update"


# --- Appointments Tests ---

@pytest.mark.asyncio
class TestAppointments:
    """Tests para appointments"""

    async def test_create_appointment(self, client: AsyncClient):
        """Test appointment creation with proper seed data"""
        # 1. Register a kinesiólogo (this also creates the Kinesiologo profile)
        kin_resp = await register_user(
            client, "kinesio@example.com", "testpass123", "Dr. Kinesio", role="kinesiologo"
        )
        assert kin_resp.status_code == 200

        kin_token = await login_user(client, "kinesio@example.com", "testpass123")
        await seed_kinesiologo_day_slot(client, kin_token, "2026-06-15", 8, 18)

        # 2. Register and login a patient
        await register_user(client, "patient@example.com", "testpass123", "Patient User")
        token = await login_user(client, "patient@example.com", "testpass123")

        # 3. Create appointment with kinesiologo_id=1
        appointment_data = {
            "kinesiologo_id": 1,
            "date": "2026-06-15T10:00:00",
            "notes": "Test appointment",
        }
        response = await client.post(
            "/api/appointments/",
            json=appointment_data,
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["kinesiologo_id"] == 1
        assert data["status"] == "pending"
        assert data["notes"] == "Test appointment"
        
        import asyncio
        await asyncio.sleep(0.2)  # Let background tasks finish

    async def test_get_appointments(self, client: AsyncClient):
        """Test listing appointments for authenticated user"""
        await register_user(client, "listappt@example.com", "testpass123", "List User")
        token = await login_user(client, "listappt@example.com", "testpass123")

        response = await client.get("/api/appointments/", headers=auth_headers(token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_get_available_slots(self, client: AsyncClient):
        """Test available slots endpoint (public, no auth)"""
        await register_user(client, "slots_kin@example.com", "testpass123", "Dr. Slots", role="kinesiologo")

        slots_kin_token = await login_user(client, "slots_kin@example.com", "testpass123")
        await seed_kinesiologo_day_slot(client, slots_kin_token, "2026-06-15", 9, 17)

        response = await client.get("/api/appointments/available-slots/1?date=2026-06-15")
        assert response.status_code == 200
        data = response.json()
        assert "available_slots" in data
        assert len(data["available_slots"]) > 0

    async def test_create_appointment_conflict(self, client: AsyncClient):
        """Test that double-booking the same slot fails"""
        await register_user(client, "conflict_kin@example.com", "testpass123", "Dr. Conflict", role="kinesiologo")
        ck_token = await login_user(client, "conflict_kin@example.com", "testpass123")
        await seed_kinesiologo_day_slot(client, ck_token, "2026-07-01", 8, 18)

        # Setup patient
        await register_user(client, "conflict_pat@example.com", "testpass123", "Conflict Patient")
        token = await login_user(client, "conflict_pat@example.com", "testpass123")

        appointment_data = {
            "kinesiologo_id": 1,
            "date": "2026-07-01T14:00:00",
            "notes": "First booking",
        }

        # First booking should succeed
        resp1 = await client.post("/api/appointments/", json=appointment_data, headers=auth_headers(token))
        assert resp1.status_code == 200

        # Second booking at same time should fail
        appointment_data["notes"] = "Duplicate booking"
        resp2 = await client.post("/api/appointments/", json=appointment_data, headers=auth_headers(token))
        assert resp2.status_code == 400

        import asyncio
        await asyncio.sleep(0.2)  # Let background tasks finish


# --- Time slots (kinesiologo availability) ---

@pytest.mark.asyncio
class TestTimeSlots:
    async def test_patient_forbidden_time_slots(self, client: AsyncClient):
        await register_user(client, "ts_pat@example.com", "testpass123", "Patient TS")
        token = await login_user(client, "ts_pat@example.com", "testpass123")
        r = await client.post(
            "/api/time-slots/me",
            json={
                "start_time": "2026-08-01",
                "end_time": "2026-08-01",
                "start_hour": "09:00:00",
                "end_hour": "10:00:00",
            },
            headers=auth_headers(token),
        )
        assert r.status_code == 403

    async def test_kinesiologo_rejects_non_multiple_duration(self, client: AsyncClient):
        await register_user(client, "ts_kin_bad@example.com", "testpass123", "Dr. BadDur", role="kinesiologo")
        token = await login_user(client, "ts_kin_bad@example.com", "testpass123")
        r = await client.post(
            "/api/time-slots/me",
            json={
                "start_time": "2026-08-01",
                "end_time": "2026-08-01",
                "start_hour": "09:00:00",
                "end_hour": "09:45:00",
            },
            headers=auth_headers(token),
        )
        assert r.status_code == 400

    async def test_kinesiologo_crud_list(self, client: AsyncClient):
        await register_user(client, "ts_kin_ok@example.com", "testpass123", "Dr. CRUD", role="kinesiologo")
        token = await login_user(client, "ts_kin_ok@example.com", "testpass123")
        r_create = await client.post(
            "/api/time-slots/me",
            json={
                "start_time": "2026-09-02",
                "end_time": "2026-09-02",
                "start_hour": "09:00:00",
                "end_hour": "12:00:00",
            },
            headers=auth_headers(token),
        )
        assert r_create.status_code == 200
        slot_id = r_create.json()["id"]
        r_list = await client.get("/api/time-slots/me", headers=auth_headers(token))
        assert r_list.status_code == 200
        assert len(r_list.json()) >= 1
        r_del = await client.delete(f"/api/time-slots/me/{slot_id}", headers=auth_headers(token))
        assert r_del.status_code == 200

    async def test_two_non_overlapping_slots_second_succeeds(self, client: AsyncClient):
        """Segunda franja sin solapamiento debe persistir (aware vs naive en overlap)."""
        await register_user(client, "ts_two_slot@example.com", "testpass123", "Dr. TwoSlot", role="kinesiologo")
        token = await login_user(client, "ts_two_slot@example.com", "testpass123")
        r1 = await client.post(
            "/api/time-slots/me",
            json={
                "start_time": "2026-05-11",
                "end_time": "2026-05-15",
                "start_hour": "09:00:00",
                "end_hour": "16:00:00",
                "is_available": True,
            },
            headers=auth_headers(token),
        )
        assert r1.status_code == 200, r1.text
        r2 = await client.post(
            "/api/time-slots/me",
            json={
                "start_time": "2026-05-18",
                "end_time": "2026-05-18",
                "start_hour": "09:00:00",
                "end_hour": "17:00:00",
                "is_available": True,
            },
            headers=auth_headers(token),
        )
        assert r2.status_code == 200, r2.text

    async def test_cannot_delete_slot_with_booked_appointment(self, client: AsyncClient):
        await register_user(client, "ts_book_kin@example.com", "testpass123", "Dr. Booked", role="kinesiologo")
        kin_t = await login_user(client, "ts_book_kin@example.com", "testpass123")
        await seed_kinesiologo_day_slot(client, kin_t, "2026-10-10", 8, 12)

        await register_user(client, "ts_book_pat@example.com", "testpass123", "Pat Booked")
        pat_t = await login_user(client, "ts_book_pat@example.com", "testpass123")
        apt = await client.post(
            "/api/appointments/",
            json={
                "kinesiologo_id": 1,
                "date": "2026-10-10T09:00:00",
                "notes": "Block delete",
            },
            headers=auth_headers(pat_t),
        )
        assert apt.status_code == 200

        r_list = await client.get("/api/time-slots/me", headers=auth_headers(kin_t))
        assert r_list.status_code == 200
        slots = r_list.json()
        assert slots
        slot_id = slots[0]["id"]
        r_del = await client.delete(f"/api/time-slots/me/{slot_id}", headers=auth_headers(kin_t))
        assert r_del.status_code == 409


# --- Health Check ---

@pytest.mark.asyncio
class TestHealthCheck:
    async def test_health(self, client: AsyncClient):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"