"""
FloatChat AI Engine - Central Orchestration Service for Oceanographic Understanding & ARGO Retrieval.

Coordinates natural-language query interpretation, domain normalization,
geodesic observation retrieval, grounded scientific response synthesis,
and multi-turn conversational session context.
"""

import logging
from typing import Any, AsyncGenerator, Dict, Optional, Tuple, Union

from ai.config import AIConfig
from ai.llm_client import BaseLLMClient, create_llm_client
from ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
from ai.models import OceanParameter, StructuredQuery
from ai.parser import LLMQueryParser
from ai.response_models import FloatChatResponse
from ai.session import ConversationSession, SessionManager, get_session_manager
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
    structured ARGO observation retrieval, grounded scientific response generation,
    and multi-turn contextual session memory.
    """

    def __init__(
        self,
        config: Optional[AIConfig] = None,
        data_config: Optional[DataConfig] = None,
        llm_client: Optional[BaseLLMClient] = None,
        data_source: Optional[BaseArgoDataSource] = None,
        synthesizer: Optional[BaseResponseSynthesizer] = None,
        session_manager: Optional[SessionManager] = None,
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
        self.session_manager = session_manager or get_session_manager()

    def parse_query(self, query: str, use_llm: bool = True, session_id: Optional[str] = None) -> StructuredQuery:
        """
        Convert user prompt into validated StructuredQuery, resolving context if session_id is provided.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        sq = parser.parse(query)
        if session_id:
            session = self.session_manager.get_session(session_id)
            if session:
                sq = session.resolve_contextual_follow_up(sq)
        return sq

    async def parse_query_async(self, query: str, use_llm: bool = True, session_id: Optional[str] = None) -> StructuredQuery:
        """
        Asynchronously convert user prompt into validated StructuredQuery with context resolution.
        """
        parser = self.llm_parser if use_llm else self.deterministic_parser
        sq = await parser.parse_async(query)
        if session_id:
            session = self.session_manager.get_session(session_id)
            if session:
                sq = session.resolve_contextual_follow_up(sq)
        return sq

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

    def _log_pipeline_flow(self, query: str, sq: StructuredQuery, result: RetrievalResult) -> None:
        """Structured diagnostic server-side logging without exposing keys or credentials."""
        lat_lon = f"({sq.location.latitude}, {sq.location.longitude})" if (sq.location and sq.location.latitude is not None) else "None"
        loc_name = sq.location.name if sq.location else "None"
        params_str = ", ".join(p.value if hasattr(p, "value") else str(p) for p in sq.parameters) or "None"
        depth_str = f"target={sq.depth.target_depth}m" if (sq.depth and sq.depth.target_depth is not None) else (f"{sq.depth.depth_min}-{sq.depth.depth_max}m" if sq.depth else "All")
        date_str = sq.time_range.description if sq.time_range else "None"
        
        logger.info(
            f"\n[FloatChat Pipeline Diagnostic]\n"
            f"  RAW USER QUERY       : {query}\n"
            f"  → PARSED INTENT      : {sq.intent.value if hasattr(sq.intent, 'value') else str(sq.intent)}\n"
            f"  → EXTRACTED LOCATION : {loc_name}\n"
            f"  → LAT/LON            : {lat_lon}\n"
            f"  → PARAMETER          : {params_str}\n"
            f"  → DEPTH              : {depth_str}\n"
            f"  → DATE RANGE         : {date_str}\n"
            f"  → ARGO REQUEST       : source={result.data_source}, is_empty={result.is_empty}\n"
            f"  → ARGO RESPONSE COUNT: {result.total_matched_observations} observation levels from {len(result.matched_platforms)} float(s)"
        )

    def chat(
        self,
        natural_language_query: str,
        use_llm: bool = True,
        session_id: Optional[str] = None,
    ) -> FloatChatResponse:
        """
        Complete conversational pipeline: Query -> Context -> Retrieval -> Response -> Session Recording.
        
        Args:
            natural_language_query: User question about oceanographic conditions.
            use_llm: Whether to use LLM parsing and response synthesis.
            session_id: Optional session identifier for multi-turn conversational context.
        """
        sq = self.parse_query(natural_language_query, use_llm=use_llm, session_id=session_id)
        retrieval_result = self.retrieve_data(sq)
        self._log_pipeline_flow(natural_language_query, sq, retrieval_result)
        response = self.synthesize_response(sq, retrieval_result, use_llm=use_llm)

        if session_id:
            session = self.session_manager.get_or_create_session(session_id)
            session.add_turn(natural_language_query, sq, response)

        return response

    async def chat_async(
        self,
        natural_language_query: str,
        use_llm: bool = True,
        session_id: Optional[str] = None,
    ) -> FloatChatResponse:
        """
        Asynchronous complete conversational pipeline with multi-turn session tracking.
        """
        sq = await self.parse_query_async(natural_language_query, use_llm=use_llm, session_id=session_id)
        retrieval_result = self.retrieve_data(sq)
        self._log_pipeline_flow(natural_language_query, sq, retrieval_result)
        synth = self.synthesizer if use_llm else self.deterministic_synthesizer
        response = await synth.synthesize_async(sq, retrieval_result)

        if session_id:
            session = self.session_manager.get_or_create_session(session_id)
            session.add_turn(natural_language_query, sq, response)

        return response

    async def chat_stream(
        self,
        natural_language_query: str,
        use_llm: bool = True,
        session_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream conversational response word-by-word for live frontend rendering (SSE).
        """
        sq = await self.parse_query_async(natural_language_query, use_llm=use_llm, session_id=session_id)
        retrieval_result = self.retrieve_data(sq)
        self._log_pipeline_flow(natural_language_query, sq, retrieval_result)
        synth = self.synthesizer if use_llm else self.deterministic_synthesizer
        
        response = await synth.synthesize_async(sq, retrieval_result)
        if session_id:
            session = self.session_manager.get_or_create_session(session_id)
            session.add_turn(natural_language_query, sq, response)

        async for chunk in synth.synthesize_stream(sq, retrieval_result):
            yield chunk

    def execute_pipeline(self, natural_language_query: str, use_llm: bool = True) -> Tuple[StructuredQuery, RetrievalResult]:
        """
        Compatibility pipeline returning (StructuredQuery, RetrievalResult).
        """
        sq = self.parse_query(natural_language_query, use_llm=use_llm)
        data_result = self.retrieve_data(sq)
        return sq, data_result

    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """Retrieve conversation history for a session."""
        return self.session_manager.get_session(session_id)

    def clear_session(self, session_id: str) -> bool:
        """Clear session state."""
        return self.session_manager.clear_session(session_id)

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
