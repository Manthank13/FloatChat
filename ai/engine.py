"""
FloatChat AI Engine - Central Orchestration Service for Oceanographic Understanding & ARGO Retrieval.

Coordinates natural-language query interpretation, domain normalization,
geodesic observation retrieval, and grounded scientific response synthesis.
"""

import logging
from typing import Any, Dict, Optional, Tuple, Union

from ai.config import AIConfig
from ai.llm_client import BaseLLMClient, create_llm_client
from ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
from ai.models import OceanParameter, StructuredQuery
from ai.parser import LLMQueryParser
from ai.response_models import FloatChatResponse
from ai.synthesizer import (
    BaseResponseSynthesizer,
    DeterministicResponseSynthesizer,
    LLMResponseSynthesizer,
    create_response_synthesizer,
)
from ai.terminology import KNOWN_OCEAN_LOCATIONS, PARAMETER_METADATA
from data.config import DataConfig
from data.interface import BaseArgoDataSource
from data.models import RetrievalResult
from data.query_engine import ArgoDataRetriever

logger = logging.getLogger(__name__)


class FloatChatAIEngine:
    """
    Central AI and Data Retrieval engine for FloatChat.
    
    Orchestrates LLM query interpretation, deterministic oceanographic normalization,
    structured ARGO observation retrieval, and grounded scientific response generation.
    """

    def __init__(
        self,
        config: Optional[AIConfig] = None,
        data_config: Optional[DataConfig] = None,
        llm_client: Optional[BaseLLMClient] = None,
        data_source: Optional[BaseArgoDataSource] = None,
        synthesizer: Optional[BaseResponseSynthesizer] = None,
    ):
        self.config = config or AIConfig()
        self.data_config = data_config or DataConfig.from_env()
        self.llm_client = llm_client or create_llm_client(self.config)
        self.deterministic_parser = DeterministicQueryParser()
        self.llm_parser = LLMQueryParser(
            llm_client=self.llm_client,
            config=self.config,
            fallback_parser=self.deterministic_parser,
        )
        self.data_retriever = ArgoDataRetriever(
            data_source=data_source,
            config=self.data_config,
        )
        self.deterministic_synthesizer = DeterministicResponseSynthesizer()
        self.synthesizer = synthesizer or LLMResponseSynthesizer(
            llm_client=self.llm_client,
            config=self.config,
            fallback_synthesizer=self.deterministic_synthesizer,
        )

    def parse_query(self, query: str, use_llm: bool = True) -> StructuredQuery:
        """
        Convert user prompt into validated StructuredQuery.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        return parser.parse(query)

    async def parse_query_async(self, query: str, use_llm: bool = True) -> StructuredQuery:
        """
        Asynchronously convert user prompt into validated StructuredQuery.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        return await parser.parse_async(query)

    def retrieve_data(self, structured_query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """
        Retrieve ARGO observations matching the structured query.
        """
        return self.data_retriever.retrieve(structured_query)

    def synthesize_response(
        self,
        structured_query: StructuredQuery,
        retrieval_result: RetrievalResult,
        use_llm: bool = True,
    ) -> FloatChatResponse:
        """
        Synthesize natural-language oceanographic response from structured data.
        """
        synth = self.synthesizer if use_llm else self.deterministic_synthesizer
        return synth.synthesize(structured_query, retrieval_result)

    def chat(self, natural_language_query: str, use_llm: bool = True) -> FloatChatResponse:
        """
        Complete conversational pipeline: Query -> StructuredQuery -> RetrievalResult -> FloatChatResponse.
        
        Args:
            natural_language_query: User question about oceanographic conditions.
            use_llm: Whether to use LLM parsing and response synthesis.
        """
        sq = self.parse_query(natural_language_query, use_llm=use_llm)
        retrieval_result = self.retrieve_data(sq)
        return self.synthesize_response(sq, retrieval_result, use_llm=use_llm)

    async def chat_async(self, natural_language_query: str, use_llm: bool = True) -> FloatChatResponse:
        """
        Asynchronous complete conversational pipeline.
        """
        sq = await self.parse_query_async(natural_language_query, use_llm=use_llm)
        retrieval_result = self.retrieve_data(sq)
        synth = self.synthesizer if use_llm else self.deterministic_synthesizer
        return await synth.synthesize_async(sq, retrieval_result)

    def execute_pipeline(self, natural_language_query: str, use_llm: bool = True) -> Tuple[StructuredQuery, RetrievalResult]:
        """
        Compatibility pipeline returning (StructuredQuery, RetrievalResult).
        """
        sq = self.parse_query(natural_language_query, use_llm=use_llm)
        data_result = self.retrieve_data(sq)
        return sq, data_result

    def get_parser(self, use_llm: bool = True) -> BaseQueryParser:
        """Return active query parser instance."""
        return self.llm_parser if use_llm else self.deterministic_parser

    @staticmethod
    def get_known_locations() -> Dict[str, Any]:
        """Return reference dictionary of verified oceanographic locations and coordinates."""
        return KNOWN_OCEAN_LOCATIONS

    @staticmethod
    def get_parameter_metadata() -> Dict[OceanParameter, Any]:
        """Return reference metadata for supported ARGO parameters."""
        return PARAMETER_METADATA
