from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class Observation(BaseModel):
    """Internal model representing a single depth/pressure level observation within an Argo profile."""

    float_id: str = Field(..., description="Unique platform identifier (WMO ID)")
    timestamp: datetime = Field(..., description="Observation UTC timestamp")
    latitude: float = Field(..., description="Observation latitude in degrees (-90 to 90)")
    longitude: float = Field(..., description="Observation longitude in degrees (-180 to 180)")
    pressure: Optional[float] = Field(None, description="Water pressure in decibars (dbar)")
    depth: Optional[float] = Field(None, description="Approximate water depth in meters (m)")
    temperature: Optional[float] = Field(None, description="Sea water temperature in degree Celsius (°C)")
    salinity: Optional[float] = Field(None, description="Practical salinity (PSU)")
    qc_flags: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Quality control flags for PRES, TEMP, PSAL")
    is_mock: bool = Field(False, description="Flag identifying if this observation is synthetic/mock data")
    data_source: str = Field("argo_gdac", description="Origin data provider identifier")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError(f"Latitude {v} out of valid bounds [-90.0, 90.0]")
        return round(v, 6)

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError(f"Longitude {v} out of valid bounds [-180.0, 180.0]")
        return round(v, 6)


class Profile(BaseModel):
    """Internal model representing an Argo float profile dive cycle."""

    float_id: str = Field(..., description="Unique platform identifier (WMO ID)")
    cycle_number: Optional[int] = Field(None, description="Profile cycle number")
    timestamp: datetime = Field(..., description="Profile timestamp UTC")
    latitude: float = Field(..., description="Profile location latitude")
    longitude: float = Field(..., description="Profile location longitude")
    observations: List[Observation] = Field(default_factory=list, description="Vertical profile measurements")
    observation_count: int = Field(0, description="Total observations count in this profile")
    is_mock: bool = Field(False, description="Flag identifying if this profile is synthetic/mock data")
    data_source: str = Field("argo_gdac", description="Origin data provider identifier")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError(f"Latitude {v} out of valid bounds [-90.0, 90.0]")
        return round(v, 6)

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError(f"Longitude {v} out of valid bounds [-180.0, 180.0]")
        return round(v, 6)


class FloatMetadata(BaseModel):
    """Internal model representing metadata for an Argo float platform."""

    float_id: str = Field(..., description="Unique platform identifier (WMO ID)")
    last_latitude: Optional[float] = Field(None, description="Last known latitude")
    last_longitude: Optional[float] = Field(None, description="Last known longitude")
    last_timestamp: Optional[datetime] = Field(None, description="Last profile timestamp UTC")
    cycle_number: Optional[int] = Field(None, description="Latest profile cycle number")
    total_profiles: int = Field(0, description="Total retrieved profiles count")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Platform metadata (institution, platform_type, etc.)")
    is_mock: bool = Field(False, description="Flag identifying if float metadata is synthetic/mock data")
    data_source: str = Field("argo_gdac", description="Origin data provider identifier")
