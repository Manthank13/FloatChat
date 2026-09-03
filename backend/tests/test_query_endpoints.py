from unittest.mock import patch
from fastapi import status
from fastapi.testclient import TestClient
from app.services.mock import MockArgoDataSource


def test_post_observations_query_endpoint(client: TestClient) -> None:
    with patch("app.services.query.get_argo_data_source", return_value=MockArgoDataSource()):
        payload = {
            "latitude": 25.0,
            "longitude": -75.0,
            "radius_km": 200.0,
            "variable": "TEMP",
            "depth_m": 100.0,
            "limit": 5,
        }
        response = client.post("/api/v1/observations/query", json=payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["count"] > 0
        assert len(data["results"]) <= 5
        assert data["results"][0]["variable"] == "TEMP"


def test_get_observations_query_endpoint(client: TestClient) -> None:
    with patch("app.services.query.get_argo_data_source", return_value=MockArgoDataSource()):
        response = client.get("/api/v1/observations/query?variable=PSAL&limit=3")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["count"] > 0
        assert data["results"][0]["variable"] == "PSAL"


def test_get_observations_nearby_endpoint(client: TestClient) -> None:
    with patch("app.services.query.get_argo_data_source", return_value=MockArgoDataSource()):
        url = "/api/v1/observations/nearby?latitude=25.0&longitude=-75.0&radius_km=150.0&variable=TEMP"
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["count"] > 0
        assert all(r["distance_km"] <= 150.0 for r in data["results"])


def test_get_floats_nearby_endpoint(client: TestClient) -> None:
    with patch("app.services.query.get_argo_data_source", return_value=MockArgoDataSource()):
        url = "/api/v1/floats/nearby?latitude=25.0&longitude=-75.0&radius_km=300.0&limit=5"
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "distance_km" in data[0]


def test_query_endpoint_invalid_params_error(client: TestClient) -> None:
    # Invalid variable
    response = client.get("/api/v1/observations/query?variable=UNKNOWN_VAR")
    assert response.status_code in (status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST)

    # Invalid latitude
    response = client.get("/api/v1/observations/query?latitude=150.0&longitude=0.0")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
