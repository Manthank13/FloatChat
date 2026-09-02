"""FloatChat AI Package - Oceanographic Query Understanding and AI Capabilities."""

from ai.config import AIConfig
from ai.engine import FloatChatAIEngine
from ai.llm_client import (
    BaseLLMClient,
    GeminiLLMClient,
    MockLLMClient,
    create_llm_client,
)
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
]
