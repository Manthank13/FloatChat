"""
Unit tests for FloatChat Real ARGO Data Providers, Normalization, and Configuration.

Mocks remote HTTP requests and synthetic dataset streams to ensure 100% deterministic,
offline testability without external network dependencies or credentials.
"""

import json
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from ai.engine import FloatChatAIEngine
from ai.models import (
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
)
from data.config import DataConfig
from data.models import ArgoObservation, RetrievalResult
from data.normalization import (
    clean_numeric,
    convert_argo_juld_to_iso,
    normalize_observation_dict,
    parse_qc_flag,
)
from data.providers import (
    ArgovisRESTProvider,
    BaseArgoProvider,
    NetCDFArgoProvider,
    ParquetArgoProvider,
    SampleArgoProvider,
    create_argo_provider,
)
from data.query_engine import (
    ArgoDataRetriever,
    MockDataRetriever,
    RealArgoRetriever,
)


class TestRealArgoProviders(unittest.TestCase):
    """Test suite for ARGO data providers, normalization, and configuration."""

    # ==========================================
    # 1. Normalization & Sanitization Utilities
    # ==========================================
    def test_clean_numeric_handles_nans_and_fillvalues(self):
        """Verify numeric cleaner strips NaNs, Infs, and sentinel ARGO fill values."""
        self.assertIsNone(clean_numeric(float("nan")))
        self.assertIsNone(clean_numeric(float("inf")))
        self.assertIsNone(clean_numeric(99999.0))
        self.assertIsNone(clean_numeric(-999.0))
        self.assertIsNone(clean_numeric("invalid_string"))
        self.assertEqual(clean_numeric("24.52"), 24.52)
        self.assertEqual(clean_numeric(35.123456), 35.1235)

    def test_parse_qc_flag(self):
        """Verify QC parser handles chars, bytes, strings, and default fallbacks."""
        self.assertEqual(parse_qc_flag("1"), 1)
        self.assertEqual(parse_qc_flag(b"4"), 4)
        self.assertEqual(parse_qc_flag(2), 2)
        self.assertEqual(parse_qc_flag(" "), 1)
        self.assertEqual(parse_qc_flag(None), 1)

    def test_convert_argo_juld_to_iso(self):
        """Verify Julian day conversion relative to 1950-01-01."""
        self.assertEqual(convert_argo_juld_to_iso(0.0), "1950-01-01T00:00:00Z")
        iso_str = convert_argo_juld_to_iso(27400.0)
        self.assertTrue(iso_str.startswith("2025-01"))

    def test_normalize_observation_dict(self):
        """Verify raw dictionary mapping into typed ArgoObservation."""
        raw = {
            "platform_number": "2903334",
            "LATITUDE": 13.15,
            "LONGITUDE": 80.45,
            "PRES_ADJUSTED": 100.0,
            "TEMP_ADJUSTED": 24.2,
            "PSAL_ADJUSTED": 34.78,
            "TEMP_QC": "1",
            "PSAL_QC": "1",
            "date": "2025-01-15T06:00:00Z",
        }
        obs = normalize_observation_dict(raw, data_source="TEST_NETCDF")
        self.assertIsNotNone(obs)
        self.assertEqual(obs.platform_id, "2903334")
        self.assertEqual(obs.latitude, 13.15)
        self.assertEqual(obs.longitude, 80.45)
        self.assertEqual(obs.pressure_dbar, 100.0)
        self.assertAlmostEqual(obs.depth_m, 99.3, places=1)
        self.assertEqual(obs.temp_c, 24.2)
        self.assertEqual(obs.psal_psu, 34.78)
        self.assertEqual(obs.temp_qc, 1)

    def test_normalize_observation_dict_invalid_records(self):
        """Verify malformed records with missing coordinates or depths return None."""
        self.assertIsNone(normalize_observation_dict({"platform_id": "123", "temp": 20.0}))
        self.assertIsNone(normalize_observation_dict({"latitude": 999.0, "longitude": 80.0, "pres": 10.0}))

    # ==========================================
    # 2. Provider Factory & Configuration
    # ==========================================
    def test_data_config_and_provider_factory(self):
        """Verify DataConfig construction and create_argo_provider factory."""
        cfg_sample = DataConfig(provider_type="sample")
        p_sample = create_argo_provider(cfg_sample)
        self.assertIsInstance(p_sample, SampleArgoProvider)

        cfg_nc = DataConfig(provider_type="netcdf", data_path="nonexistent.nc")
        p_nc = create_argo_provider(cfg_nc)
        self.assertIsInstance(p_nc, NetCDFArgoProvider)

        cfg_pq = DataConfig(provider_type="parquet", data_path="nonexistent.parquet")
        p_pq = create_argo_provider(cfg_pq)
        self.assertIsInstance(p_pq, ParquetArgoProvider)

        cfg_remote = DataConfig(provider_type="remote")
        p_remote = create_argo_provider(cfg_remote)
        self.assertIsInstance(p_remote, ArgovisRESTProvider)

    # ==========================================
    # 3. NetCDF & Parquet Providers Robustness & Parsing
    # ==========================================
    def test_netcdf_provider_missing_path_returns_empty_gracefully(self):
        """Verify NetCDF provider handles missing files without crashing."""
        provider = NetCDFArgoProvider("nonexistent_path_123.nc")
        obs = provider.load_observations()
        self.assertEqual(obs, [])

    def test_netcdf_synthetic_file_parsing(self):
        """Verify NetCDF parser parsing logic against mock Dataset."""
        mock_nc_module = MagicMock()
        mock_dataset = MagicMock()
        mock_nc_module.Dataset.return_value.__enter__.return_value = mock_dataset

        plat_mock = MagicMock()
        plat_mock.__getitem__.return_value = ["2903334"]

        # Mock variables
        mock_dataset.variables = {
            "PLATFORM_NUMBER": plat_mock,
            "LATITUDE": MagicMock(shape=(1,), __getitem__=lambda s, i: 13.15),
            "LONGITUDE": MagicMock(shape=(1,), __getitem__=lambda s, i: 80.45),
            "JULD": MagicMock(shape=(1,), __getitem__=lambda s, i: 27400.0),
            "CYCLE_NUMBER": MagicMock(shape=(1,), __getitem__=lambda s, i: 42),
            "PRES_ADJUSTED": MagicMock(shape=(1, 2), __getitem__=lambda s, idx: [50.0, 100.0][idx[1]]),
            "TEMP_ADJUSTED": MagicMock(shape=(1, 2), __getitem__=lambda s, idx: [26.0, 23.4][idx[1]]),
            "PSAL_ADJUSTED": MagicMock(shape=(1, 2), __getitem__=lambda s, idx: [34.1, 34.85][idx[1]]),
            "TEMP_ADJUSTED_QC": MagicMock(shape=(1, 2), __getitem__=lambda s, idx: ["1", "1"][idx[1]]),
            "PSAL_ADJUSTED_QC": MagicMock(shape=(1, 2), __getitem__=lambda s, idx: ["1", "1"][idx[1]]),
        }

        provider = NetCDFArgoProvider("dummy.nc")
        parsed_obs = provider._parse_netcdf_file("dummy.nc", mock_nc_module)
        self.assertEqual(len(parsed_obs), 2)
        self.assertEqual(parsed_obs[0].platform_id, "2903334")
        self.assertEqual(parsed_obs[0].temp_c, 26.0)
        self.assertEqual(parsed_obs[1].temp_c, 23.4)

    def test_parquet_provider_missing_path_returns_empty_gracefully(self):
        """Verify Parquet provider handles missing files without crashing."""
        provider = ParquetArgoProvider("nonexistent_path_123.parquet")
        obs = provider.load_observations()
        self.assertEqual(obs, [])

    # ==========================================
    # 4. Remote Argovis REST Provider (Mocked Network)
    # ==========================================
    @patch("urllib.request.urlopen")
    def test_argovis_rest_provider_mocked_success(self, mock_urlopen):
        """Verify ArgovisRESTProvider parsing realistic JSON API payload."""
        mock_response = MagicMock()
        mock_payload = [
            {
                "_id": "2903334_042",
                "platform_number": "2903334",
                "cycle_number": 42,
                "geolocation": {"coordinates": [80.45, 13.15]},
                "timestamp": "2025-01-15T06:30:00Z",
                "data_keys": ["pres", "temp", "psal"],
                "data": [
                    [100.0, 23.4, 34.85],
                    [200.0, 16.5, 35.02],
                ],
            }
        ]
        mock_response.read.return_value = json.dumps(mock_payload).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        provider = ArgovisRESTProvider(config=DataConfig(remote_api_url="https://fake-api.test"))
        sq = StructuredQuery(
            raw_query="Salinity near Chennai at 100m",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(latitude=13.0827, longitude=80.2707, radius_km=50.0),
            depth=DepthFilter(target_depth=100.0),
        )

        obs = provider.query_observations(sq)
        self.assertEqual(len(obs), 2)
        self.assertEqual(obs[0].platform_id, "2903334")
        self.assertEqual(obs[0].temp_c, 23.4)
        self.assertEqual(obs[0].psal_psu, 34.85)

    @patch("urllib.request.urlopen")
    def test_argovis_rest_provider_handles_http_error(self, mock_urlopen):
        """Verify Argovis provider catches HTTP errors gracefully and returns empty list."""
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://fake-api.test",
            code=500,
            msg="Server Error",
            hdrs={},
            fp=None,
        )

        provider = ArgovisRESTProvider(config=DataConfig(remote_api_url="https://fake-api.test"))
        sq = StructuredQuery(
            raw_query="Salinity near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(latitude=13.0827, longitude=80.2707),
        )

        obs = provider.query_observations(sq)
        self.assertEqual(obs, [])

    # ==========================================
    # 5. RealArgoRetriever & Engine Integration
    # ==========================================
    def test_real_argo_retriever_initialization_modes(self):
        """Verify RealArgoRetriever instantiates across source types."""
        r_nc = RealArgoRetriever(source_type="netcdf", source_path="dummy.nc")
        self.assertEqual(r_nc.data_source.name, "NETCDF_ARGO_PROVIDER")

        r_pq = RealArgoRetriever(source_type="parquet", source_path="dummy.parquet")
        self.assertEqual(r_pq.data_source.name, "PARQUET_ARGO_PROVIDER")

        r_sample = RealArgoRetriever(source_type="sample")
        self.assertEqual(r_sample.data_source.name, "SAMPLE_ARGO_PROVIDER")

    def test_float_chat_ai_engine_with_data_config(self):
        """Verify FloatChatAIEngine operates with explicit DataConfig."""
        engine = FloatChatAIEngine(
            data_config=DataConfig(provider_type="sample", default_search_radius_km=50.0)
        )
        sq, res = engine.execute_pipeline("What is the salinity near Chennai at 100 meters?", use_llm=False)
        self.assertTrue(sq.is_valid)
        self.assertFalse(res.is_empty)
        self.assertIn("2903334", res.matched_platforms)
        self.assertIn("PSAL", res.summary_statistics)


if __name__ == "__main__":
    unittest.main()
