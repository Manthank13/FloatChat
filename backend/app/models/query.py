from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator


SUPPORTED_VARIABLES = {
    "TEMP": "°C",
    "PSAL": "PSU",
    "PRES": "dbar",
}


class ObservationQuery(BaseModel):
    """Pydantic schema representing a scientific observation query."""

    latitude: Optional[float] = Field(None, description="Center search latitude in degrees (-90 to 90)")
    longitude: Optional[float] = Field(None, description="Center search longitude in degrees (-180 to 180)")
    radius_km: Optional[float] = Field(None, gt=0, description="Search radius in kilometers (must be > 0)")
    variable: Optional[Union[str, List[str]]] = Field(
        None,
        description="Target oceanographic variable(s): TEMP (°C), PSAL (PSU), PRES (dbar)",
    )
    depth_m: Optional[float] = Field(None, ge=0, description="Target depth level in meters")
    depth_min_m: Optional[float] = Field(None, ge=0, description="Minimum depth level in meters")
    depth_max_m: Optional[float] = Field(None, ge=0, description="Maximum depth level in meters")
    start_time: Optional[datetime] = Field(None, description="Start UTC timestamp")
    end_time: Optional[datetime] = Field(None, description="End UTC timestamp")
    float_id: Optional[str] = Field(None, description="Specific float WMO ID filter")
    limit: int = Field(50, ge=1, le=500, description="Maximum results count (1 to 500)")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90.0 <= v <= 90.0):
            raise ValueError(f"Latitude {v} out of valid range [-90.0, 90.0]")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180.0 <= v <= 180.0):
            raise ValueError(f"Longitude {v} out of valid range [-180.0, 180.0]")
        return v

    @field_validator("variable")
    @classmethod
    def validate_variable(cls, v: Optional[Union[str, List[str]]]) -> Optional[List[str]]:
        if v is None:
            return None

        vars_list = [v.upper()] if isinstance(v, str) else [x.upper() for x in v]
        for var in vars_list:
            if var not in SUPPORTED_VARIABLES:
                raise ValueError(
                    f"Unsupported oceanographic variable '{var}'. Supported variables: {list(SUPPORTED_VARIABLES.keys())}"
                )
        return vars_list

    @model_validator(mode="after")
    def validate_query_combinations(self) -> "ObservationQuery":
        # Geographic query check
        if (self.latitude is not None or self.longitude is not None) and (
            self.latitude is None or self.longitude is None
        ):
            raise ValueError("Both latitude and longitude must be provided for geographic queries.")

        if self.latitude is not None and self.longitude is not None and self.radius_km is None:
            # Default radius to 100 km if not provided
            self.radius_km = 100.0

        # Depth range check
        if self.depth_min_m is not None and self.depth_max_m is not None:
            if self.depth_min_m > self.depth_max_m:
                raise ValueError(
                    f"depth_min_m ({self.depth_min_m}) cannot be greater than depth_max_m ({self.depth_max_m})."
                )

        # Time range check
        if self.start_time is not None and self.end_time is not None:
            if self.start_time > self.end_time:
                raise ValueError("start_time cannot be after end_time.")

        return self


class QueryResultItem(BaseModel):
    """Schema representing an individual query result observation with scientific metadata."""

    float_id: str = Field(..., description="Unique platform identifier (WMO ID)")
    variable: str = Field(..., description="Oceanographic variable name (TEMP, PSAL, PRES)")
    value: float = Field(..., description="Scientific measurement value")
    unit: str = Field(..., description="Scientific unit of measurement (°C, PSU, dbar)")
    latitude: float = Field(..., description="Observation latitude in degrees")
    longitude: float = Field(..., description="Observation longitude in degrees")
    timestamp: datetime = Field(..., description="Observation UTC timestamp")
    depth_m: Optional[float] = Field(None, description="Water depth in meters")
    pressure_dbar: Optional[float] = Field(None, description="Water pressure in decibars")
    distance_km: Optional[float] = Field(None, description="Calculated distance from query point in kilometers")
    requested_depth_m: Optional[float] = Field(None, description="Target depth requested in query")
    actual_depth_m: Optional[float] = Field(None, description="Actual depth of matching measurement")
    depth_difference_m: Optional[float] = Field(None, description="Absolute difference between requested and actual depth")
    qc_flags: Dict[str, Any] = Field(default_factory=dict, description="Quality control flags")
    data_source: str = Field(..., description="Origin data provider identifier")
    is_mock: bool = Field(False, description="Flag identifying synthetic mock data vs real observations")


class QueryResponse(BaseModel):
    """Standardized response schema for observation queries."""

    query: Dict[str, Any] = Field(..., description="Structured representation of the executed query")
    results: List[QueryResultItem] = Field(default_factory=list, description="Matching observation records")
    count: int = Field(0, description="Total matching results count returned")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution metadata (provider info, notes)")


class NearbyFloatResult(BaseModel):
    """Schema representing a float platform discovered near a location point."""

    float_id: str = Field(..., description="Platform WMO ID")
    latitude: float = Field(..., description="Float latitude")
    longitude: float = Field(..., description="Float longitude")
    distance_km: float = Field(..., description="Calculated distance from query point in kilometers")
    last_timestamp: Optional[datetime] = Field(None, description="Latest profile UTC timestamp")
    total_profiles: int = Field(0, description="Retrieved profiles count")
    is_mock: bool = Field(False, description="Synthetic mock data flag")
    data_source: str = Field(..., description="Data provider identifier")
