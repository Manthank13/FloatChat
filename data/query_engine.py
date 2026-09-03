from __future__ import annotations

import logging
import math
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

if TYPE_CHECKING:
    from ai.models import OceanParameter, StructuredQuery

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
from data.models import ArgoObservation, DataSummary, RetrievalResult
from data.providers import (
    ArgovisRESTProvider,
    BaseArgoProvider,
    NetCDFArgoProvider,
    ParquetArgoProvider,
    SampleArgoProvider,
    create_argo_provider,
)

logger = logging.getLogger(__name__)


class ArgoDataRetriever(BaseDataRetriever):
    """
    Core data retrieval engine executing StructuredQuery requests against ARGO data sources.
    """

    def __init__(
        self,
        data_source: Optional[BaseArgoDataSource] = None,
        config: Optional[DataConfig] = None,
    ):
        self.config = config or DataConfig.from_env()
        self.data_source = data_source or create_argo_provider(self.config)

    def retrieve(self, query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """
        Execute structured query against the underlying ARGO data source.

        Args:
            query: Pydantic StructuredQuery object from the AI parser or raw query dict.

        Returns:
            RetrievalResult with matched observation records, summary statistics, and metadata.
        """
        # Convert dict to StructuredQuery if necessary
        from ai.models import StructuredQuery
        sq = query if isinstance(query, StructuredQuery) else StructuredQuery(**query)

        param_names = [p.value if hasattr(p, "value") else str(p) for p in sq.parameters]
        warnings: List[str] = []
        errors: List[str] = list(sq.validation_errors)

        spatial_info = {
            "location_name": sq.location.name if sq.location else None,
            "latitude": sq.location.latitude if sq.location else None,
            "longitude": sq.location.longitude if sq.location else None,
            "radius_km": sq.radius_km or (sq.location.radius_km if sq.location else None),
            "bounding_box": (
                [
                    sq.location.bounding_box.min_latitude,
                    sq.location.bounding_box.min_longitude,
                    sq.location.bounding_box.max_latitude,
                    sq.location.bounding_box.max_longitude,
                ]
                if sq.location and sq.location.bounding_box and hasattr(sq.location.bounding_box, "min_latitude")
                else (list(sq.location.bounding_box) if sq.location and sq.location.bounding_box else None)
            ),
        }

        depth_info = {
            "target_depth": sq.depth.target_depth if sq.depth else None,
            "depth_min": sq.depth.depth_min if sq.depth else (sq.depth_min if sq.depth_min is not None else None),
            "depth_max": sq.depth.depth_max if sq.depth else (sq.depth_max if sq.depth_max is not None else None),
            "unit": sq.depth.unit if sq.depth else "meters",
        }

        time_dict = None
        if sq.time_range:
            time_dict = (
                sq.time_range.model_dump()
                if hasattr(sq.time_range, "model_dump")
                else sq.time_range.dict()
            )

        # 1. Handle Invalid Queries
        if not sq.is_valid:
            error_summary = "; ".join(sq.validation_errors) if sq.validation_errors else "Invalid query parameters"
            return RetrievalResult(
                query_raw=sq.raw_query,
                intent=sq.intent.value if hasattr(sq.intent, "value") else str(sq.intent),
                parameters_requested=param_names,
                total_matched_observations=0,
                matched_observations=[],
                matched_platforms=[],
                summary=generate_data_summary([], param_names),
                summary_statistics={},
                spatial_info=spatial_info,
                depth_info=depth_info,
                time_info=time_dict or {},
                query_metadata={"confidence": sq.confidence, "validation_errors": sq.validation_errors},
                warnings=warnings,
                errors=errors,
                data_source="NONE",
                confidence=sq.confidence,
                is_empty=True,
                message=f"Query validation failed: {error_summary}",
            )

        # 1b. Handle General Informational / Data Source Queries
        if (hasattr(sq.intent, "value") and sq.intent.value == "general_query") or str(sq.intent) == "general_query":
            return RetrievalResult(
                query_raw=sq.raw_query,
                intent="general_query",
                parameters_requested=[],
                total_matched_observations=0,
                matched_observations=[],
                matched_platforms=[],
                summary=generate_data_summary([], []),
                summary_statistics={},
                spatial_info={},
                depth_info={},
                time_info={},
                query_metadata={"confidence": sq.confidence, "validation_errors": []},
                warnings=[],
                errors=[],
                data_source="REAL_ARGO_GDAC",
                confidence=sq.confidence,
                is_empty=True,
                message="General oceanographic and data provenance query processed.",
            )

        # 2. Compute coarse bounding box for push-down filtering
        min_lat, max_lat, min_lon, max_lon = None, None, None, None
        if sq.location:
            if sq.location.bounding_box is not None and sq.radius_km is None and (sq.location.radius_km is None):
                bbox = sq.location.bounding_box
                min_lat = bbox.min_latitude if hasattr(bbox, "min_latitude") else bbox[0]
                min_lon = bbox.min_longitude if hasattr(bbox, "min_longitude") else bbox[1]
                max_lat = bbox.max_latitude if hasattr(bbox, "max_latitude") else bbox[2]
                max_lon = bbox.max_longitude if hasattr(bbox, "max_longitude") else bbox[3]
            elif sq.location.latitude is not None and sq.location.longitude is not None:
                r_km = sq.radius_km or (sq.location.radius_km if sq.location.radius_km is not None else 200.0)
                d_lat = r_km / 111.0
                d_lon = r_km / (111.0 * max(0.1, math.cos(math.radians(sq.location.latitude))))
                min_lat = sq.location.latitude - d_lat
                max_lat = sq.location.latitude + d_lat
                min_lon = sq.location.longitude - d_lon
                max_lon = sq.location.longitude + d_lon

        # 3. Load observations from data source
        if hasattr(self.data_source, "query_observations"):
            raw_observations = self.data_source.query_observations(
                query=sq,
                min_lat=min_lat,
                max_lat=max_lat,
                min_lon=min_lon,
                max_lon=max_lon,
            )
        else:
            raw_observations = self.data_source.load_observations()

        # 4. Filter out bad QC records
        observations = filter_by_quality(raw_observations)

        # 5. Filter by Platform ID (Float WMO Number)
        if sq.platform_id:
            observations = filter_by_platform(observations, sq.platform_id)

        # 6. Filter by Spatial Bounds / Geodesic Haversine Radius
        if sq.location:
            observations = filter_by_spatial(
                observations=observations,
                location=sq.location,
                default_radius_km=sq.radius_km or (sq.location.radius_km if sq.location.radius_km is not None else 50.0),
            )

        # 7. Filter by Temporal Constraints
        if sq.time_range:
            observations = filter_by_time(observations, sq.time_range)

        # 8. Filter by Depth
        if sq.depth:
            observations = filter_by_depth(observations, sq.depth)

        # 9. Extract matched platforms, generate summary & statistics
        matched_platforms = sorted(list({obs.platform_id for obs in observations}))
        data_summary = generate_data_summary(observations, param_names)
        stats = data_summary.parameter_summaries

        is_empty = len(observations) == 0
        message = self._generate_summary_message(sq, observations, stats)

        return RetrievalResult(
            query_raw=sq.raw_query,
            intent=sq.intent.value if hasattr(sq.intent, "value") else str(sq.intent),
            parameters_requested=param_names,
            total_matched_observations=len(observations),
            matched_observations=observations,
            matched_platforms=matched_platforms,
            summary=data_summary,
            summary_statistics=stats,
            indicators=data_summary.indicators if data_summary else {},
            spatial_info=spatial_info,
            depth_info=depth_info,
            time_info=time_dict or {},
            query_metadata={
                "location": sq.location.name if sq.location else None,
                "radius_km": sq.radius_km or (sq.location.radius_km if sq.location else None),
                "depth_min": sq.depth.depth_min if sq.depth else None,
                "depth_max": sq.depth.depth_max if sq.depth else None,
                "target_depth": sq.depth.target_depth if sq.depth else None,
                "time_range": time_dict,
                "platform_id": sq.platform_id,
            },
            warnings=warnings,
            errors=errors,
            data_source=observations[0].data_source if observations else (self.data_source.name if hasattr(self.data_source, "name") else "SAMPLE_TEST_DATASET"),
            confidence=sq.confidence,
            is_empty=is_empty,
            message=message,
        )

    def _generate_summary_message(
        self,
        sq: StructuredQuery,
        observations: List[ArgoObservation],
        stats: Dict[str, Any],
    ) -> str:
        """Generate a concise, factual summary message of data retrieval results."""
        if not observations:
            loc_str = f" near {sq.location.name}" if sq.location and sq.location.name else ""
            depth_str = f" at depth {sq.depth.target_depth}m" if sq.depth and sq.depth.target_depth else ""
            return f"No ARGO float observations found matching criteria{loc_str}{depth_str}."

        count = len(observations)
        platform_count = len(set(obs.platform_id for obs in observations))
        
        stat_snippets = []
        for p, s in stats.items():
            if s.get("mean") is not None:
                unit = "°C" if p == "TEMP" else ("PSU" if p == "PSAL" else "")
                stat_snippets.append(f"mean {p}={s['mean']}{unit} (min: {s['min']}, max: {s['max']})")

        stats_summary = ", ".join(stat_snippets) if stat_snippets else "data matched"
        return f"Retrieved {count} observation levels across {platform_count} ARGO float(s): {stats_summary}."


class MockDataRetriever(ArgoDataRetriever):
    """
    Deterministic mock data retriever for development, testing, and offline use.
    Uses the representative Indian Ocean sample dataset.
    """

    def __init__(self, custom_observations: Optional[List[ArgoObservation]] = None):
        super().__init__(data_source=SampleArgoProvider(custom_observations=custom_observations))


class RealArgoRetriever(ArgoDataRetriever):
    """
    Adapter retriever for real ARGO datasets (NetCDF, Parquet, or remote GDAC / ERDDAP services).
    """

    def __init__(
        self,
        source_type: str = "netcdf",
        source_path: Optional[str] = None,
        data_source: Optional[BaseArgoDataSource] = None,
        config: Optional[DataConfig] = None,
    ):
        cfg = config or DataConfig(provider_type=source_type, data_path=source_path)
        if data_source is not None:
            ds = data_source
        elif source_type.lower() in ["parquet", "pq"]:
            ds = ParquetArgoProvider(parquet_path=source_path or cfg.data_path)
        elif source_type.lower() in ["netcdf", "nc"]:
            ds = NetCDFArgoProvider(file_path_or_dir=source_path or cfg.data_path)
        elif source_type.lower() in ["remote", "argovis", "erddap"]:
            ds = ArgovisRESTProvider(config=cfg)
        else:
            ds = create_argo_provider(cfg)

        super().__init__(data_source=ds, config=cfg)


# Alias for interface consistency
DataRetriever = ArgoDataRetriever
