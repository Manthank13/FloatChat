"""
FloatChat ARGO Data Providers Package.

Exposes interchangeable data providers (Sample, NetCDF, Parquet, Remote REST)
and factory initialization logic.
"""

import logging
from typing import Optional

from data.config import DataConfig
from data.providers.base import BaseArgoProvider
from data.providers.netcdf import NetCDFArgoProvider
from data.providers.parquet import ParquetArgoProvider
from data.providers.remote import ArgovisRESTProvider
from data.providers.sample import SampleArgoProvider

logger = logging.getLogger(__name__)


def create_argo_provider(config: Optional[DataConfig] = None) -> BaseArgoProvider:
    """
    Factory helper to instantiate configured ARGO data provider.
    """
    cfg = config or DataConfig.from_env()
    ptype = cfg.provider_type.lower()

    if ptype in ["sample", "mock", "test"]:
        return SampleArgoProvider()
    elif ptype in ["netcdf", "nc"]:
        return NetCDFArgoProvider(file_path_or_dir=cfg.data_path)
    elif ptype in ["parquet", "pq"]:
        return ParquetArgoProvider(parquet_path=cfg.data_path)
    elif ptype in ["remote", "argovis", "erddap"]:
        return ArgovisRESTProvider(config=cfg)
    else:
        logger.warning("Unrecognized ARGO data provider '%s', defaulting to SampleArgoProvider", ptype)
        return SampleArgoProvider()


__all__ = [
    "BaseArgoProvider",
    "SampleArgoProvider",
    "NetCDFArgoProvider",
    "ParquetArgoProvider",
    "ArgovisRESTProvider",
    "create_argo_provider",
]
