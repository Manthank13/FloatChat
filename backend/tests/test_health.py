from fastapi import status
from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    """Test GET /api/v1/health returns HTTP 200 and valid JSON schema."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data
    assert "environment" in data


def test_404_not_found(client: TestClient) -> None:
    """Test 404 handler returns structured error JSON."""
    response = client.get("/api/v1/non-existent-route")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == 404
