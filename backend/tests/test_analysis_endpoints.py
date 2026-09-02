from unittest.mock import patch
from fastapi import status
from fastapi.testclient import TestClient
from app.services.mock import MockArgoDataSource


def test_post_statistics_endpoint(client: TestClient) -> None:
    with patch("app.services.analysis.get_argo_data_source", return_value=MockArgoDataSource()):
        payload = {
            "query": {"latitude": 25.0, "longitude": -75.0, "radius_km": 200.0, "limit": 10},
            "target_variable": "TEMP",
        }
        response = client.post("/api/v1/analysis/statistics", json=payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["status"] == "success"
        assert data["variable"] == "TEMP"
        assert data["unit"] == "°C"
        assert data["valid_count"] > 0
        assert "mean" in data
        assert "median" in data
        assert "minimum" in data
        assert "maximum" in data


def test_post_profile_endpoint(client: TestClient) -> None:
    with patch("app.services.analysis.get_argo_data_source", return_value=MockArgoDataSource()):
        payload = {"query": {"float_id": "MOCK6902746", "limit": 10}}
        response = client.post("/api/v1/analysis/profile", json=payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["status"] == "success"
        assert data["float_id"] == "MOCK6902746"
        assert data["point_count"] > 0


def test_post_compare_endpoint(client: TestClient) -> None:
    with patch("app.services.analysis.get_argo_data_source", return_value=MockArgoDataSource()):
        payload = {
            "float_id_a": "MOCK6902746",
            "float_id_b": "MOCK6902747",
            "target_variable": "PSAL",
            "depth_tolerance_m": 10.0,
        }
        response = client.post("/api/v1/analysis/compare", json=payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["status"] == "success"
        assert data["variable"] == "PSAL"
        assert data["matched_levels_count"] > 0


def test_post_trend_endpoint(client: TestClient) -> None:
    with patch("app.services.analysis.get_argo_data_source", return_value=MockArgoDataSource()):
        payload = {
            "query": {"float_id": "MOCK6902746", "limit": 10},
            "target_variable": "TEMP",
        }
        response = client.post("/api/v1/analysis/trend", json=payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["status"] == "success"
        assert data["variable"] == "TEMP"
        assert "absolute_change" in data
