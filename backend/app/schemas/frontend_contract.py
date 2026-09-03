"""Pydantic schemas aligning with the Frontend Climate Intelligence & Disaster Resilience API contract."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


# ==============================================================================
# POST /api/query & /api/chat Schemas
# ==============================================================================

class FrontendQueryContext(BaseModel):
    """Contextual preferences sent alongside natural-language query."""

    preferred_region: Optional[str] = Field("all", description="Target region filter ('bay_of_bengal', 'arabian_sea', 'equatorial_indian_ocean', 'all')")
    depth_limit_meters: Optional[float] = Field(2000.0, ge=1.0, le=6000.0, description="Max depth limit for analysis")


class FrontendQueryRequest(BaseModel):
    """Natural-language query request from frontend."""

    query: str = Field(..., min_length=1, max_length=1000, description="Natural-language ocean or climate question")
    conversation_id: Optional[str] = Field(None, description="Optional conversation tracking identifier")
    context: Optional[FrontendQueryContext] = Field(default_factory=FrontendQueryContext, description="Query context")

    @field_validator("query")
    @classmethod
    def validate_query_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Query string cannot be empty or whitespace only.")
        return clean


class FloatLocationInfo(BaseModel):
    """Geographic location details for queried area."""

    name: str = Field(..., description="Human-readable location label")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    regionCategory: str = Field(..., description="Region identifier (e.g. 'bay_of_bengal')")


class FloatTelemetryInfo(BaseModel):
    """Platform telemetry metadata of the primary reporting Argo float."""

    id: str = Field(..., description="Unique platform identifier")
    wmoNumber: str = Field(..., description="WMO platform identifier")
    name: str = Field(..., description="Float name or model tag")
    institution: str = Field(..., description="Deploying scientific institution")
    latitude: float = Field(..., description="Latest reported latitude")
    longitude: float = Field(..., description="Latest reported longitude")
    cycle: int = Field(1, description="Latest profile dive cycle index")
    timestamp: Optional[str] = Field(None, description="Observation timestamp in ISO 8601")
    lastTransmission: Optional[str] = Field(None, description="Relative transmission time")
    status: str = Field("Active", description="Operational status flag")


class ProfileSummaryMetrics(BaseModel):
    """Derived physical oceanographic vertical indicators."""

    surface_salinity: Optional[float] = Field(None, description="Surface salinity in PSU")
    surface_temperature: Optional[float] = Field(None, description="Surface temperature in °C")
    deep_temperature: Optional[float] = Field(None, description="Deep temperature in °C")
    mixed_layer_depth: Optional[float] = Field(None, description="Derived Mixed Layer Depth in meters")
    thermocline_depth: Optional[float] = Field(None, description="Derived Thermocline depth in meters")
    max_depth: Optional[float] = Field(None, description="Max depth reached in profile")


class KPICardItem(BaseModel):
    """Structured Key Performance Indicator card for frontend dashboard."""

    label: str = Field(..., description="Card label (e.g. 'SEA SURFACE TEMPERATURE')")
    value: str = Field(..., description="Formatted value with units (e.g. '28.4 °C')")
    anomaly: str = Field(..., description="Anomaly or baseline status description")
    riskRelevance: str = Field(..., description="Scientific or risk-relevant interpretation")
    riskLevel: str = Field("nominal", description="'nominal', 'moderate', 'elevated', or 'high'")
    type: str = Field("general", description="Measurement type identifier ('temp', 'salinity', 'depth', 'float')")
    icon: str = Field("Activity", description="Icon identifier for frontend rendering")


class FrontendProfilePoint(BaseModel):
    """Individual vertical depth-level observation."""

    depth: float = Field(..., description="Depth in meters")
    temperature: Optional[float] = Field(None, description="Temperature in °C")
    salinity: Optional[float] = Field(None, description="Practical salinity in PSU")
    pressure: Optional[float] = Field(None, description="Pressure in dbar")
    density: Optional[float] = Field(None, description="Water density (null: unsupported by raw Argo CTD provider)")
    oxygen: Optional[float] = Field(None, description="Dissolved oxygen (null: unsupported by standard core Argo CTD)")


class ProvenanceSource(BaseModel):
    """Scientific data provenance and quality metadata."""

    dataset: str = Field("ARGO GDAC / Euro-Argo", description="Origin data assembly center")
    quality: str = Field("RTQC PASS", description="Quality control assessment flag")
    cycle: int = Field(1, description="Data collection dive cycle number")


class FrontendQueryResponse(BaseModel):
    """Standardized response schema for POST /api/query and /api/chat."""

    query: str = Field(..., description="Original user query")
    location: FloatLocationInfo = Field(..., description="Geographic query area")
    float: FloatTelemetryInfo = Field(..., description="Reporting Argo float platform")
    summary: ProfileSummaryMetrics = Field(..., description="Water column summary metrics")
    kpis: List[KPICardItem] = Field(default_factory=list, description="Categorized risk and telemetry KPI cards")
    profile: List[FrontendProfilePoint] = Field(default_factory=list, description="Vertical depth profile points")
    insights: List[str] = Field(default_factory=list, description="Bullet-point scientific insights")
    text: str = Field(..., description="Comprehensive markdown interpretation text")
    source: ProvenanceSource = Field(..., description="Data provenance attribution")
    followUps: List[str] = Field(default_factory=list, description="Suggested relevant follow-up questions")


# ==============================================================================
# GET /api/floats & /api/floats/{float_id} Schemas
# ==============================================================================

class FleetFloatItem(BaseModel):
    """Summary record of an Argo float for map rendering and directory."""

    id: str = Field(..., description="Float identifier")
    wmoNumber: str = Field(..., description="WMO platform identifier")
    name: str = Field(..., description="Float designation")
    institution: str = Field(..., description="Deploying organization")
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    cycle: int = Field(1, description="Latest profile cycle")
    timestamp: Optional[str] = Field(None, description="Observation timestamp")
    status: str = Field("Active", description="Operating status ('Active', 'Profiling', 'Surface')")
    region: str = Field("all", description="Geographic basin category")
    is_mock: bool = Field(False, description="Synthetic mock data flag")
    data_source: str = Field(..., description="Data source provider identifier")


class FloatDetailResponse(BaseModel):
    """Detailed metadata and telemetry for a single Argo float."""

    id: str = Field(..., description="Float identifier")
    wmoNumber: str = Field(..., description="WMO platform number")
    name: str = Field(..., description="Float designation name")
    institution: str = Field(..., description="Deploying institute")
    latitude: float = Field(..., description="Latest latitude")
    longitude: float = Field(..., description="Latest longitude")
    cycle: int = Field(1, description="Latest cycle number")
    timestamp: Optional[str] = Field(None, description="Latest observation timestamp")
    status: str = Field("Active", description="Operational status")
    region: str = Field("all", description="Ocean basin")
    total_profiles: int = Field(1, description="Total profile cycles recorded")
    trajectory: List[Any] = Field(default_factory=list, description="10-day trajectory (empty list: historical drift tracking currently unavailable)")
    provenance: Dict[str, Any] = Field(default_factory=dict, description="Scientific provenance flags")


class FloatProfileResponse(BaseModel):
    """Vertical CTD profile response for a specific float."""

    float_id: str = Field(..., description="Float WMO identifier")
    timestamp: Optional[str] = Field(None, description="Profile timestamp")
    latitude: float = Field(..., description="Latitude of profile")
    longitude: float = Field(..., description="Longitude of profile")
    profile: List[FrontendProfilePoint] = Field(default_factory=list, description="Depth levels")
    point_count: int = Field(0, description="Total valid observation levels")
    data_source: str = Field(..., description="Data source provider")


# ==============================================================================
# Fleet Status & Ocean Compare Schemas
# ==============================================================================

class FleetStatusResponse(BaseModel):
    """Overview statistics of the observable Argo fleet."""

    total_floats: int = Field(..., description="Total floats evaluated")
    active_floats: int = Field(..., description="Floats with recent observations")
    regions: Dict[str, int] = Field(default_factory=dict, description="Float counts per geographic basin")
    variables_supported: List[str] = Field(default_factory=lambda: ["TEMP", "PSAL", "PRES"], description="Observed variables")
    data_source: str = Field(..., description="Underlying Argo data source provider")
    last_updated: str = Field(..., description="Status check UTC timestamp")


class OceanCompareMetricItem(BaseModel):
    """Single metric comparison between two targets."""

    metric: str = Field(..., description="Metric name (e.g. 'Mean Temperature')")
    value_a: Optional[float] = Field(None, description="Value for Target A")
    value_b: Optional[float] = Field(None, description="Value for Target B")
    difference: Optional[float] = Field(None, description="Difference (Target A - Target B)")
    unit: str = Field(..., description="Physical measurement unit")


class OceanCompareResponse(BaseModel):
    """Comparative analysis response between two floats or regions."""

    status: str = Field("success", description="Comparison status")
    target_a: str = Field(..., description="Identifier for first target")
    target_b: str = Field(..., description="Identifier for second target")
    variable: str = Field("TEMP", description="Analyzed variable")
    unit: str = Field("°C", description="Variable unit")
    metrics: List[OceanCompareMetricItem] = Field(default_factory=list, description="Statistical comparisons")
    depth_comparison: List[Dict[str, Any]] = Field(default_factory=list, description="Depth-level comparisons")
    summary: str = Field(..., description="Scientific interpretation of the differences")


class FrontendHealthResponse(BaseModel):
    """Product-facing health check schema."""

    status: str = Field("ok", description="Service health state")
    service: str = Field("FloatChat Climate Intelligence API", description="Service name")
    argo_data_source: str = Field(..., description="Configured Argo data provider")
    argo_active_count: Optional[int] = Field(None, description="Observable Argo floats count if available")
