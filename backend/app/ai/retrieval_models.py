"""
Pydantic data models for ARGO oceanographic observations, vertical profiles,
structured retrieval results, and pre-computed statistical summaries.
"""

from enum import IntEnum
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ObservationQC(IntEnum):
    """Standard IOC/WMO ARGO Quality Control Flag definitions."""
    NO_QC_PERFORMED = 0
    GOOD = 1
    PROBABLY_GOOD = 2
    POTENTIALLY_CORRECTABLE = 3
    BAD = 4
    CHANGED = 5
    NOT_USED = 6
    NOMINAL = 7
    INTERPOLATED = 8
    MISSING_VALUE = 9


class ArgoObservation(BaseModel):
    """
    Individual measurement level / depth observation record from an ARGO float.
    """
    platform_id: str = Field(..., description="ARGO Float 7-digit WMO identifier")
    cycle_number: Optional[int] = Field(default=None, description="Profile ascent cycle number")
    latitude: float = Field(..., description="Observation latitude in decimal degrees")
    longitude: float = Field(..., description="Observation longitude in decimal degrees")
    timestamp: str = Field(..., description="ISO 8601 UTC observation timestamp (YYYY-MM-DDTHH:MM:SSZ)")
    pressure_dbar: float = Field(..., description="In-situ sea water pressure in decibars")
    depth_m: float = Field(..., description="Calculated observation depth in meters")
    
    # Core Oceanographic Variables
    temp_c: Optional[float] = Field(default=None, description="In-situ Sea Temperature (°C, ITS-90)")
    psal_psu: Optional[float] = Field(default=None, description="Practical Salinity (PSU, PSS-78)")
    
    # BGC-Argo Variables
    doxy_umol_kg: Optional[float] = Field(default=None, description="Dissolved Oxygen (µmol/kg)")
    chla_mg_m3: Optional[float] = Field(default=None, description="Chlorophyll-A concentration (mg/m³)")
    nitrate_umol_kg: Optional[float] = Field(default=None, description="Nitrate concentration (µmol/kg)")
    ph_in_situ: Optional[float] = Field(default=None, description="In-situ total scale pH")
    
    # Quality Control Flags (1 = Good, 2 = Probably Good, 4 = Bad, 9 = Missing)
    temp_qc: int = Field(default=1, description="Temperature QC flag")
    psal_qc: int = Field(default=1, description="Salinity QC flag")
    doxy_qc: Optional[int] = Field(default=None, description="Oxygen QC flag")
    
    # Metadata & Distance Annotation
    data_source: str = Field(default="ARGO_GDAC", description="Originating data repository or sample indicator")
    distance_km: Optional[float] = Field(default=None, description="Geodesic distance to query coordinate in km")

    def get_parameter_value(self, param: str) -> Optional[float]:
        """Retrieve the numeric value for a requested parameter code."""
        p = param.upper()
        if p in ["TEMP", "TEMPERATURE"]:
            return self.temp_c
        elif p in ["PSAL", "SALINITY"]:
            return self.psal_psu
        elif p in ["PRES", "PRESSURE"]:
            return self.pressure_dbar
        elif p in ["DOXY", "OXYGEN"]:
            return self.doxy_umol_kg
        elif p in ["CHLA", "CHLOROPHYLL"]:
            return self.chla_mg_m3
        elif p in ["NITRATE"]:
            return self.nitrate_umol_kg
        elif p in ["PH", "PH_IN_SITU_TOTAL"]:
            return self.ph_in_situ
        return None

    def is_valid_measurement(self, param: str) -> bool:
        """Check if observation contains a non-null, QC-valid measurement for the parameter."""
        val = self.get_parameter_value(param)
        if val is None:
            return False
        p = param.upper()
        if p in ["TEMP", "TEMPERATURE"]:
            return self.temp_qc in [1, 2, 3]
        elif p in ["PSAL", "SALINITY"]:
            return self.psal_qc in [1, 2, 3]
        elif p in ["DOXY", "OXYGEN"]:
            return self.doxy_qc in [1, 2, 3] if self.doxy_qc is not None else True
        return True


class ArgoProfile(BaseModel):
    """
    Vertical ascending/descending profile containing multiple level observations.
    """
    platform_id: str = Field(..., description="ARGO Float WMO identifier")
    cycle_number: int = Field(..., description="Ascent cycle index")
    latitude: float = Field(..., description="Surface latitude at profile transmission")
    longitude: float = Field(..., description="Surface longitude at profile transmission")
    timestamp: str = Field(..., description="Profile timestamp")
    observations: List[ArgoObservation] = Field(default_factory=list, description="Ordered depth level records")
    data_source: str = Field(default="ARGO_GDAC")


