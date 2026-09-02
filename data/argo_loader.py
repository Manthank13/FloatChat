"""
ARGO dataset loaders for NetCDF (.nc), Apache Parquet (.parquet), and sample memory sources.
"""

from typing import List, Optional, Tuple

from data.config import DataConfig
from data.interface import BaseArgoDataSource
from data.models import ArgoObservation, ArgoProfile
from data.providers.netcdf import NetCDFArgoProvider
from data.providers.parquet import ParquetArgoProvider
from data.providers.sample import SampleArgoProvider

# Backward compatible class aliases
NetCDFArgoLoader = NetCDFArgoProvider
ParquetArgoLoader = ParquetArgoProvider
SampleArgoDataSource = SampleArgoProvider


def get_default_data_source(config: Optional[DataConfig] = None) -> BaseArgoDataSource:
    """Return the default active ARGO data source."""
    if config:
        from data.providers import create_argo_provider
        return create_argo_provider(config)
    return SampleArgoProvider()
