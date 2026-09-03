"""
FloatChat AI Package - Oceanographic natural language understanding, query interpretation, and response synthesis.
"""

from app.ai.adapter import BackendArgoRetriever
from app.ai.config import AIConfig
from app.ai.engine import FloatChatAIEngine
from app.ai.llm_client import BaseLLMClient, GeminiLLMClient, MockLLMClient, create_llm_client
from app.ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
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
from app.ai.parser import LLMQueryParser
from app.ai.response_models import (
    AIResponse,
    ChartDataPayload,
    ChartDataPoint,
    FloatChatResponse,
    FloatCitation,
    MapMarker,
)
from app.ai.retrieval_models import ArgoObservation, DataSummary, RetrievalResult
from app.ai.synthesizer import (
    BaseResponseSynthesizer,
    DeterministicResponseSynthesizer,
    LLMResponseSynthesizer,
)
from app.ai.terminology import (
    KNOWN_OCEAN_LOCATIONS,
    PARAMETER_METADATA,
    PARAMETER_SYNONYMS,
)

__all__ = [
    "AIConfig",
    "FloatChatAIEngine",
    "BackendArgoRetriever",
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
    "ArgoObservation",
    "DataSummary",
    "RetrievalResult",
    "FloatCitation",
    "ChartDataPoint",
    "ChartDataPayload",
    "MapMarker",
    "FloatChatResponse",
    "AIResponse",
    "BaseResponseSynthesizer",
    "DeterministicResponseSynthesizer",
    "LLMResponseSynthesizer",
    "KNOWN_OCEAN_LOCATIONS",
    "PARAMETER_SYNONYMS",
    "PARAMETER_METADATA",
]