class DataSummary(BaseModel):
    """
    Pre-computed statistical and coverage summary of retrieved oceanographic data.
    Supplies the LLM synthesizer with authoritative computed metrics.
    """
    number_of_observations: int = Field(default=0, description="Total matching depth levels")
    floats_represented: List[str] = Field(default_factory=list, description="Unique float WMO IDs")
    
    # Core Oceanographic Metrics
    min_temperature: Optional[float] = Field(default=None, description="Minimum in-situ temperature (°C)")
    max_temperature: Optional[float] = Field(default=None, description="Maximum in-situ temperature (°C)")
    mean_temperature: Optional[float] = Field(default=None, description="Mean in-situ temperature (°C)")
    
    min_salinity: Optional[float] = Field(default=None, description="Minimum salinity (PSU)")
    max_salinity: Optional[float] = Field(default=None, description="Maximum salinity (PSU)")
    mean_salinity: Optional[float] = Field(default=None, description="Mean salinity (PSU)")
    
    # Depth and Time Bounds
    depth_coverage: Dict[str, Optional[float]] = Field(
        default_factory=lambda: {"min_depth_m": None, "max_depth_m": None},
        description="Depth range of observations",
    )
    time_coverage: Dict[str, Optional[str]] = Field(
        default_factory=lambda: {"earliest": None, "latest": None},
        description="Temporal bounds of observations",
    )
    parameter_summaries: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict, description="Detailed per-parameter statistics"
    )

    def to_text_summary(self) -> str:
        """Format an informative, scientific text summary for the AI response generator."""
        if self.number_of_observations == 0:
            return "No observations found matching the requested criteria."

        parts = [
            f"Retrieved {self.number_of_observations} observation levels across {len(self.floats_represented)} ARGO float(s) ({', '.join(self.floats_represented)})."
        ]

        if self.depth_coverage.get("min_depth_m") is not None:
            parts.append(
                f"Depth coverage: {self.depth_coverage['min_depth_m']}m to {self.depth_coverage['max_depth_m']}m."
            )

        if self.time_coverage.get("earliest"):
            parts.append(
                f"Time window: {self.time_coverage['earliest']} to {self.time_coverage['latest']}."
            )

        if self.mean_temperature is not None:
            parts.append(
                f"Temperature: mean={self.mean_temperature}°C (min={self.min_temperature}°C, max={self.max_temperature}°C)."
            )

        if self.mean_salinity is not None:
            parts.append(
                f"Salinity: mean={self.mean_salinity} PSU (min={self.min_salinity} PSU, max={self.max_salinity} PSU)."
            )

        return " ".join(parts)


class RetrievalResult(BaseModel):
    """
    Structured data retrieval result returned to the backend or AI layer.
    """
    query_raw: str = Field(..., description="Original user prompt")
    intent: str = Field(..., description="Extracted query intent")
    parameters_requested: List[str] = Field(default_factory=list, description="Target parameter codes")
    total_matched_observations: int = Field(default=0, description="Count of matched measurement levels")
    matched_observations: List[ArgoObservation] = Field(default_factory=list, description="Matching observation records")
    matched_platforms: List[str] = Field(default_factory=list, description="Unique platform WMO numbers present")
    summary: Optional[DataSummary] = Field(default=None, description="Pre-computed statistical summary")
    summary_statistics: Dict[str, Any] = Field(default_factory=dict, description="Calculated descriptive statistics")
    spatial_info: Dict[str, Any] = Field(default_factory=dict, description="Location, coordinates, and radius constraints")
    depth_info: Dict[str, Any] = Field(default_factory=dict, description="Depth filters applied")
    time_info: Dict[str, Any] = Field(default_factory=dict, description="Temporal filters applied")
    query_metadata: Dict[str, Any] = Field(default_factory=dict, description="Search execution parameters & constraints")
    warnings: List[str] = Field(default_factory=list, description="Non-fatal execution warnings")
    errors: List[str] = Field(default_factory=list, description="Validation or retrieval error messages")
    data_source: str = Field(default="ARGO_GDAC", description="Data provenance note")
    confidence: float = Field(default=1.0, description="Query confidence score")
    is_empty: bool = Field(default=False, description="Whether query returned zero matching observations")
    message: str = Field(default="", description="Human-readable execution and result summary")

    def to_backend_dict(self) -> Dict[str, Any]:
        """Export normalized dictionary optimized for FastAPI backend response serialization."""
        obs_dicts = [
            obs.model_dump() if hasattr(obs, "model_dump") else obs.dict()
            for obs in self.matched_observations
        ]
        sum_dict = (
            (self.summary.model_dump() if hasattr(self.summary, "model_dump") else self.summary.dict())
            if self.summary
            else None
        )
        return {
            "query_raw": self.query_raw,
            "intent": self.intent,
            "parameters_requested": self.parameters_requested,
            "total_matched_observations": self.total_matched_observations,
            "matched_platforms": self.matched_platforms,
            "summary": sum_dict,
            "summary_statistics": self.summary_statistics,
            "spatial_info": self.spatial_info,
            "depth_info": self.depth_info,
            "time_info": self.time_info,
            "query_metadata": self.query_metadata,
            "warnings": self.warnings,
            "errors": self.errors,
            "data_source": self.data_source,
            "confidence": self.confidence,
            "is_empty": self.is_empty,
            "message": self.message,
            "observations": obs_dicts,
        }


# Backwards compatibility alias
DataQueryResult = RetrievalResult
