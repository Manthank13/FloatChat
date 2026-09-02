from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.query import SUPPORTED_VARIABLES, ObservationQuery


class StatisticsRequest(BaseModel):
    """Request model for computing statistical aggregations over ocean observations."""

    query: ObservationQuery = Field(..., description="Observation query filter constraints")
    target_variable: str = Field(..., description="Target variable to aggregate (TEMP, PSAL, PRES)")

    @field_validator("target_variable")
    @classmethod
    def validate_target_variable(cls, v: str) -> str:
        var_upper = v.strip().upper()
        if var_upper not in SUPPORTED_VARIABLES:
            raise ValueError(
                f"Unsupported variable '{v}'. Supported variables: {list(SUPPORTED_VARIABLES.keys())}"
            )
        return var_upper


class StatisticsResult(BaseModel):
    """Structured result model for statistical aggregations."""

    status: str = Field("success", description="Status indicator ('success' or 'no_data')")
    variable: str = Field(..., description="Target variable aggregated")
    unit: str = Field(..., description="Scientific unit of measurement")
    requested_count: int = Field(0, description="Total matching observations evaluated")
    valid_count: int = Field(0, description="Valid numeric observations included in calculation")
    mean: Optional[float] = Field(None, description="Calculated arithmetic mean")
    median: Optional[float] = Field(None, description="Calculated median")
    minimum: Optional[float] = Field(None, description="Minimum observed value")
    maximum: Optional[float] = Field(None, description="Maximum observed value")
    float_ids: List[str] = Field(default_factory=list, description="List of platform IDs contributing data")
    data_source: str = Field(..., description="Origin data provider identifier")
    is_mock: bool = Field(False, description="Flag identifying synthetic mock data vs real observations")


class DepthProfileRequest(BaseModel):
    """Request model for generating vertical profile aggregations."""

    query: ObservationQuery = Field(..., description="Observation query filter constraints")


class DepthProfilePoint(BaseModel):
    """Point model representing vertical ocean profile observation at a specific depth/pressure."""

    depth_m: Optional[float] = Field(None, description="Water depth in meters")
    pressure_dbar: Optional[float] = Field(None, description="Water pressure in decibars")
    temperature: Optional[float] = Field(None, description="Sea temperature in °C")
    salinity: Optional[float] = Field(None, description="Practical salinity in PSU")
    timestamp: datetime = Field(..., description="Observation UTC timestamp")
    qc_flags: Dict[str, Any] = Field(default_factory=dict, description="Quality flags")


class DepthProfileResult(BaseModel):
    """Result model representing vertical ocean profiles."""

    status: str = Field("success", description="Status indicator")
    float_id: str = Field(..., description="Platform WMO ID")
    timestamp: datetime = Field(..., description="Profile timestamp")
    latitude: float = Field(..., description="Profile latitude")
    longitude: float = Field(..., description="Profile longitude")
    profile_points: List[DepthProfilePoint] = Field(default_factory=list, description="Vertical profile points")
    point_count: int = Field(0, description="Total points in profile")
    data_source: str = Field(..., description="Data provider identifier")
    is_mock: bool = Field(False, description="Mock data indicator")


class FloatComparisonRequest(BaseModel):
    """Request model for comparing observations between two float platforms."""

    float_id_a: str = Field(..., description="First float platform WMO ID")
    float_id_b: str = Field(..., description="Second float platform WMO ID")
    target_variable: str = Field("TEMP", description="Variable to compare (TEMP, PSAL, PRES)")
    depth_tolerance_m: float = Field(10.0, ge=0.0, description="Depth tolerance in meters for matching levels")

    @field_validator("target_variable")
    @classmethod
    def validate_target_variable(cls, v: str) -> str:
        var_upper = v.strip().upper()
        if var_upper not in SUPPORTED_VARIABLES:
            raise ValueError(
                f"Unsupported variable '{v}'. Supported variables: {list(SUPPORTED_VARIABLES.keys())}"
            )
        return var_upper


class FloatComparisonResult(BaseModel):
    """Result model for multi-float comparison analysis."""

    status: str = Field("success", description="Status indicator")
    float_id_a: str = Field(..., description="First float WMO ID")
    float_id_b: str = Field(..., description="Second float WMO ID")
    variable: str = Field(..., description="Variable compared")
    unit: str = Field(..., description="Unit of measurement")
    metric: str = Field("depth_matched_difference", description="Comparison metric name")
    mean_difference: Optional[float] = Field(None, description="Average difference (Float A - Float B)")
    max_difference: Optional[float] = Field(None, description="Maximum absolute difference")
    min_difference: Optional[float] = Field(None, description="Minimum absolute difference")
    matched_levels_count: int = Field(0, description="Count of depth-matched level pairs evaluated")
    data_source_a: str = Field(..., description="Data source for Float A")
    data_source_b: str = Field(..., description="Data source for Float B")
    is_mock: bool = Field(False, description="Mock data indicator")


class TrendAnalysisRequest(BaseModel):
    """Request model for temporal trend evaluation."""

    query: ObservationQuery = Field(..., description="Observation query filter constraints")
    target_variable: str = Field(..., description="Target variable for trend analysis")

    @field_validator("target_variable")
    @classmethod
    def validate_target_variable(cls, v: str) -> str:
        var_upper = v.strip().upper()
        if var_upper not in SUPPORTED_VARIABLES:
            raise ValueError(
                f"Unsupported variable '{v}'. Supported variables: {list(SUPPORTED_VARIABLES.keys())}"
            )
        return var_upper


class TrendAnalysisResult(BaseModel):
    """Result model for temporal trend/change evaluation."""

    status: str = Field("success", description="Status indicator")
    variable: str = Field(..., description="Target variable analyzed")
    unit: str = Field(..., description="Unit of measurement")
    start_time: Optional[datetime] = Field(None, description="Earliest observation timestamp")
    end_time: Optional[datetime] = Field(None, description="Latest observation timestamp")
    start_value: Optional[float] = Field(None, description="Earliest observed value")
    end_value: Optional[float] = Field(None, description="Latest observed value")
    absolute_change: Optional[float] = Field(None, description="Absolute change (End Value - Start Value)")
    percentage_change: Optional[float] = Field(None, description="Percentage change relative to start value")
    observation_count: int = Field(0, description="Total valid observations evaluated")
    float_ids: List[str] = Field(default_factory=list, description="Contributing float IDs")
    data_source: str = Field(..., description="Origin data provider identifier")
    is_mock: bool = Field(False, description="Mock data indicator")
