"""Automated tests for Stage 8: Frontend Product Contract & API Integration."""

from datetime import timedelta
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.db.repositories.user import UserRepository


@pytest.fixture
def auth_header() -> dict:
    """Fixture providing valid Authorization header for an authenticated user."""
    repo = UserRepository(db=None)
    import asyncio
    user = asyncio.run(repo.create_user(
        email="frontend_tester@floatchat.org",
        password_hash="$argon2id$mock_hash_frontend",
        display_name="Frontend Tester",
    ))
    token = create_access_token(subject=user.id, expires_delta=timedelta(hours=1))
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


# ==============================================================================
# 1. Health Endpoints
# ==============================================================================

def test_frontend_health_and_backward_compatibility(client: TestClient) -> None:
    """Verifies GET /api/health works without breaking GET /api/v1/health."""
    # 1. New frontend contract health endpoint
    res_product = client.get("/api/health")
    assert res_product.status_code == status.HTTP_200_OK
    data_product = res_product.json()
    assert data_product["status"] == "ok"
    assert data_product["service"] == "FloatChat Climate Intelligence API"
    assert "argo_data_source" in data_product

    # 2. Existing v1 health endpoint preserved
    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == status.HTTP_200_OK
    assert res_v1.json()["status"] == "healthy"


def test_openapi_exposes_frontend_and_v1_routes(client: TestClient) -> None:
    """Verifies that OpenAPI documentation exposes both /api and /api/v1 routes."""
    res = client.get("/openapi.json")
    assert res.status_code == status.HTTP_200_OK
    schema = res.json()
    paths = schema.get("paths", {})

    # Verify frontend endpoints
    assert "/api/query" in paths
    assert "/api/chat" in paths
    assert "/api/floats" in paths
    assert "/api/floats/{float_id}" in paths
    assert "/api/floats/{float_id}/profile" in paths
    assert "/api/fleet/status" in paths
    assert "/api/ocean/compare" in paths
    assert "/api/health" in paths

    # Verify existing v1 endpoints
    assert "/api/v1/health" in paths
    assert "/api/v1/auth/register" in paths
    assert "/api/v1/observations/query" in paths


# ==============================================================================
# 2. Natural-Language Query & Chat Fallback (/api/query, /api/chat)
# ==============================================================================

