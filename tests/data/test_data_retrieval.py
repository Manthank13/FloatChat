"""
Unit tests for the FloatChat ARGO Data Retrieval Layer, MockDataRetriever,
and DataSummary generators.
"""

import unittest
from ai.engine import FloatChatAIEngine
from ai.models import (
    BoundingBox,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from data.argo_loader import SampleArgoDataSource
from data.models import ArgoObservation, DataSummary, ObservationQC, RetrievalResult
from data.query_engine import (
    ArgoDataRetriever,
    DataRetriever,
    MockDataRetriever,
    RealArgoRetriever,
)
from data.spatial import haversine_distance, is_point_within_radius


class TestDataRetrievalLayer(unittest.TestCase):
    """Test suite for ARGO data querying, filtering, and calculation."""

    def setUp(self):
        self.mock_retriever = MockDataRetriever()
        self.retriever = DataRetriever()
        self.engine = FloatChatAIEngine()

    # ==========================================
    # 1. Parameter Filtering & Statistics
    # ==========================================
    def test_salinity_retrieval(self):
        """Verify salinity retrieval and summary statistics."""
        sq = StructuredQuery(
            raw_query="Show salinity near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        self.assertGreater(res.total_matched_observations, 0)
        self.assertIn("PSAL", res.summary_statistics)
        self.assertIsNotNone(res.summary_statistics["PSAL"]["mean"])
        self.assertIsNotNone(res.summary.mean_salinity)
        mean_psal = res.summary.mean_salinity
        self.assertGreater(mean_psal, 30.0)
        self.assertLess(mean_psal, 38.0)

    def test_temperature_retrieval(self):
        """Verify temperature retrieval and statistical calculations."""
        bbox_data = self.engine.get_known_locations()["arabian sea"]["bounding_box"]
        sq = StructuredQuery(
            raw_query="Show temperature in Arabian Sea",
            intent=QueryIntent.SPATIAL_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(
                name="Arabian Sea",
                latitude=16.0,
                longitude=64.0,
                bounding_box=bbox_data,
            ),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        self.assertIn("TEMP", res.summary_statistics)
        self.assertGreater(res.summary_statistics["TEMP"]["count"], 0)
        self.assertIsNotNone(res.summary.mean_temperature)

    def test_oxygen_retrieval(self):
        """Verify dissolved oxygen (DOXY) retrieval from BGC float."""
        bbox_data = self.engine.get_known_locations()["bay of bengal"]["bounding_box"]
        sq = StructuredQuery(
            raw_query="Show oxygen concentration around Bay of Bengal",
            intent=QueryIntent.SPATIAL_QUERY,
            parameters=[OceanParameter.DOXY],
            location=LocationFilter(
                name="Bay of Bengal",
                bounding_box=bbox_data,
            ),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        self.assertIn("DOXY", res.summary_statistics)
        self.assertGreater(res.summary_statistics["DOXY"]["count"], 0)

    # ==========================================
    # 2. Location & Radius Filtering
    # ==========================================
    def test_chennai_radius_filtering_20km_vs_50km(self):
        """Verify radius constraint enforcement (Float 2903334 is ~20.8 km from Chennai center)."""
        # 10 km radius: should find 0 observations
        sq_10km = StructuredQuery(
            raw_query="Salinity within 10 km of Chennai",
            intent=QueryIntent.SPATIAL_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=10.0),
            radius_km=10.0,
        )
        res_10km = self.retriever.retrieve(sq_10km)
        self.assertTrue(res_10km.is_empty)
        self.assertEqual(res_10km.total_matched_observations, 0)

        # 50 km radius: should match observations from float 2903334
        sq_50km = StructuredQuery(
            raw_query="Salinity within 50 km of Chennai",
            intent=QueryIntent.SPATIAL_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            radius_km=50.0,
        )
        res_50km = self.retriever.retrieve(sq_50km)
        self.assertFalse(res_50km.is_empty)
        self.assertIn("2903334", res_50km.matched_platforms)
        self.assertIsNotNone(res_50km.matched_observations[0].distance_km)
        self.assertAlmostEqual(res_50km.matched_observations[0].distance_km, 20.8, delta=2.0)

    # ==========================================
    # 3. Depth Filtering (Single & Range)
    # ==========================================
    def test_single_target_depth_filtering_at_100m(self):
        """Verify exact depth target filtering matches nearest depth level (~100m)."""
        sq = StructuredQuery(
            raw_query="Salinity at 100 meters near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            depth=DepthFilter(target_depth=100.0, depth_min=100.0, depth_max=100.0),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        for obs in res.matched_observations:
            self.assertAlmostEqual(obs.depth_m, 100.0, delta=5.0)

    def test_depth_range_filtering_50m_to_200m(self):
        """Verify depth range filtering (50m to 200m)."""
        sq = StructuredQuery(
            raw_query="Temperature between 50 and 200 meters near Kochi",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(name="Kochi", latitude=9.9312, longitude=76.2673, radius_km=50.0),
            depth=DepthFilter(depth_min=50.0, depth_max=200.0),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        for obs in res.matched_observations:
            self.assertGreaterEqual(obs.depth_m, 49.0)
            self.assertLessEqual(obs.depth_m, 201.0)

    # ==========================================
    # 4. Temporal Filtering
    # ==========================================
    def test_temporal_filtering_january_2025(self):
        """Verify monthly date filtering for January 2025."""
        sq = StructuredQuery(
            raw_query="Temperature near Chennai in January 2025",
            intent=QueryIntent.TEMPORAL_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            time_range=TimeRangeFilter(start_date="2025-01-01", end_date="2025-01-31", year=2025, month=1),
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        for obs in res.matched_observations:
            self.assertTrue(obs.timestamp.startswith("2025-01"))

    # ==========================================
    # 5. Platform ID Filtering
    # ==========================================
    def test_platform_filtering_by_wmo_id(self):
        """Verify platform filtering exclusively returns specified Float ID."""
        sq = StructuredQuery(
            raw_query="Show data for float 5906432",
            intent=QueryIntent.FLOAT_QUERY,
            platform_id="5906432",
        )
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        self.assertEqual(res.matched_platforms, ["5906432"])
        for obs in res.matched_observations:
            self.assertEqual(obs.platform_id, "5906432")

    # ==========================================
    # 6. Quality Control & Bad Value Rejection
    # ==========================================
    def test_qc_filtering_rejects_bad_measurements(self):
        """Verify observations with bad QC flag (QC=4) are automatically discarded."""
        res = self.retriever.retrieve(
            StructuredQuery(
                raw_query="All measurements near Chennai",
                intent=QueryIntent.PROFILE_QUERY,
                parameters=[OceanParameter.TEMP, OceanParameter.PSAL],
                location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            )
        )
        for obs in res.matched_observations:
            self.assertNotIn(obs.temp_qc, [4, 9])
            self.assertNotIn(obs.psal_qc, [4, 9])
            self.assertNotEqual(obs.temp_c, 99.99)

    # ==========================================
    # 7. No Matching Data & Invalid Query Handling
    # ==========================================
    def test_no_matching_data_returns_structured_empty_result(self):
        """Verify querying coordinates with no float coverage returns structured empty response."""
        sq = StructuredQuery(
            raw_query="Salinity at point 0.0, 0.0",
            intent=QueryIntent.SPATIAL_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(latitude=0.0, longitude=0.0, radius_km=10.0),
        )
        res = self.retriever.retrieve(sq)
        self.assertTrue(res.is_empty)
        self.assertEqual(res.total_matched_observations, 0)
        self.assertEqual(len(res.matched_observations), 0)
        self.assertTrue("No ARGO float observations found" in res.message)

    def test_invalid_structured_query_returns_error_result(self):
        """Verify invalid StructuredQuery returns error result without crashing."""
        sq = StructuredQuery(
            raw_query="broken query",
            intent=QueryIntent.UNKNOWN,
            is_valid=False,
            validation_errors=["Unresolved location", "Missing parameters"],
            confidence=0.1,
        )
        res = self.retriever.retrieve(sq)
        self.assertTrue(res.is_empty)
        self.assertEqual(res.total_matched_observations, 0)
        self.assertTrue(any("validation failed" in res.message.lower() for _ in [1]))
        self.assertEqual(len(res.errors), 2)

    # ==========================================
    # 8. DataSummary & Statistical Text Generation
    # ==========================================
    def test_data_summary_generation_and_text(self):
        """Verify DataSummary computes bounds and human-readable text."""
        sq = StructuredQuery(
            raw_query="Salinity near Chennai at 100m",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL, OceanParameter.TEMP],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.mock_retriever.retrieve(sq)
        self.assertIsNotNone(res.summary)
        self.assertGreater(res.summary.number_of_observations, 0)
        self.assertIn("2903334", res.summary.floats_represented)
        summary_text = res.summary.to_text_summary()
        self.assertIn("Retrieved", summary_text)
        self.assertIn("2903334", summary_text)

    # ==========================================
    # 9. RealArgoRetriever Adapter
    # ==========================================
    def test_real_argo_retriever_adapter(self):
        """Verify RealArgoRetriever initializes cleanly for NetCDF and Parquet."""
        retriever_nc = RealArgoRetriever(source_type="netcdf", source_path="dummy_path.nc")
        self.assertIsNotNone(retriever_nc)
        retriever_pq = RealArgoRetriever(source_type="parquet", source_path="dummy_path.parquet")
        self.assertIsNotNone(retriever_pq)

    # ==========================================
    # 10. End-to-End Pipeline Integration (Parser -> Data Retrieval)
    # ==========================================
    def test_end_to_end_pipeline_chennai_salinity(self):
        """Full end-to-end integration: prompt -> AI parser -> Data retrieval result."""
        query = "What is the salinity near Chennai at 100 meters?"
        sq, data_res = self.engine.execute_pipeline(query, use_llm=False)

        self.assertTrue(sq.is_valid)
        self.assertEqual(sq.intent, QueryIntent.PROFILE_QUERY)
        self.assertIn(OceanParameter.PSAL, sq.parameters)
        self.assertEqual(sq.location.name, "Chennai")
        self.assertEqual(sq.depth_min, 100.0)

        self.assertFalse(data_res.is_empty)
        self.assertGreater(data_res.total_matched_observations, 0)
        self.assertIn("2903334", data_res.matched_platforms)
        self.assertIn("PSAL", data_res.summary_statistics)
        self.assertAlmostEqual(data_res.matched_observations[0].depth_m, 100.0, delta=5.0)

    def test_end_to_end_pipeline_kochi_temperature(self):
        """Full end-to-end integration: prompt -> AI parser -> Data retrieval result for Kochi."""
        query = "Show me temperature around Kochi between 50 and 200 meters."
        sq, data_res = self.engine.execute_pipeline(query, use_llm=False)

        self.assertTrue(sq.is_valid)
        self.assertFalse(data_res.is_empty)
        self.assertIn("5906432", data_res.matched_platforms)
        self.assertIn("TEMP", data_res.summary_statistics)
        for obs in data_res.matched_observations:
            self.assertGreaterEqual(obs.depth_m, 49.0)
            self.assertLessEqual(obs.depth_m, 201.0)


if __name__ == "__main__":
    unittest.main()
