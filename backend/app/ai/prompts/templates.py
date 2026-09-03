"""
Prompt templates and few-shot examples for structured query parsing and data response synthesis.
"""

from typing import Any, Dict, List

QUERY_PARSER_USER_TEMPLATE = """Convert the following user query into the StructuredQuery JSON format:

User Query: "{query}"

JSON Response:"""

FEW_SHOT_QUERY_PARSER_EXAMPLES: List[Dict[str, Any]] = [
    {
        "query": "What is the salinity near Chennai at 100 meters?",
        "expected_output": {
            "intent": "profile_query",
            "parameters": ["PSAL"],
            "location": {
                "name": "Chennai",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "bounding_box": None,
            },
            "radius_km": 50.0,
            "depth": {
                "depth_min": 100.0,
                "depth_max": 100.0,
                "target_depth": 100.0,
                "unit": "meters",
            },
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.95,
        },
    },
    {
        "query": "Show me temperature around Kochi between 50 and 200 meters.",
        "expected_output": {
            "intent": "profile_query",
            "parameters": ["TEMP"],
            "location": {
                "name": "Kochi",
                "latitude": 9.9312,
                "longitude": 76.2673,
                "bounding_box": None,
            },
            "radius_km": 50.0,
            "depth": {
                "depth_min": 50.0,
                "depth_max": 200.0,
                "target_depth": None,
                "unit": "meters",
            },
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.95,
        },
    },
    {
        "query": "Compare salinity in the Arabian Sea and Bay of Bengal.",
        "expected_output": {
            "intent": "comparison_query",
            "parameters": ["PSAL"],
            "location": {
                "name": "Arabian Sea",
                "latitude": 16.0,
                "longitude": 64.0,
                "bounding_box": [8.0, 50.0, 25.0, 77.0],
            },
            "radius_km": 500.0,
            "depth": None,
            "time_range": None,
            "platform_id": None,
            "comparison": {
                "comparison_type": "location",
                "target_a": "Arabian Sea",
                "target_b": "Bay of Bengal",
            },
            "confidence": 0.95,
        },
    },
    {
        "query": "What was the temperature near Chennai last month?",
        "expected_output": {
            "intent": "temporal_query",
            "parameters": ["TEMP"],
            "location": {
                "name": "Chennai",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "bounding_box": None,
            },
            "radius_km": 50.0,
            "depth": None,
            "time_range": {
                "start_date": None,
                "end_date": None,
                "year": None,
                "month": None,
                "season": None,
                "relative_days": 30,
                "description": "last month",
            },
            "platform_id": None,
            "comparison": None,
            "confidence": 0.9,
        },
    },
    {
        "query": "Show me data from float 2903334.",
        "expected_output": {
            "intent": "float_query",
            "parameters": [],
            "location": None,
            "radius_km": None,
            "depth": None,
            "time_range": None,
            "platform_id": "2903334",
            "comparison": None,
            "confidence": 0.95,
        },
    },
    {
        "query": "show me ocean data",
        "expected_output": {
            "intent": "unknown",
            "parameters": [],
            "location": None,
            "radius_km": None,
            "depth": None,
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.1,
        },
    },
    {
        "query": "Show salinity near Atlantis",
        "expected_output": {
            "intent": "spatial_query",
            "parameters": ["PSAL"],
            "location": {
                "name": "Atlantis",
                "latitude": None,
                "longitude": None,
                "bounding_box": None,
            },
            "radius_km": None,
            "depth": None,
            "time_range": None,
            "platform_id": None,
            "comparison": None,
            "confidence": 0.4,
        },
    },
]
