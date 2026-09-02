"""
Pydantic-based domain models and schemas for structured oceanographic queries.

These schemas define the interface contract between the Natural Language Understanding
(AI layer) and the FastAPI backend / data retrieval engines.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field


class QueryIntent(str, Enum):
    """Supported user query intents for ARGO oceanographic data."""
    PROFILE_QUERY = "profile_query"        # Depth profile or measurement at specific depth
    SPATIAL_QUERY = "spatial_query"        # Data within geographic region/bounding box/radius
    TEMPORAL_QUERY = "temporal_query"      # Time-series, seasonal trends, or historical spans
    COMPARISON_QUERY = "comparison_query"  # Comparing locations, depths, or time periods
    FLOAT_QUERY = "float_query"            # Float trajectory, WMO ID status, sensor health
    UNKNOWN = "unknown"                    # Unrecognized or out-of-domain query


class OceanParameter(str, Enum):
    """Standard ARGO and oceanographic variable identifiers."""
    TEMP = "TEMP"                          # In-situ / Sea Temperature (°C)
    PSAL = "PSAL"                          # Practical Salinity (PSU)
    PRES = "PRES"                          # Sea Water Pressure / Depth proxy (dbar)
    DOXY = "DOXY"                          # Dissolved Oxygen (µmol/kg)
    CHLA = "CHLA"                          # Chlorophyll-A (mg/m³)
    BBP700 = "BBP700"                      # Particle Backscattering at 700nm (m⁻¹)
    PH_IN_SITU_TOTAL = "PH_IN_SITU_TOTAL"  # pH on total scale
    NITRATE = "NITRATE"                    # Nitrate concentration (µmol/kg)
    DOWNWELLING_PAR = "DOWNWELLING_PAR"    # Photosynthetically Available Radiation


class Coordinates(BaseModel):
    """Geographic point coordinate specification."""
    latitude: float = Field(..., description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., description="Longitude in decimal degrees (-180 to 180)")


class BoundingBox(BaseModel):
    """Geographic bounding box specification (min_lat, min_lon, max_lat, max_lon)."""
    min_latitude: float = Field(..., description="Minimum latitude (-90 to 90)")
    min_longitude: float = Field(..., description="Minimum longitude (-180 to 180)")
    max_latitude: float = Field(..., description="Maximum latitude (-90 to 90)")
    max_longitude: float = Field(..., description="Maximum longitude (-180 to 180)")


class LocationFilter(BaseModel):
    """Location parameters extracted from user query."""
    name: Optional[str] = Field(default=None, description="Recognized marine region or coastal place name")
    latitude: Optional[float] = Field(default=None, description="Latitude in decimal degrees")
    longitude: Optional[float] = Field(default=None, description="Longitude in decimal degrees")
    bounding_box: Optional[BoundingBox] = Field(default=None, description="Spatial bounding box if applicable")
    radius_km: Optional[float] = Field(default=None, description="Radial search distance in km")


class DepthFilter(BaseModel):
    """Vertical depth filter in meters / dbar."""
    depth_min: Optional[float] = Field(default=None, description="Minimum depth (meters/dbar)")
    depth_max: Optional[float] = Field(default=None, description="Maximum depth (meters/dbar)")
    target_depth: Optional[float] = Field(default=None, description="Specific target depth")
    unit: str = Field(default="meters", description="Depth unit: meters or dbar")


class TimeRangeFilter(BaseModel):
    """Temporal constraints for oceanographic observations."""
    start_date: Optional[str] = Field(default=None, description="ISO formatted start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(default=None, description="ISO formatted end date (YYYY-MM-DD)")
    year: Optional[int] = Field(default=None, description="Specific observation year")
    month: Optional[int] = Field(default=None, description="Specific month (1-12)")
    season: Optional[str] = Field(default=None, description="Identified season (e.g., summer, monsoon, winter)")
    relative_days: Optional[int] = Field(default=None, description="Relative time window in days (e.g., last 30 days)")
    description: Optional[str] = Field(default=None, description="Human readable description of time constraint")


class ComparisonFilter(BaseModel):
    """Details for queries comparing two entities (e.g. locations, depths, or time periods)."""
    comparison_type: str = Field(default="location", description="Entity type: 'location', 'depth', 'time', 'parameter'")
    target_a: Optional[str] = Field(default=None, description="First comparison target name/label")
    target_b: Optional[str] = Field(default=None, description="Second comparison target name/label")
    location_a: Optional[LocationFilter] = None
    location_b: Optional[LocationFilter] = None
    depth_a: Optional[DepthFilter] = None
    depth_b: Optional[DepthFilter] = None


class StructuredQuery(BaseModel):
    """
    Complete structured representation of a natural-language oceanographic query.
    
    This model is produced by the AI understanding layer and passed to the backend
    data retrieval engine for execution against ARGO float data.
    """
    raw_query: str = Field(..., description="Original user prompt")
    intent: QueryIntent = Field(default=QueryIntent.UNKNOWN, description="Classified query intent")
    parameters: List[OceanParameter] = Field(default_factory=list, description="Target oceanographic variables")
    location: Optional[LocationFilter] = Field(default=None, description="Spatial criteria")
    radius_km: Optional[float] = Field(default=None, description="Search radius in kilometers")
    depth: Optional[DepthFilter] = Field(default=None, description="Vertical depth criteria")
    depth_min: Optional[float] = Field(default=None, description="Top-level convenience depth_min")
    depth_max: Optional[float] = Field(default=None, description="Top-level convenience depth_max")
    time_range: Optional[TimeRangeFilter] = Field(default=None, description="Temporal criteria")
    platform_id: Optional[str] = Field(default=None, description="ARGO Float WMO platform number")
    comparison: Optional[ComparisonFilter] = Field(default=None, description="Comparison structure if applicable")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Parser confidence score")
    is_valid: bool = Field(default=True, description="Whether query contains valid, actionable criteria")
    validation_errors: List[str] = Field(default_factory=list, description="Validation issues or missing required fields")

    def to_backend_dict(self) -> Dict[str, Any]:
        """
        Export a clean, normalized dictionary format optimized for backend consumption.
        """
        loc_dict = None
        if self.location:
            loc_dict = {
                "name": self.location.name,
                "latitude": self.location.latitude,
                "longitude": self.location.longitude,
                "bounding_box": (
                    [
                        self.location.bounding_box.min_latitude,
                        self.location.bounding_box.min_longitude,
                        self.location.bounding_box.max_latitude,
                        self.location.bounding_box.max_longitude,
                    ]
                    if self.location.bounding_box
                    else None
                ),
            }

        time_dict = None
        if self.time_range:
            time_dict = {
                "start_date": self.time_range.start_date,
                "end_date": self.time_range.end_date,
                "year": self.time_range.year,
                "month": self.time_range.month,
                "season": self.time_range.season,
                "relative_days": self.time_range.relative_days,
                "description": self.time_range.description,
            }

        comp_dict = None
        if self.comparison:
            comp_dict = {
                "comparison_type": self.comparison.comparison_type,
                "target_a": self.comparison.target_a,
                "target_b": self.comparison.target_b,
                "depth_a": self.comparison.depth_a.dict() if self.comparison.depth_a else None,
                "depth_b": self.comparison.depth_b.dict() if self.comparison.depth_b else None,
            }

        return {
            "intent": self.intent.value,
            "raw_query": self.raw_query,
            "location": loc_dict,
            "radius_km": self.radius_km or (self.location.radius_km if self.location else None),
            "parameters": [p.value for p in self.parameters],
            "depth_min": self.depth_min if self.depth_min is not None else (self.depth.depth_min if self.depth else None),
            "depth_max": self.depth_max if self.depth_max is not None else (self.depth.depth_max if self.depth else None),
            "target_depth": self.depth.target_depth if self.depth else None,
            "time_range": time_dict,
            "platform_id": self.platform_id,
            "comparison": comp_dict,
            "confidence": self.confidence,
            "is_valid": self.is_valid,
            "validation_errors": self.validation_errors,
        }
