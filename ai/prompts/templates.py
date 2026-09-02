"""
Prompt templates and few-shot examples for structured query parsing and data response synthesis.
"""

from typing import Any, Dict, List

QUERY_PARSER_USER_TEMPLATE = """Convert the following user query into the StructuredQuery JSON format:

User Query: "{query}"

JSON Response:"""

FEW_SHOT_QUERY_PARSER_EXAMPLES: List[Dict[str, Any]] = [
    {
        "query": "Show me the salinity near Chennai at 100 meters.",
        "expected_output": {
            "intent": "profile_query",
            "location": {
                "name": "Chennai",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "bounding_box": None,
            },
            "radius_km": 50.0,
            "parameters": ["PSAL"],
            "depth_min": 100.0,
            "depth_max": 100.0,
            "target_depth": 100.0,
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.95,
            "is_valid": True,
        },
    },
    {
        "query": "What is the sea temperature in the Arabian Sea?",
        "expected_output": {
            "intent": "spatial_query",
            "location": {
                "name": "Arabian Sea",
                "latitude": 16.0,
                "longitude": 64.0,
                "bounding_box": [8.0, 50.0, 25.0, 77.0],
            },
            "radius_km": 500.0,
            "parameters": ["TEMP"],
            "depth_min": None,
            "depth_max": None,
            "target_depth": None,
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.85,
            "is_valid": True,
        },
    },
    {
        "query": "Track float 2903334 and show its recent trajectory.",
        "expected_output": {
            "intent": "float_query",
            "location": None,
            "radius_km": None,
            "parameters": [],
            "depth_min": None,
            "depth_max": None,
            "target_depth": None,
            "time_range": None,
            "platform_id": "2903334",
            "comparison": None,
            "confidence": 0.95,
            "is_valid": True,
        },
    },
    {
        "query": "Compare salinity in Arabian Sea vs Bay of Bengal between 0 and 200m.",
        "expected_output": {
            "intent": "comparison_query",
            "location": {
                "name": "Arabian Sea",
                "latitude": 16.0,
                "longitude": 64.0,
            },
            "radius_km": 500.0,
            "parameters": ["PSAL"],
            "depth_min": 0.0,
            "depth_max": 200.0,
            "target_depth": None,
            "time_range": None,
            "platform_id": None,
            "comparison": {
                "comparison_type": "location",
                "target_a": "Arabian Sea",
                "target_b": "Bay of Bengal",
            },
            "confidence": 0.95,
            "is_valid": True,
        },
    },
]
