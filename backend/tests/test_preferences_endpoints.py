from datetime import timedelta
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.db.repositories.user import UserRepository


@pytest.fixture
def auth_header() -> dict:
    """Fixture providing valid Authorization header for a test user."""
    repo = UserRepository(db=None)
    import asyncio
    user = asyncio.run(repo.create_user(
        email="prefs_user@floatchat.org",
        password_hash="$argon2id$mock_hash_789",
        display_name="Prefs User",
    ))
    token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=60))
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


def test_get_default_preferences_auto_created(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    # GET preferences -> should auto-create defaults
    res = client.get("/api/v1/preferences", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["user_id"] == auth_header["user_id"]
    assert data["theme"] == "dark"
    assert data["language"] == "en"
    assert data["default_map_center"] == [0.0, 0.0]
    assert data["default_map_zoom"] == 2
    assert "temperature" in data["preferred_units"]


def test_update_preferences(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    update_payload = {
        "theme": "light",
        "language": "fr",
        "default_map_center": [45.0, -30.0],
        "default_map_zoom": 5,
        "preferred_units": {"temperature": "degF", "salinity": "psu"},
    }
    res_put = client.put("/api/v1/preferences", json=update_payload, headers=headers)
    assert res_put.status_code == status.HTTP_200_OK
    data = res_put.json()
    assert data["theme"] == "light"
    assert data["language"] == "fr"
    assert data["default_map_center"] == [45.0, -30.0]
    assert data["default_map_zoom"] == 5
    assert data["preferred_units"]["temperature"] == "degF"

    # Fetch again to verify persistence
    res_get = client.get("/api/v1/preferences", headers=headers)
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["theme"] == "light"


def test_update_preferences_validation_errors(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    # Invalid theme
    res_theme = client.put("/api/v1/preferences", json={"theme": "neon_rainbow"}, headers=headers)
    assert res_theme.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid map center latitude
    res_lat = client.put("/api/v1/preferences", json={"default_map_center": [120.0, 0.0]}, headers=headers)
    assert res_lat.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid zoom > 18
    res_zoom = client.put("/api/v1/preferences", json={"default_map_zoom": 99}, headers=headers)
    assert res_zoom.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
