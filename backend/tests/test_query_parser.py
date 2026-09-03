"""
Comprehensive test suite for FloatChat AI Natural Language Query Parser.

Verifies deterministic extraction of:
- Oceanographic parameters (PSAL, TEMP, DOXY, PRES, CHLA, etc.)
- Locations and controlled city coordinate resolution (Chennai, Mumbai, etc.)
- Explicit cardinal and decimal coordinates
- Single depths, depth ranges, and depth layers
- Search radii and offshore distances
- Temporal expressions (absolute year/month, seasonal, and relative windows)
- Entity comparisons (depth-level and location-level)
- ARGO float platform WMO IDs
- Schema validation and domain boundary error handling
"""

import unittest
from app.ai.models import (
    BoundingBox,
    ComparisonFilter,
    Coordinates,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from app.ai.mappings.parser import DeterministicQueryParser


class TestQueryParserPhase2(unittest.TestCase):
    """Test suite covering all realistic oceanographic user queries."""

    def setUp(self):
        self.parser = DeterministicQueryParser()

    # ==========================================
    # 1. Parameter Extraction Tests
    # ==========================================
    def test_salinity_extraction(self):
        """Verify extraction of salinity synonyms (PSAL, practical salinity, salt)."""
        q1 = "What is the salinity 20 km offshore from Chennai?"
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertIn(OceanParameter.PSAL, r1.parameters)

        q2 = "Show practical salinity near Mumbai"
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertIn(OceanParameter.PSAL, r2.parameters)

    def test_temperature_extraction(self):
        """Verify extraction of temperature synonyms (TEMP, sea water temp, sst)."""
        q1 = "Show temperature near Chennai at 100 meters."
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertIn(OceanParameter.TEMP, r1.parameters)

        q2 = "What is the sea water temperature in the Arabian Sea?"
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertIn(OceanParameter.TEMP, r2.parameters)

    def test_oxygen_extraction(self):
        """Verify extraction of dissolved oxygen (DOXY, oxygen concentration)."""
        q1 = "Show oxygen concentration around the Bay of Bengal."
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertIn(OceanParameter.DOXY, r1.parameters)
        self.assertEqual(r1.intent, QueryIntent.SPATIAL_QUERY)

        q2 = "What is the dissolved oxygen at 50m in Arabian Sea?"
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertIn(OceanParameter.DOXY, r2.parameters)

    # ==========================================
    # 2. Location & Coordinates Resolution
    # ==========================================
    def test_chennai_location_resolution(self):
        """Verify deterministic resolution of Chennai coordinates."""
        q = "Show temperature near Chennai at 100 meters."
        r = self.parser.parse(q)
        self.assertTrue(r.is_valid)
        self.assertIsNotNone(r.location)
        self.assertEqual(r.location.name, "Chennai")
        self.assertAlmostEqual(r.location.latitude, 13.0827, places=3)
        self.assertAlmostEqual(r.location.longitude, 80.2707, places=3)

    def test_explicit_cardinal_coordinates(self):
        """Verify cardinal coordinate parsing: '13.08 N, 80.27 E' and '13.08 S, 80.27 W'."""
        q1 = "What is the PSAL at 200m near 13.08 N, 80.27 E?"
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertIn(OceanParameter.PSAL, r1.parameters)
        self.assertIsNotNone(r1.location)
        self.assertAlmostEqual(r1.location.latitude, 13.08, places=2)
        self.assertAlmostEqual(r1.location.longitude, 80.27, places=2)
        self.assertEqual(r1.depth_min, 200.0)

        # Southern/Western hemisphere negative coordinate parsing
        q2 = "Show temperature at 15.5 S, 65.2 W at 50m"
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertAlmostEqual(r2.location.latitude, -15.5, places=2)
        self.assertAlmostEqual(r2.location.longitude, -65.2, places=2)

    # ==========================================
    # 3. Depth & Layer Extraction Tests
    # ==========================================
    def test_single_and_range_depth_extraction(self):
        """Verify single target depth and depth ranges."""
        # Single depth
        q1 = "Show salinity at 100 meters near Chennai"
        r1 = self.parser.parse(q1)
        self.assertEqual(r1.depth.target_depth, 100.0)
        self.assertEqual(r1.depth_min, 100.0)
        self.assertEqual(r1.depth_max, 100.0)

        # Depth range
        q2 = "Show temperature between 0 and 500 meters in Arabian Sea"
        r2 = self.parser.parse(q2)
        self.assertEqual(r2.depth.depth_min, 0.0)
        self.assertEqual(r2.depth.depth_max, 500.0)

        # Descriptive layer
        q3 = "Show surface salinity near Kochi"
        r3 = self.parser.parse(q3)
        self.assertEqual(r3.depth.depth_min, 0.0)
        self.assertEqual(r3.depth.depth_max, 10.0)

    # ==========================================
    # 4. Radius & Offshore Distance Extraction
    # ==========================================
    def test_radius_and_offshore_extraction(self):
        """Verify extraction of offshore distance and radial search constraints."""
        q1 = "What is the salinity 20 km offshore from Chennai?"
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertEqual(r1.radius_km, 20.0)
        self.assertEqual(r1.location.name, "Chennai")

        q2 = "Find ARGO measurements within 50 km of Chennai."
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertEqual(r2.radius_km, 50.0)
        self.assertEqual(r2.location.name, "Chennai")
        self.assertEqual(r2.intent, QueryIntent.SPATIAL_QUERY)

    # ==========================================
    # 5. Temporal Constraints & Relative Windows
    # ==========================================
    def test_absolute_and_relative_time_extraction(self):
        """Verify month/year temporal filters and relative time windows."""
        # Absolute month + year
        q1 = "What is the temperature near Chennai during January 2025?"
        r1 = self.parser.parse(q1)
        self.assertTrue(r1.is_valid)
        self.assertIsNotNone(r1.time_range)
        self.assertEqual(r1.time_range.year, 2025)
        self.assertEqual(r1.time_range.month, 1)
        self.assertEqual(r1.time_range.start_date, "2025-01-01")
        self.assertEqual(r1.time_range.end_date, "2025-01-31")

        # Relative time window (last 30 days)
        q2 = "What is the salinity at 100 meters near Chennai over the last 30 days?"
        r2 = self.parser.parse(q2)
        self.assertTrue(r2.is_valid)
        self.assertIsNotNone(r2.time_range)
        self.assertEqual(r2.time_range.relative_days, 30)
        self.assertEqual(r2.depth_min, 100.0)

    # ==========================================
    # 6. Comparison Query Tests (Depth & Location)
    # ==========================================
    def test_depth_comparison_query(self):
        """Verify depth comparison: 'Compare salinity at 100m and 500m near Chennai.'"""
        q = "Compare salinity at 100m and 500m near Chennai."
        r = self.parser.parse(q)
        self.assertTrue(r.is_valid)
        self.assertEqual(r.intent, QueryIntent.COMPARISON_QUERY)
        self.assertIn(OceanParameter.PSAL, r.parameters)
        self.assertIsNotNone(r.comparison)
        self.assertEqual(r.comparison.comparison_type, "depth")
        self.assertEqual(r.comparison.target_a, "100.0m")
        self.assertEqual(r.comparison.target_b, "500.0m")
        self.assertEqual(r.comparison.depth_a.target_depth, 100.0)
        self.assertEqual(r.comparison.depth_b.target_depth, 500.0)

    def test_location_comparison_query(self):
        """Verify location comparison: 'Compare salinity in Arabian Sea vs Bay of Bengal'"""
        q = "Compare salinity in Arabian Sea vs Bay of Bengal"
        r = self.parser.parse(q)
        self.assertTrue(r.is_valid)
        self.assertEqual(r.intent, QueryIntent.COMPARISON_QUERY)
        self.assertIn(OceanParameter.PSAL, r.parameters)
        self.assertIsNotNone(r.comparison)
        self.assertEqual(r.comparison.comparison_type, "location")
        self.assertEqual(r.comparison.target_a, "Arabian Sea")
        self.assertEqual(r.comparison.target_b, "Bay of Bengal")

    # ==========================================
    # 7. Float Identifier & Status Query
    # ==========================================
    def test_argo_float_query(self):
        """Verify extraction of 7-digit ARGO float WMO numbers."""
        q = "Track float 2903334 and show its trajectory"
        r = self.parser.parse(q)
        self.assertTrue(r.is_valid)
        self.assertEqual(r.intent, QueryIntent.FLOAT_QUERY)
        self.assertEqual(r.platform_id, "2903334")

    # ==========================================
    # 8. Validation and Malformed Query Tests
    # ==========================================
    def test_invalid_latitude_validation(self):
        """Ensure latitude outside [-90, 90] fails validation without crashing."""
        q = "Show salinity at lat 120.0 lon 80.0"
        r = self.parser.parse(q)
        self.assertFalse(r.is_valid)
        self.assertLessEqual(r.confidence, 0.2)
        self.assertTrue(any("latitude" in err.lower() for err in r.validation_errors))

    def test_invalid_longitude_validation(self):
        """Ensure longitude outside [-180, 180] fails validation without crashing."""
        q = "Show temperature at lat 13.0 lon 250.0"
        r = self.parser.parse(q)
        self.assertFalse(r.is_valid)
        self.assertLessEqual(r.confidence, 0.2)
        self.assertTrue(any("longitude" in err.lower() for err in r.validation_errors))

    def test_invalid_depth_range_validation(self):
        """Ensure negative depth or depth_min > depth_max fails validation."""
        sq = StructuredQuery(
            raw_query="invalid test",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            depth=DepthFilter(depth_min=500.0, depth_max=100.0),
        )
        validated = self.parser._validate_and_normalize(sq)
        self.assertFalse(validated.is_valid)
        self.assertLessEqual(validated.confidence, 0.2)
        self.assertTrue(any("cannot exceed" in err.lower() for err in validated.validation_errors))

    def test_unknown_and_ambiguous_queries(self):
        """Ensure out-of-domain and non-oceanographic queries are flagged unknown."""
        queries = [
            "Tell me a funny joke about dolphins",
            "What is the capital of France?",
            "asdlkfjsdf9023",
        ]
        for q in queries:
            r = self.parser.parse(q)
            self.assertEqual(r.intent, QueryIntent.UNKNOWN)
            self.assertFalse(r.is_valid)
            self.assertLessEqual(r.confidence, 0.2)
            self.assertTrue(len(r.validation_errors) > 0)


if __name__ == "__main__":
    unittest.main()
