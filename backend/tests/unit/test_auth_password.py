"""Unit tests for password hashing and verification."""

import pytest

from app.services.auth import get_password_hash, verify_password

pytestmark = pytest.mark.unit


class TestPasswordHash:
    def test_roundtrip_pbkdf2(self):
        plain = "secret-password-123"
        hashed = get_password_hash(plain)
        assert hashed.startswith("$pbkdf2")
        assert verify_password(plain, hashed) is True

    def test_wrong_password_fails(self):
        hashed = get_password_hash("correct")
        assert verify_password("wrong", hashed) is False