def test_post_query_successful_response_structure(client: TestClient) -> None:
    """Tests POST /api/query returns full schema matching frontend-api-contract.md."""
    payload = {
        "query": "What climate risks are emerging along the Bay of Bengal?",
        "conversation_id": "conv-test-1234",
        "context": {
            "preferred_region": "bay_of_bengal",
            "depth_limit_meters": 2000,
        },
    }
    res = client.post("/api/query", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()

    # 1. Root fields
    assert data["query"] == payload["query"]
    assert "location" in data
    assert "float" in data
    assert "summary" in data
    assert "kpis" in data
    assert "profile" in data
    assert "insights" in data
    assert "text" in data
    assert "source" in data
    assert "followUps" in data

    # 2. Location verification
    assert data["location"]["regionCategory"] == "bay_of_bengal"
    assert isinstance(data["location"]["latitude"], (int, float))
    assert isinstance(data["location"]["longitude"], (int, float))

    # 3. Float telemetry verification
    assert "id" in data["float"]
    assert "wmoNumber" in data["float"]
    assert "cycle" in data["float"]
    assert data["float"]["status"] == "Active"

    # 4. Profile summary metrics
    summary = data["summary"]
    assert "surface_temperature" in summary
    assert "surface_salinity" in summary
    assert "mixed_layer_depth" in summary
    assert "max_depth" in summary

    # 5. KPIs
    assert len(data["kpis"]) >= 3
    kpi_labels = [k["label"] for k in data["kpis"]]
    assert "SEA SURFACE TEMPERATURE" in kpi_labels
    assert "SURFACE SALINITY" in kpi_labels
    assert "MIXED LAYER DEPTH (MLD)" in kpi_labels

    # 6. Profile points and unsupported fields check (oxygen, density must be null)
    assert len(data["profile"]) > 0
    first_pt = data["profile"][0]
    assert "depth" in first_pt
    assert "temperature" in first_pt
    assert "salinity" in first_pt
    assert first_pt["density"] is None  # Scientifically unsupported by core CTD
    assert first_pt["oxygen"] is None   # Scientifically unsupported by core CTD

    # 7. Scientific safety language check
    text_content = data["text"].lower()
    assert "disaster guaranteed" not in text_content
    assert "predicts a cyclone" not in text_content
    assert any(term in text_content for term in ["risk-relevant", "environmental indicator", "anomaly", "surface thermal state"])


def test_post_chat_fallback_route(client: TestClient) -> None:
    """Tests that POST /api/chat acts as seamless fallback for POST /api/query."""
    payload = {
        "query": "Assess Arabian Sea thermal state",
        "context": {"preferred_region": "arabian_sea"},
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["location"]["regionCategory"] == "arabian_sea"


def test_post_query_empty_rejected(client: TestClient) -> None:
    """Empty queries must be rejected with 422 Unprocessable Entity."""
    res = client.post("/api/query", json={"query": "   "})
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_post_query_with_authenticated_user(client: TestClient, auth_header: dict) -> None:
    """Authenticated user queries should process smoothly."""
    headers = {"Authorization": auth_header["Authorization"]}
    payload = {
        "query": "Check equatorial Indian Ocean salinity",
        "context": {"preferred_region": "equatorial_indian_ocean"},
    }
    res = client.post("/api/query", json=payload, headers=headers)
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["location"]["regionCategory"] == "equatorial_indian_ocean"


# ==============================================================================
# 3. Fleet Floats (/api/floats)
# ==============================================================================

def test_get_floats_filtering(client: TestClient) -> None:
    """Tests GET /api/floats with region and status filters."""
    # 1. All floats
    res_all = client.get("/api/floats")
    assert res_all.status_code == status.HTTP_200_OK
    floats_all = res_all.json()
    assert isinstance(floats_all, list)
    assert len(floats_all) > 0
    first = floats_all[0]
    assert "id" in first
    assert "wmoNumber" in first
    assert "latitude" in first
    assert "longitude" in first
    assert "status" in first

    # 2. Filter by Bay of Bengal
    res_bob = client.get("/api/floats?region=bay_of_bengal")
    assert res_bob.status_code == status.HTTP_200_OK
    assert isinstance(res_bob.json(), list)

    # 3. Filter by Arabian Sea
    res_as = client.get("/api/floats?region=arabian_sea")
    assert res_as.status_code == status.HTTP_200_OK
    assert isinstance(res_as.json(), list)


# ==============================================================================
# 4. Float Details & Trajectory (/api/floats/{float_id})
# ==============================================================================

def test_get_float_details_and_empty_trajectory(client: TestClient) -> None:
    """Tests GET /api/floats/{float_id} returns metadata and explicitly empty trajectory."""
    # First get a valid float ID from fleet
    floats = client.get("/api/floats").json()
    target_float = floats[0]["wmoNumber"]

    res = client.get(f"/api/floats/{target_float}")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["wmoNumber"] == target_float
    assert data["status"] == "Active"
    assert data["trajectory"] == []  # Unfabricated; trajectory tracking unsupported


def test_get_float_details_not_found(client: TestClient) -> None:
    """Non-existent float returns 404 Not Found."""
    res = client.get("/api/floats/9999999999")
    assert res.status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 5. Float Profile (/api/floats/{float_id}/profile)
# ==============================================================================

def test_get_float_profile_success(client: TestClient) -> None:
    """Tests GET /api/floats/{float_id}/profile returns vertical water column points."""
    floats = client.get("/api/floats").json()
    target_float = floats[0]["wmoNumber"]

    res = client.get(f"/api/floats/{target_float}/profile")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["float_id"] == target_float
    assert data["point_count"] > 0
    assert len(data["profile"]) > 0
    first_pt = data["profile"][0]
    assert "depth" in first_pt
    assert "temperature" in first_pt
    assert "salinity" in first_pt
    assert first_pt["density"] is None
    assert first_pt["oxygen"] is None


def test_get_float_profile_not_found(client: TestClient) -> None:
    """Non-existent float profile returns 404 Not Found."""
    res = client.get("/api/floats/non_existent_float_123/profile")
    assert res.status_code == status.HTTP_404_NOT_FOUND


# ==============================================================================
# 6. Fleet Status (/api/fleet/status)
# ==============================================================================

def test_get_fleet_status_metrics(client: TestClient) -> None:
    """Tests GET /api/fleet/status returns accurate count summaries without hardcoded fake values."""
    res = client.get("/api/fleet/status")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_floats"] >= 0
    assert data["active_floats"] >= 0
    assert "regions" in data
    assert "variables_supported" in data
    assert "TEMP" in data["variables_supported"]
    assert "PSAL" in data["variables_supported"]
    assert "last_updated" in data


# ==============================================================================
# 7. Ocean Comparator (/api/ocean/compare)
# ==============================================================================

def test_get_ocean_compare_regional(client: TestClient) -> None:
    """Tests GET /api/ocean/compare comparing Bay of Bengal and Arabian Sea."""
    res = client.get("/api/ocean/compare?region_a=bay_of_bengal&region_b=arabian_sea&variable=TEMP")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] == "success"
    assert data["variable"] == "TEMP"
    assert data["unit"] == "°C"
    assert len(data["metrics"]) > 0
    assert len(data["summary"]) > 20


def test_get_ocean_compare_floats(client: TestClient) -> None:
    """Tests GET /api/ocean/compare comparing two specific floats."""
    floats = client.get("/api/floats").json()
    float_a = floats[0]["wmoNumber"]
    float_b = floats[1]["wmoNumber"] if len(floats) > 1 else float_a

    res = client.get(f"/api/ocean/compare?float_id_a={float_a}&float_id_b={float_b}&variable=PSAL")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["variable"] == "PSAL"
    assert data["unit"] == "PSU"
