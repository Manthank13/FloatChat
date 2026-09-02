"""
Unit tests for the FloatChat AI Natural Language Query Parser and Pydantic models.
"""

import unittest
from pydantic import ValidationError
from ai.models import (
    BoundingBox,
    Coordinates,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from ai.mappings.parser import DeterministicQueryParser


class TestQueryParser(unittest.TestCase):
    """Test suite for DeterministicQueryParser and StructuredQuery generation."""

    def setUp(self):
        self.parser = DeterministicQueryParser()

    def test_salinity_query_chennai_at_100m(self):
        """Test classic prompt: 'Show me the salinity near Chennai at 100 meters.'"""
        query = "Show me the salinity near Chennai at 100 meters."
        result = self.parser.parse(query)

        self.assertIsInstance(result, StructuredQuery)
        self.assertTrue(result.is_valid)
        self.assertEqual(result.intent, QueryIntent.PROFILE_QUERY)
        self.assertIn(OceanParameter.PSAL, result.parameters)
        self.assertIsNotNone(result.location)
        self.assertEqual(result.location.name, "Chennai")
        self.assertAlmostEqual(result.location.latitude, 13.0827, places=2)
        self.assertAlmostEqual(result.location.longitude, 80.2707, places=2)
        self.assertIsNotNone(result.depth)
        self.assertEqual(result.depth.target_depth, 100.0)
        self.assertEqual(result.depth_min, 100.0)
        self.assertEqual(result.depth_max, 100.0)

        # Check backend dict export
        backend_dict = result.to_backend_dict()
        self.assertEqual(backend_dict["intent"], "profile_query")
        self.assertEqual(backend_dict["parameters"], ["PSAL"])
        self.assertEqual(backend_dict["depth_min"], 100.0)
        self.assertEqual(backend_dict["depth_max"], 100.0)
        self.assertEqual(backend_dict["location"]["name"], "Chennai")

    def test_temperature_query_arabian_sea(self):
        """Test spatial query: 'What is the sea temperature in the Arabian Sea?'"""
        query = "What is the sea temperature in the Arabian Sea?"
        result = self.parser.parse(query)

        self.assertTrue(result.is_valid)
        self.assertEqual(result.intent, QueryIntent.SPATIAL_QUERY)
        self.assertIn(OceanParameter.TEMP, result.parameters)
        self.assertIsNotNone(result.location)
        self.assertEqual(result.location.name, "Arabian Sea")
        self.assertIsNotNone(result.location.bounding_box)
        self.assertEqual(result.location.bounding_box.min_latitude, 8.0)
        self.assertEqual(result.location.bounding_box.max_latitude, 25.0)

    def test_depth_range_extraction(self):
        """Test depth range queries with various formats."""
        # Range with between ... and ...
        q1 = "Show temperature between 50 and 500 meters in Bay of Bengal"
        r1 = self.parser.parse(q1)
        self.assertIsNotNone(r1.depth)
        self.assertEqual(r1.depth.depth_min, 50.0)
        self.assertEqual(r1.depth.depth_max, 500.0)

        # Descriptive layer: 'surface'
        q2 = "Show sea surface temperature near Mumbai"
        r2 = self.parser.parse(q2)
        self.assertIsNotNone(r2.depth)
        self.assertEqual(r2.depth.depth_min, 0.0)
        self.assertEqual(r2.depth.depth_max, 10.0)

    def test_location_and_radius_extraction(self):
        """Test custom coordinates and explicit radius."""
        q = "Find salinity at lat 13.08 lon 80.27 within 30 km"
        r = self.parser.parse(q)
        self.assertTrue(r.is_valid)
        self.assertIsNotNone(r.location)
        self.assertAlmostEqual(r.location.latitude, 13.08, places=2)
        self.assertAlmostEqual(r.location.longitude, 80.27, places=2)
        self.assertEqual(r.radius_km, 30.0)

    def test_float_platform_query(self):
        """Test ARGO float identifier extraction: 'Track float 2903334'"""
        query = "Track float 2903334 and show its trajectory"
        result = self.parser.parse(query)

        self.assertTrue(result.is_valid)
        self.assertEqual(result.intent, QueryIntent.FLOAT_QUERY)
        self.assertEqual(result.platform_id, "2903334")

    def test_comparison_query(self):
        """Test comparison extraction: 'Compare salinity in Arabian Sea vs Bay of Bengal'"""
        query = "Compare salinity in Arabian Sea vs Bay of Bengal"
        result = self.parser.parse(query)

        self.assertTrue(result.is_valid)
        self.assertEqual(result.intent, QueryIntent.COMPARISON_QUERY)
        self.assertIn(OceanParameter.PSAL, result.parameters)
        self.assertIsNotNone(result.comparison)
        self.assertEqual(result.comparison.target_a, "Arabian Sea")
        self.assertEqual(result.comparison.target_b, "Bay of Bengal")

    def test_temporal_query(self):
        """Test seasonal and annual temporal constraints."""
        query = "Show temperature trends in the Indian Ocean during 2023 monsoon"
        result = self.parser.parse(query)

        self.assertTrue(result.is_valid)
        self.assertEqual(result.intent, QueryIntent.TEMPORAL_QUERY)
        self.assertIsNotNone(result.time_range)
        self.assertEqual(result.time_range.year, 2023)
        self.assertEqual(result.time_range.season, "southwest_monsoon")

    def test_unknown_and_ambiguous_queries(self):
        """Test out-of-domain and unparseable queries."""
        query = "Tell me a funny joke about dolphins"
        result = self.parser.parse(query)

        self.assertEqual(result.intent, QueryIntent.UNKNOWN)
        self.assertFalse(result.is_valid)
        self.assertTrue(len(result.validation_errors) > 0)

    def test_pydantic_schema_validation(self):
        """Test Pydantic schema validation rejection for out-of-bounds inputs."""
        with self.assertRaises(ValidationError):
            # Latitude > 90 must fail schema validation
            LocationFilter(latitude=120.0, longitude=80.0)

        with self.assertRaises(ValidationError):
            # Negative radius must fail schema validation
            StructuredQuery(
                raw_query="invalid test",
                intent=QueryIntent.PROFILE_QUERY,
                radius_km=-5.0,
            )

    def test_semantic_validation_errors(self):
        """Test parser semantic validation rules (e.g. depth_min > depth_max)."""
        sq = StructuredQuery(
            raw_query="invalid depth order",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            depth=DepthFilter(depth_min=500.0, depth_max=100.0),
        )
        validated = self.parser._validate_and_normalize(sq)
        self.assertFalse(validated.is_valid)
        self.assertTrue(any("cannot exceed" in err.lower() for err in validated.validation_errors))


if __name__ == "__main__":
    unittest.main()
