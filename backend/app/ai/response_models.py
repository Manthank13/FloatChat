"""
Domain models for FloatChat AI responses, citations, frontend visualization payloads, and map markers.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.ai.models import QueryIntent, StructuredQuery
from app.ai.retrieval_models import DataSummary, RetrievalResult


class FloatCitation(BaseModel):
    """Data provenance citation for an individual ARGO float observation."""
    platform_id: str = Field(..., description="ARGO Float 7-digit WMO identifier")
    cycle_number: Optional[int] = Field(default=None, description="Profile ascent cycle number")
    latitude: float = Field(..., description="Observation latitude in decimal degrees")
    longitude: float = Field(..., description="Observation longitude in decimal degrees")
    timestamp: str = Field(..., description="ISO 8601 UTC observation timestamp")
    distance_km: Optional[float] = Field(default=None, description="Distance in km to query coordinate")
    data_source: str = Field(default="ARGO_GDAC", description="Originating repository")


class ChartDataPoint(BaseModel):
    """Individual depth vs parameter data point for frontend charting."""
    depth_m: float = Field(..., description="Depth in meters")
    value: float = Field(..., description="Parameter value (e.g., temperature °C, salinity PSU)")
    parameter: str = Field(..., description="Parameter identifier (e.g., TEMP, PSAL, DOXY)")
    platform_id: str = Field(..., description="ARGO Float WMO identifier")
    timestamp: str = Field(..., description="Observation timestamp")


class ChartDataPayload(BaseModel):
    """Structured chart dataset for frontend visualization (depth profiles, time-series)."""
    chart_type: str = Field(default="profile", description="Chart visualization type: 'profile' | 'timeseries' | 'scatter'")
    title: str = Field(..., description="Chart title")
    parameter: str = Field(..., description="Primary oceanographic parameter code")
    unit: str = Field(..., description="Parameter unit (e.g. °C, PSU, µmol/kg)")
    data_points: List[ChartDataPoint] = Field(default_factory=list, description="Ordered coordinate points")


class MapMarker(BaseModel):
    """Geographic marker for rendering ARGO float locations on frontend maps."""
    latitude: float = Field(..., description="Marker latitude")
    longitude: float = Field(..., description="Marker longitude")
    platform_id: str = Field(..., description="ARGO float WMO ID")
    title: str = Field(..., description="Marker popup title")
    description: str = Field(..., description="Popup description text")


class FloatChatResponse(BaseModel):
    """
    Complete end-to-end response object returned by FloatChat AI Engine.
    
    Contains the natural-language conversational explanation, authoritative summary statistics,
    verified float citations, and structured payloads for frontend map & chart rendering.
    """
    query: str = Field(..., description="Original user prompt")
    intent: QueryIntent = Field(default=QueryIntent.UNKNOWN, description="Interpreted intent")
    answer: str = Field(..., description="Markdown-formatted conversational explanation")
    key_findings: List[str] = Field(default_factory=list, description="Core bullet-point takeaways")
    structured_query: Optional[StructuredQuery] = Field(default=None, description="Parsed query schema")
    retrieval_result: Optional[RetrievalResult] = Field(default=None, description="Raw data retrieval results")
    data_summary: Optional[DataSummary] = Field(default=None, description="Authoritative calculated metrics")
    citations: List[FloatCitation] = Field(default_factory=list, description="ARGO float citations and provenance")
    chart_data: Optional[ChartDataPayload] = Field(default=None, description="Frontend chart data payload")
    map_markers: List[MapMarker] = Field(default_factory=list, description="Map marker coordinates")
    follow_up_suggestions: List[str] = Field(default_factory=list, description="Recommended next oceanographic questions")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Overall confidence score")
    data_source: str = Field(default="SAMPLE_TEST_DATASET", description="Active data source name")
    is_empty: bool = Field(default=False, description="Whether query returned zero matching observations")

    def to_backend_dict(self) -> Dict[str, Any]:
        """Convert FloatChatResponse to JSON-serializable dictionary for FastAPI backend."""
        return {
            "query": self.query,
            "intent": self.intent.value if hasattr(self.intent, "value") else str(self.intent),
            "answer": self.answer,
            "key_findings": self.key_findings,
            "structured_query": self.structured_query.to_backend_dict() if self.structured_query else None,
            "data_summary": (
                self.data_summary.model_dump()
                if hasattr(self.data_summary, "model_dump")
                else (self.data_summary.dict() if self.data_summary else None)
            ),
            "citations": [
                c.model_dump() if hasattr(c, "model_dump") else c.dict()
                for c in self.citations
            ],
            "chart_data": (
                self.chart_data.model_dump()
                if hasattr(self.chart_data, "model_dump")
                else (self.chart_data.dict() if self.chart_data else None)
            ),
            "map_markers": [
                m.model_dump() if hasattr(m, "model_dump") else m.dict()
                for m in self.map_markers
            ],
            "follow_up_suggestions": self.follow_up_suggestions,
            "confidence": self.confidence,
            "data_source": self.data_source,
            "is_empty": self.is_empty,
        }


# Backwards compatibility alias
AIResponse = FloatChatResponse
