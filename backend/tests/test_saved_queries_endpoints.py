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
        email="query_scientist@floatchat.org",
        password_hash="$argon2id$mock_hash_456",
        display_name="Query Scientist",
    ))
    token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=60))
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


def test_create_and_get_saved_query(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    payload = {
        "name": "Indian Ocean Thermocline Study",
        "description": "Temperature readings between 50m and 300m near equator",
        "query": {
            "latitude": 0.0,
            "longitude": 75.0,
            "radius_km": 250.0,
            "variable": "TEMP",
            "depth_min_m": 50.0,
            "depth_max_m": 300.0,
            "limit": 100,
        },
    }

    # 1. Create
    res_create = client.post("/api/v1/saved-queries", json=payload, headers=headers)
    assert res_create.status_code == status.HTTP_201_CREATED
    data_create = res_create.json()
    assert data_create["name"] == "Indian Ocean Thermocline Study"
    assert data_create["user_id"] == auth_header["user_id"]
    assert data_create["query"]["variable"] == ["TEMP"]
    query_id = data_create["id"]

    # 2. Get by ID
    res_get = client.get(f"/api/v1/saved-queries/{query_id}", headers=headers)
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["id"] == query_id


def test_list_saved_queries_pagination(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    for i in range(3):
        client.post(
            "/api/v1/saved-queries",
            json={
                "name": f"Saved Search {i}",
                "query": {"latitude": 10.0 + i, "longitude": 20.0, "radius_km": 100.0},
            },
            headers=headers,
        )

    res = client.get("/api/v1/saved-queries?page=1&page_size=2", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["has_more"] is True


def test_update_and_delete_saved_query(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    created = client.post(
        "/api/v1/saved-queries",
        json={"name": "Original Name", "query": {"latitude": 0.0, "longitude": 0.0}},
        headers=headers,
    ).json()
    query_id = created["id"]

    # Update
    patch_payload = {
        "name": "Modified Name",
        "description": "Added notes",
        "query": {"latitude": 15.0, "longitude": 45.0, "radius_km": 150.0},
    }
    res_patch = client.patch(f"/api/v1/saved-queries/{query_id}", json=patch_payload, headers=headers)
    assert res_patch.status_code == status.HTTP_200_OK
    updated = res_patch.json()
    assert updated["name"] == "Modified Name"
    assert updated["description"] == "Added notes"
    assert updated["query"]["latitude"] == 15.0

    # Delete
    res_del = client.delete(f"/api/v1/saved-queries/{query_id}", headers=headers)
    assert res_del.status_code == status.HTTP_200_OK
    assert res_del.json()["status"] == "deleted"

    # Verify not found
    res_get = client.get(f"/api/v1/saved-queries/{query_id}", headers=headers)
    assert res_get.status_code == status.HTTP_404_NOT_FOUND


def test_saved_query_validation_errors(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    # Empty name
    res_name = client.post(
        "/api/v1/saved-queries",
        json={"name": "   ", "query": {"latitude": 0.0, "longitude": 0.0}},
        headers=headers,
    )
    assert res_name.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid latitude > 90
    res_lat = client.post(
        "/api/v1/saved-queries",
        json={"name": "Bad Lat", "query": {"latitude": 120.0, "longitude": 0.0}},
        headers=headers,
    )
    assert res_lat.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Unsupported variable
    res_var = client.post(
        "/api/v1/saved-queries",
        json={"name": "Bad Var", "query": {"variable": "INVALID_VAR"}},
        headers=headers,
    )
    assert res_var.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
