"""
Conversational Session Management and Multi-Turn Context Resolution for FloatChat.
"""

import copy
import logging
from datetime import datetime, timezone
import threading
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field

from ai.models import (
    ComparisonFilter,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from ai.response_models import FloatChatResponse

logger = logging.getLogger(__name__)


class ConversationTurn(BaseModel):
    """A single turn (user query and assistant response) within a session."""
    turn_id: int
    user_query: str
    structured_query: StructuredQuery
    response_summary: str
    key_findings: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ConversationSession(BaseModel):
    """Container holding chronological multi-turn conversational state."""
    session_id: str
    turns: List[ConversationTurn] = Field(default_factory=list)
    last_structured_query: Optional[StructuredQuery] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def add_turn(self, query: str, structured_query: StructuredQuery, response: FloatChatResponse) -> ConversationTurn:
        """Record a completed conversation turn."""
        turn_id = len(self.turns) + 1
        turn = ConversationTurn(
            turn_id=turn_id,
            user_query=query,
            structured_query=structured_query,
            response_summary=response.answer[:200] if response.answer else "",
            key_findings=response.key_findings,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self.turns.append(turn)
        self.last_structured_query = structured_query
        self.updated_at = datetime.now(timezone.utc).isoformat()
        return turn

    def resolve_contextual_follow_up(self, new_query: StructuredQuery) -> StructuredQuery:
        """
        Merge contextual attributes from previous turn if new query is an elliptical follow-up.
        For example:
        - "What about at 200 meters?" -> inherits location & parameter from previous turn.
        - "How about salinity instead?" -> inherits location & depth from previous turn.
        - "Compare with Arabian Sea" -> converts into comparison with previous location.
        """
        if not self.last_structured_query:
            return new_query

        prev = self.last_structured_query
        merged = new_query.model_copy(deep=True) if hasattr(new_query, "model_copy") else copy.deepcopy(new_query)

        # 1. Inherit location ONLY if new query is an explicit elliptical follow-up and not introducing a new spatial context
        lower_raw = (new_query.raw_query or "").lower()
        has_spatial_indicators = any(w in lower_raw for w in ["near", "in ", "around", "off ", "from ", "between", "vs", "versus"])
        is_follow_up_phrase = any(w in lower_raw for w in ["what about", "how about", "instead", "and at", "and for", "same location", "there", "at that depth", "same region"])

        if merged.location is None and merged.platform_id is None and prev.location is not None:
            if not merged.comparison and not has_spatial_indicators:
                # Do not inherit location for standalone profile/depth queries without follow-up keywords
                if is_follow_up_phrase:
                    merged.location = prev.location.model_copy(deep=True) if hasattr(prev.location, "model_copy") else copy.deepcopy(prev.location)
                    if merged.radius_km is None:
                        merged.radius_km = prev.radius_km

        # 2. Inherit parameters if unspecified in new query
        if not merged.parameters and prev.parameters:
            merged.parameters = list(prev.parameters)

        # 3. Inherit depth if missing in new query and previous had explicit depth filter
        if merged.depth is None and prev.depth is not None:
            # Only inherit depth if the user asked a parameter or location shift, not a broad profile
            if merged.intent in [QueryIntent.PROFILE_QUERY, QueryIntent.SPATIAL_QUERY]:
                merged.depth = prev.depth.model_copy(deep=True) if hasattr(prev.depth, "model_copy") else copy.deepcopy(prev.depth)

        # 4. Handle comparison follow-ups (e.g., "Compare with Kochi")
        if merged.comparison and prev.location and not merged.comparison.target_a:
            merged.comparison.target_a = prev.location.name or f"{prev.location.latitude:.2f}°N, {prev.location.longitude:.2f}°E"

        return merged


class SessionManager:
    """Thread-safe in-memory session repository."""

    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}
        self._lock = threading.Lock()

    def get_or_create_session(self, session_id: Optional[str] = None) -> ConversationSession:
        """Retrieve existing session or create a new unique session."""
        with self._lock:
            if not session_id:
                session_id = str(uuid.uuid4())
            if session_id not in self._sessions:
                self._sessions[session_id] = ConversationSession(session_id=session_id)
            return self._sessions[session_id]

    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """Fetch session if it exists."""
        with self._lock:
            return self._sessions.get(session_id)

    def clear_session(self, session_id: str) -> bool:
        """Remove a session from memory."""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def clear_all(self):
        """Reset all active sessions."""
        with self._lock:
            self._sessions.clear()


# Global default session manager instance
_global_session_manager = SessionManager()


def get_session_manager() -> SessionManager:
    """Access the global session manager singleton."""
    return _global_session_manager
