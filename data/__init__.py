"""
FloatChat Data Package - ARGO data models, loaders, spatial algorithms, and query engines.
"""

from data.argo_loader import (
    BaseArgoDataSource,
    NetCDFArgoLoader,
    ParquetArgoLoader,
    SampleArgoDataSource,
    get_default_data_source,
)
from data.config import DataConfig
from data.filters import (
    compute_statistics,
    filter_by_depth,
    filter_by_platform,
    filter_by_quality,
    filter_by_spatial,
    filter_by_time,
    generate_data_summary,
)
from data.interface import BaseArgoDataSource, BaseDataRetriever
from data.models import (
    ArgoObservation,
    ArgoProfile,
    DataQueryResult,
    DataSummary,
    ObservationQC,
    RetrievalResult,
)
from data.normalization import (
    clean_numeric,
    convert_argo_juld_to_iso,
    normalize_observation_dict,
    parse_qc_flag,
)
from data.providers import (
    ArgovisRESTProvider,
    BaseArgoProvider,
    NetCDFArgoProvider,
    ParquetArgoProvider,
    SampleArgoProvider,
    create_argo_provider,
)
from data.query_engine import (
    ArgoDataRetriever,
    DataRetriever,
    MockDataRetriever,
    RealArgoRetriever,
)
from data.spatial import (
    EARTH_RADIUS_KM,
    haversine_distance,
    is_point_in_bounding_box,
    is_point_within_radius,
)

__all__ = [
    "ArgoObservation",
    "ArgoProfile",
    "ObservationQC",
    "DataSummary",
    "RetrievalResult",
    "DataQueryResult",
    "DataConfig",
    "BaseArgoDataSource",
    "BaseDataRetriever",
    "BaseArgoProvider",
    "SampleArgoProvider",
    "NetCDFArgoProvider",
    "ParquetArgoProvider",
    "ArgovisRESTProvider",
    "create_argo_provider",
    "SampleArgoDataSource",
    "NetCDFArgoLoader",
    "ParquetArgoLoader",
    "get_default_data_source",
    "ArgoDataRetriever",
    "DataRetriever",
    "MockDataRetriever",
    "RealArgoRetriever",
    "normalize_observation_dict",
    "clean_numeric",
    "parse_qc_flag",
    "convert_argo_juld_to_iso",
    "filter_by_spatial",
    "filter_by_depth",
    "filter_by_time",
    "filter_by_platform",
    "filter_by_quality",
    "compute_statistics",
    "generate_data_summary",
    "EARTH_RADIUS_KM",
    "haversine_distance",
    "is_point_within_radius",
    "is_point_in_bounding_box",
]
