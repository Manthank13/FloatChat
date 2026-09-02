from unittest.mock import patch
from fastapi import status
from fastapi.testclient import TestClient
from app.services.mock import MockArgoDataSource


def test_get_float_metadata_mock_provider(client: TestClient) -> None:
    with patch("app.api.v1.endpoints.argo.get_argo_data_source", return_value=MockArgoDataSource()):
        response = client.get("/api/v1/argo/floats/6902746")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["float_id"] == "6902746"
        assert data["is_mock"] is True
        assert data["data_source"] == "mock"


def test_get_float_profiles_mock_provider(client: TestClient) -> None:
    with patch("app.api.v1.endpoints.argo.get_argo_data_source", return_value=MockArgoDataSource()):
        response = client.get("/api/v1/argo/floats/6902746/profiles?limit=3")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3
        assert data[0]["float_id"] == "6902746"
        assert data[0]["is_mock"] is True


def test_search_profiles_endpoint(client: TestClient) -> None:
    with patch("app.api.v1.endpoints.argo.get_argo_data_source", return_value=MockArgoDataSource()):
        response = client.get("/api/v1/argo/profiles/search?min_lat=20&max_lat=30&limit=2")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 2
