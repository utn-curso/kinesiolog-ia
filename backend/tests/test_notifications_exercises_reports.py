"""Integration tests for notifications, exercises, and reports routers."""

import pytest
from httpx import AsyncClient

from tests.test_api import auth_headers, login_user, register_user

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
class TestNotifications:
    async def test_list_notifications_empty(self, client: AsyncClient):
        await register_user(client, "notif_empty@example.com", "testpass123", "Notif User")
        token = await login_user(client, "notif_empty@example.com", "testpass123")
        response = await client.get("/api/notifications/", headers=auth_headers(token))
        assert response.status_code == 200
        assert response.json() == []

    async def test_notifications_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/notifications/")
        assert response.status_code in (401, 403)

    async def test_mark_read_not_found(self, client: AsyncClient):
        await register_user(client, "notif_read@example.com", "testpass123", "Read User")
        token = await login_user(client, "notif_read@example.com", "testpass123")
        response = await client.put(
            "/api/notifications/99999/read",
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json() == {"success": False}

    async def test_mark_all_read(self, client: AsyncClient):
        await register_user(client, "notif_all@example.com", "testpass123", "All Read User")
        token = await login_user(client, "notif_all@example.com", "testpass123")
        response = await client.put("/api/notifications/read-all", headers=auth_headers(token))
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "count" in data


@pytest.mark.asyncio
class TestExercises:
    _YT = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    async def test_list_exercises_public(self, client: AsyncClient):
        response = await client.get("/api/exercises/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_create_exercise_patient_forbidden(self, client: AsyncClient):
        await register_user(client, "ex_pat@example.com", "testpass123", "Ex Patient")
        token = await login_user(client, "ex_pat@example.com", "testpass123")
        response = await client.post(
            "/api/exercises/",
            json={
                "name": "Squat",
                "treatment": "rehab",
                "body_part": "knee",
                "description": "Test",
                "youtube_url": self._YT,
            },
            headers=auth_headers(token),
        )
        assert response.status_code == 403

    async def test_create_and_get_exercise(self, client: AsyncClient):
        await register_user(
            client, "ex_kin@example.com", "testpass123", "Dr. Exercise", role="kinesiologo"
        )
        token = await login_user(client, "ex_kin@example.com", "testpass123")
        create_resp = await client.post(
            "/api/exercises/",
            json={
                "name": "Heel slides",
                "treatment": "rehab",
                "body_part": "knee",
                "description": "Mobility",
                "youtube_url": self._YT,
            },
            headers=auth_headers(token),
        )
        assert create_resp.status_code == 200
        exercise_id = create_resp.json()["id"]

        get_resp = await client.get(f"/api/exercises/{exercise_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Heel slides"

    async def test_get_exercise_not_found(self, client: AsyncClient):
        response = await client.get("/api/exercises/999999")
        assert response.status_code == 404

    async def test_delete_exercise_non_admin_forbidden(self, client: AsyncClient):
        await register_user(
            client, "ex_del_kin@example.com", "testpass123", "Dr. Del", role="kinesiologo"
        )
        token = await login_user(client, "ex_del_kin@example.com", "testpass123")
        create_resp = await client.post(
            "/api/exercises/",
            json={
                "name": "Temp",
                "treatment": "rehab",
                "youtube_url": self._YT,
            },
            headers=auth_headers(token),
        )
        assert create_resp.status_code == 200
        exercise_id = create_resp.json()["id"]

        del_resp = await client.delete(
            f"/api/exercises/{exercise_id}",
            headers=auth_headers(token),
        )
        assert del_resp.status_code == 403


@pytest.mark.asyncio
class TestReports:
    async def test_monthly_report_patient_forbidden(self, client: AsyncClient):
        await register_user(client, "rep_pat@example.com", "testpass123", "Rep Patient")
        token = await login_user(client, "rep_pat@example.com", "testpass123")
        response = await client.get(
            "/api/reports/monthly?year=2026&month=5",
            headers=auth_headers(token),
        )
        assert response.status_code == 403

    async def test_monthly_report_kinesiologo(self, client: AsyncClient):
        await register_user(
            client, "rep_kin@example.com", "testpass123", "Dr. Reports", role="kinesiologo"
        )
        token = await login_user(client, "rep_kin@example.com", "testpass123")
        response = await client.get(
            "/api/reports/monthly?year=2026&month=5",
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "kinesiologo_id" in data
        assert "total_appointments" in data

    async def test_dashboard_summary_patient_forbidden(self, client: AsyncClient):
        await register_user(client, "dash_pat@example.com", "testpass123", "Dash Pat")
        token = await login_user(client, "dash_pat@example.com", "testpass123")
        response = await client.get(
            "/api/reports/dashboard-summary",
            headers=auth_headers(token),
        )
        assert response.status_code == 403

    async def test_custom_report_invalid_period(self, client: AsyncClient):
        await register_user(
            client, "cust_kin@example.com", "testpass123", "Dr. Custom", role="kinesiologo"
        )
        token = await login_user(client, "cust_kin@example.com", "testpass123")
        response = await client.get(
            "/api/reports/custom?period_start=2026-06-01T00:00:00&period_end=2026-05-01T00:00:00",
            headers=auth_headers(token),
        )
        assert response.status_code == 400
