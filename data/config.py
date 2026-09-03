"""
Configuration settings for FloatChat ARGO oceanographic data retrieval providers.
"""

import os
from typing import Optional
from pydantic import BaseModel, Field


class DataConfig(BaseModel):
    """Configuration parameters for ARGO data providers and ingestion engines."""

    provider_type: str = Field(
        default="erddap",
        description="ARGO data source provider: 'erddap' | 'sample' | 'mock' | 'netcdf' | 'parquet' | 'remote'",
    )
    data_path: Optional[str] = Field(
        default=None,
        description="File path or directory containing NetCDF (*.nc) or Parquet (*.parquet) datasets",
    )
    remote_api_url: str = Field(
        default="https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json",
        description="Base REST endpoint for remote ARGO API queries",
    )
    remote_api_key_env_var: str = Field(
        default="ARGOVIS_API_KEY",
        description="Environment variable name containing the remote ARGO API key",
    )
    default_search_radius_km: float = Field(
        default=50.0,
        gt=0.0,
        description="Default radial search distance in kilometers",
    )
    depth_tolerance_m: float = Field(
        default=20.0,
        gt=0.0,
        description="Configurable vertical depth tolerance in meters for target depth matching",
    )
    max_observations: int = Field(
        default=1000,
        gt=0,
        description="Maximum number of observation records returned per query",
    )
    timeout_seconds: float = Field(
        default=25.0,
        gt=0.0,
        description="Network request timeout in seconds for remote providers",
    )

    def get_api_key(self) -> Optional[str]:
        """Safely retrieve remote API key from environment variables."""
        return os.environ.get(self.remote_api_key_env_var)

    @classmethod
    def from_env(cls) -> "DataConfig":
        """Construct DataConfig from active environment variables."""
        provider_env = os.environ.get("ARGO_DATA_PROVIDER") or os.environ.get("DATA_PROVIDER")
        is_prod = os.environ.get("ENVIRONMENT", "").lower() == "production" or os.environ.get("RENDER") == "true"

        if is_prod and (not provider_env or provider_env in ("sample", "mock")):
            provider_type = "erddap"
        elif provider_env:
            provider_type = provider_env.lower().strip()
        else:
            provider_type = "erddap"

        return cls(
            provider_type=provider_type,
            data_path=os.environ.get("ARGO_DATA_PATH"),
            remote_api_url=os.environ.get("ARGO_BASE_URL") or os.environ.get("ARGOVIS_API_URL", "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json"),
            remote_api_key_env_var=os.environ.get("ARGOVIS_API_KEY_VAR", "ARGOVIS_API_KEY"),
        )
