from unittest.mock import AsyncMock, patch
import httpx
import pytest
from app.services.erddap import ErddapArgoDataSource
from app.services.factory import get_argo_data_source
from app.services.mock import MockArgoDataSource


@pytest.mark.asyncio
async def test_mock_provider_retrieval() -> None:
    provider = MockArgoDataSource()

    # Float Metadata
    meta = await provider.get_float("MOCK6902746")
    assert meta is not None
    assert meta.float_id == "MOCK6902746"
    assert meta.is_mock is True
    assert meta.data_source == "mock"

    # Profiles
    profiles = await provider.get_float_profiles("MOCK6902746", limit=5)
    assert len(profiles) == 5
    assert all(p.is_mock is True for p in profiles)
    assert all(p.data_source == "mock" for p in profiles)
    assert profiles[0].observation_count > 0

    # Search
    search_res = await provider.search_profiles(min_lat=20, max_lat=30, limit=2)
    assert len(search_res) == 2
    assert all(p.is_mock is True for p in search_res)


@pytest.mark.asyncio
async def test_erddap_provider_mocked_http_success() -> None:
    provider = ErddapArgoDataSource(base_url="https://erddap.test/tabledap/ArgoFloats.json")

    mock_table_json = {
        "table": {
            "columnNames": ["platform_number", "cycle_number", "time", "latitude", "longitude", "pres", "temp", "psal"],
            "rows": [
                ["6902746", 1, "2024-01-01T00:00:00Z", 25.0, -80.0, 10.0, 24.5, 36.1],
                ["6902746", 1, "2024-01-01T00:00:00Z", 25.0, -80.0, 50.0, 22.1, 36.3],
            ],
        }
    }

    with patch.object(provider, "_fetch_erddap_table", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_table_json["table"]

        profiles = await provider.get_float_profiles("6902746", limit=10)
        assert len(profiles) == 1
        assert profiles[0].float_id == "6902746"
        assert profiles[0].is_mock is False
        assert profiles[0].data_source == "erddap_ifremer"
        assert profiles[0].observation_count == 2


@pytest.mark.asyncio
async def test_erddap_provider_network_timeout() -> None:
    provider = ErddapArgoDataSource(base_url="https://erddap.test/tabledap/ArgoFloats.json", timeout=1.0)

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(RuntimeError) as exc_info:
            await provider.get_float_profiles("6902746")
        assert "request timed out" in str(exc_info.value)


def test_factory_provider_selection() -> None:
    mock_p = get_argo_data_source("mock")
    assert isinstance(mock_p, MockArgoDataSource)

    argo_p = get_argo_data_source("argo")
    assert isinstance(argo_p, ErddapArgoDataSource)
