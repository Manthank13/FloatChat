"""
FloatChat AI Package - Oceanographic natural language understanding, query interpretation, and response synthesis.
"""

from ai.config import AIConfig
from ai.engine import FloatChatAIEngine
from ai.llm_client import BaseLLMClient, GeminiLLMClient, MockLLMClient, create_llm_client
from ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
from ai.models import (
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
from ai.parser import LLMQueryParser
from ai.response_models import (
    AIResponse,
    ChartDataPayload,
    ChartDataPoint,
    FloatChatResponse,
    FloatCitation,
    MapMarker,
)
from ai.synthesizer import (
    BaseResponseSynthesizer,
    DeterministicResponseSynthesizer,
    LLMResponseSynthesizer,
    create_response_synthesizer,
)
from ai.terminology import (
    KNOWN_OCEAN_LOCATIONS,
    PARAMETER_METADATA,
    PARAMETER_SYNONYMS,
)

__all__ = [
    "AIConfig",
    "FloatChatAIEngine",
    "BaseLLMClient",
    "MockLLMClient",
    "GeminiLLMClient",
    "create_llm_client",
    "BaseQueryParser",
    "DeterministicQueryParser",
    "LLMQueryParser",
    "QueryIntent",
    "OceanParameter",
    "Coordinates",
    "BoundingBox",
    "LocationFilter",
    "DepthFilter",
    "TimeRangeFilter",
    "ComparisonFilter",
    "StructuredQuery",
    "FloatCitation",
    "ChartDataPoint",
    "ChartDataPayload",
    "MapMarker",
    "FloatChatResponse",
    "AIResponse",
    "BaseResponseSynthesizer",
    "DeterministicResponseSynthesizer",
    "LLMResponseSynthesizer",
    "create_response_synthesizer",
    "KNOWN_OCEAN_LOCATIONS",
    "PARAMETER_SYNONYMS",
    "PARAMETER_METADATA",
]
