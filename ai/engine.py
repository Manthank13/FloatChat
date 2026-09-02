"""
FloatChat AI Engine - High-level AI pipeline and orchestration service.

Provides a unified interface for natural language query understanding,
controlled domain normalization, and query validation ready for backend retrieval.
"""

import logging
from typing import Any, Dict, Optional

from ai.config import AIConfig
from ai.llm_client import BaseLLMClient, create_llm_client
from ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
from ai.models import OceanParameter, StructuredQuery
from ai.parser import LLMQueryParser
from ai.terminology import KNOWN_OCEAN_LOCATIONS, PARAMETER_METADATA

logger = logging.getLogger(__name__)


class FloatChatAIEngine:
    """
    Central AI engine for FloatChat.
    
    Orchestrates LLM query interpretation, deterministic oceanographic normalization,
    and structured query generation.
    """

    def __init__(
        self,
        config: Optional[AIConfig] = None,
        llm_client: Optional[BaseLLMClient] = None,
    ):
        self.config = config or AIConfig()
        self.llm_client = llm_client or create_llm_client(self.config)
        self.deterministic_parser = DeterministicQueryParser()
        self.llm_parser = LLMQueryParser(
            llm_client=self.llm_client,
            config=self.config,
            fallback_parser=self.deterministic_parser,
        )

    def parse_query(self, query: str, use_llm: bool = True) -> StructuredQuery:
        """
        Convert user prompt into validated StructuredQuery.
        
        Args:
            query: Natural language oceanographic question.
            use_llm: Whether to use the LLM-assisted interpreter or pure deterministic rules.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        return parser.parse(query)

    async def parse_query_async(self, query: str, use_llm: bool = True) -> StructuredQuery:
        """
        Asynchronously convert user prompt into validated StructuredQuery.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        return await parser.parse_async(query)

    def get_parser(self, use_llm: bool = True) -> BaseQueryParser:
        """Return the active query parser instance."""
        return self.llm_parser if use_llm else self.deterministic_parser

    @staticmethod
    def get_known_locations() -> Dict[str, Any]:
        """Return reference dictionary of verified oceanographic locations and coordinates."""
        return KNOWN_OCEAN_LOCATIONS

    @staticmethod
    def get_parameter_metadata() -> Dict[OceanParameter, Any]:
        """Return reference metadata for supported ARGO parameters."""
        return PARAMETER_METADATA
