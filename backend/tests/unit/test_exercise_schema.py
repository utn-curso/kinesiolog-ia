"""Unit tests for exercise schema validators."""

import pytest
from pydantic import ValidationError

from app.schemas.exercise import ExerciseCreate, validate_youtube_url

pytestmark = pytest.mark.unit


class TestYoutubeValidation:
    def test_validate_youtube_url_accepts_watch_link(self):
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert validate_youtube_url(url) == url.strip()

    def test_validate_youtube_url_rejects_invalid(self):
        with pytest.raises(ValueError, match="YouTube"):
            validate_youtube_url("https://example.com/not-youtube")

    def test_exercise_create_optional_invalid_url(self):
        with pytest.raises(ValidationError):
            ExerciseCreate(
                name="x",
                treatment="t",
                youtube_url="not-a-valid-url",
            )
