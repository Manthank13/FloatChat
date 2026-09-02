from unittest.mock import MagicMock, patch
import pytest
from fastapi import Request, status
from fastapi.testclient import TestClient
from app.api.deps import get_current_user_optional
from app.core.exceptions import global_exception_handler
from app.services.mock import MockArgoDataSource


def test_request_id_middleware_generated(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0


def test_request_id_middleware_custom_header_preserved(client: TestClient) -> None:
    custom_id = "test-correlation-id-12345"
    response = client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("X-Request-ID") == custom_id


def test_readiness_probe_endpoint(client: TestClient) -> None:
    with patch("app.api.v1.endpoints.health.get_argo_data_source", return_value=MockArgoDataSource()):
        response = client.get("/api/v1/health/readiness")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["status"] == "ready"
        assert data["data_provider"] == "mock"
        assert data["checks"]["config_loaded"] is True


def test_clean_validation_error_format(client: TestClient) -> None:
    # Trigger validation error on POST query endpoint with invalid latitude > 90
    response = client.post("/api/v1/observations/query", json={"latitude": 120.0, "longitude": 0.0})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == 422
    assert "request_id" in data["error"]
    assert "details" in data["error"]


@pytest.mark.asyncio
async def test_auth_readiness_dependency_stub() -> None:
    # No auth header -> returns None
    res_none = await get_current_user_optional(authorization=None)
    assert res_none is None

    # Bearer token present -> returns unverified token context
    res_token = await get_current_user_optional(authorization="Bearer test_jwt_token_abc123")
    assert res_token is not None
    assert res_token["status"] == "unverified_token_present"


@pytest.mark.asyncio
async def test_global_exception_handler_masking() -> None:
    mock_request = MagicMock(spec=Request)
    mock_request.method = "GET"
    mock_request.url.path = "/api/v1/test"
    mock_request.state.request_id = "req-test-123"

    with patch("app.core.config.settings.ENVIRONMENT", "production"):
        response = await global_exception_handler(mock_request, RuntimeError("Secret database password failure!"))
        assert response.status_code == 500

        import json
        body = json.loads(response.body.decode())
        assert body["error"]["code"] == 500
        assert "Secret database password" not in body["error"]["message"]
        assert body["error"]["message"] == "Internal server error occurred."
