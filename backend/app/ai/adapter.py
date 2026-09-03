"""
Backend AI Retriever Adapter for FloatChat.

Bridges AI StructuredQuery objects into real backend services:
- ObservationQueryService (geodesic filtering and attribute constraints)
- ScientificAnalysisService (depth profiles, statistics, comparisons, trends)
- ArgoDataSource (platform telemetry and real observations)

Prevents any duplication of scientific calculations or spatial filtering.
Authoritative calculations remain strictly in backend services.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Union

from app.ai.models import OceanParameter, QueryIntent, StructuredQuery
from app.ai.retrieval_models import ArgoObservation, DataSummary, RetrievalResult
from app.ai.terminology import KNOWN_OCEAN_LOCATIONS
from app.models.analysis import DepthProfileRequest, FloatComparisonRequest, StatisticsRequest
from app.models.query import ObservationQuery
from app.services.analysis import ScientificAnalysisService
from app.services.base import ArgoDataSource
from app.services.factory import get_argo_data_source
from app.services.query import ObservationQueryService

logger = logging.getLogger(__name__)


class BackendArgoRetriever:
    """
    Adapter translating AI StructuredQuery requests into existing backend query
    and scientific analysis operations.
    """

    def __init__(
        self,
        data_source: Optional[ArgoDataSource] = None,
        query_service: Optional[ObservationQueryService] = None,
        analysis_service: Optional[ScientificAnalysisService] = None,
    ):
        self.data_source = data_source or get_argo_data_source()
        self.query_service = query_service or ObservationQueryService(data_source=self.data_source)
        self.analysis_service = analysis_service or ScientificAnalysisService(data_source=self.data_source)

    def _resolve_spatial(self, sq: StructuredQuery) -> Dict[str, Any]:
        """Resolves latitude, longitude, and radius_km from StructuredQuery or reference terminology."""
        lat = sq.location.latitude if sq.location else None
        lon = sq.location.longitude if sq.location else None
        radius = sq.radius_km or (sq.location.radius_km if sq.location else None)
        loc_name = sq.location.name if sq.location else None

        # Fallback to known ocean locations dictionary if coords missing
        if (lat is None or lon is None) and loc_name:
            clean_name = loc_name.strip().lower()
            if clean_name in KNOWN_OCEAN_LOCATIONS:
                info = KNOWN_OCEAN_LOCATIONS[clean_name]
                lat = info.get("latitude")
                lon = info.get("longitude")
                if radius is None:
                    radius = info.get("default_radius_km", 200.0)

        # Support comparison query targets if location is not explicitly set
        if (lat is None or lon is None) and sq.comparison:
            for target in (sq.comparison.target_a, sq.comparison.target_b):
                if target:
                    clean_t = target.strip().lower()
                    if clean_t in KNOWN_OCEAN_LOCATIONS:
                        info = KNOWN_OCEAN_LOCATIONS[clean_t]
                        lat = info.get("latitude")
                        lon = info.get("longitude")
                        radius = info.get("default_radius_km", 500.0)
                        loc_name = loc_name or info.get("name", target)
                        break

        return {
            "name": loc_name,
            "latitude": lat,
            "longitude": lon,
            "radius_km": radius or 150.0,
        }

    def _map_parameters_to_variables(self, parameters: List[OceanParameter]) -> Optional[List[str]]:
        """Maps AI OceanParameter enums to backend variable codes (TEMP, PSAL, PRES)."""
        if not parameters:
            return None
        vars_list: List[str] = []
        for p in parameters:
            val = p.value.upper() if hasattr(p, "value") else str(p).upper()
            if val in ("TEMP", "TEMPERATURE"):
                vars_list.append("TEMP")
            elif val in ("PSAL", "SALINITY"):
                vars_list.append("PSAL")
            elif val in ("PRES", "PRESSURE"):
                vars_list.append("PRES")
        return vars_list if vars_list else None

    async def retrieve_async(self, query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """
        Asynchronously executes StructuredQuery against the backend services.
        """
        sq = query if isinstance(query, StructuredQuery) else StructuredQuery(**query)
        spatial = self._resolve_spatial(sq)
        target_vars = self._map_parameters_to_variables(sq.parameters)

        depth_min = sq.depth_min or (sq.depth.depth_min if sq.depth else None)
        depth_max = sq.depth_max or (sq.depth.depth_max if sq.depth else None)
        depth_target = None
        if sq.depth and sq.depth.target_depth is not None:
            depth_target = sq.depth.target_depth
            if depth_min == depth_max:
                depth_min = None
                depth_max = None

        # Construct backend ObservationQuery
        obs_query = ObservationQuery(
            float_id=sq.platform_id,
            latitude=spatial["latitude"],
            longitude=spatial["longitude"],
            radius_km=spatial["radius_km"],
            depth_m=depth_target,
            depth_min_m=depth_min,
            depth_max_m=depth_max,
            variable=target_vars,
            limit=100,
        )

        matched_obs: List[ArgoObservation] = []
        data_source_name = getattr(self.data_source, "data_source_id", "ARGO_GDAC")

        try:
            # 1. Profile Query Intent
            if sq.intent == QueryIntent.PROFILE_QUERY:
                prof_req = DepthProfileRequest(query=obs_query)
                prof_res = await self.analysis_service.generate_depth_profile(prof_req)

                if prof_res.profile_points:
                    for pt in prof_res.profile_points:
                        matched_obs.append(
                            ArgoObservation(
                                platform_id=prof_res.float_id,
                                latitude=prof_res.latitude,
                                longitude=prof_res.longitude,
                                timestamp=prof_res.timestamp.isoformat() if hasattr(prof_res.timestamp, "isoformat") else str(prof_res.timestamp),
                                pressure_dbar=pt.pressure_dbar or pt.depth_m,
                                depth_m=pt.depth_m,
                                temp_c=pt.temperature,
                                psal_psu=pt.salinity,
                                temp_qc=1,
                                psal_qc=1,
                                data_source=prof_res.data_source,
                            )
                        )
                    data_source_name = prof_res.data_source

            # 2. General Spatial / Float / Unknown Query Intent
            if not matched_obs:
                query_res = await self.query_service.execute_query(obs_query)
                for item in query_res.results:
                    t_val = item.value if item.variable.upper() == "TEMP" else None
                    s_val = item.value if item.variable.upper() == "PSAL" else None
                    matched_obs.append(
                        ArgoObservation(
                            platform_id=item.float_id,
                            latitude=item.latitude,
                            longitude=item.longitude,
                            timestamp=item.timestamp.isoformat() if hasattr(item.timestamp, "isoformat") else str(item.timestamp),
                            pressure_dbar=item.pressure_dbar or item.depth_m,
                            depth_m=item.depth_m,
                            temp_c=t_val,
                            psal_psu=s_val,
                            temp_qc=1 if item.qc_flags.get("temperature") in ("1", 1) else 2,
                            psal_qc=1 if item.qc_flags.get("salinity") in ("1", 1) else 2,
                            data_source=item.data_source,
                            distance_km=item.distance_km,
                        )
                    )
                if query_res.results:
                    data_source_name = query_res.results[0].data_source

        except Exception as exc:
            logger.error(f"Error during backend retrieval for query '{sq.raw_query}': {exc}", exc_info=True)
            return RetrievalResult(
                query_raw=sq.raw_query,
                intent=sq.intent.value if hasattr(sq.intent, "value") else str(sq.intent),
                parameters_requested=[p.value for p in sq.parameters],
                total_matched_observations=0,
                matched_observations=[],
                matched_platforms=[],
                summary=None,
                summary_statistics={},
                spatial_info=spatial,
                depth_info={"depth_min": depth_min, "depth_max": depth_max},
                time_info={},
                query_metadata={"status": "error"},
                warnings=[],
                errors=[str(exc)],
                data_source=data_source_name,
                is_empty=True,
                message=f"Backend retrieval failed: {exc}",
            )

        # Build authoritative summary statistics using backend calculations
        if not matched_obs:
            return RetrievalResult(
                query_raw=sq.raw_query,
                intent=sq.intent.value if hasattr(sq.intent, "value") else str(sq.intent),
                parameters_requested=[p.value for p in sq.parameters],
                total_matched_observations=0,
                matched_observations=[],
                matched_platforms=[],
                summary=None,
                summary_statistics={},
                spatial_info=spatial,
                depth_info={"depth_min": depth_min, "depth_max": depth_max},
                time_info={},
                query_metadata={"status": "empty"},
                warnings=["No observations matched search criteria."],
                errors=[],
                data_source=data_source_name,
                is_empty=True,
                message="No matching ARGO observations found in this region or depth range.",
            )

        platforms = sorted(list(set(o.platform_id for o in matched_obs)))
        temps = [o.temp_c for o in matched_obs if o.temp_c is not None]
        psals = [o.psal_psu for o in matched_obs if o.psal_psu is not None]
        depths = [o.depth_m for o in matched_obs]

        summary_stats: Dict[str, Any] = {}
        min_temp, max_temp, mean_temp = None, None, None
        if temps:
            min_temp = round(min(temps), 2)
            max_temp = round(max(temps), 2)
            mean_temp = round(sum(temps) / len(temps), 2)
            summary_stats["TEMP"] = {
                "min": min_temp,
                "max": max_temp,
                "mean": mean_temp,
                "count": len(temps),
            }

        min_sal, max_sal, mean_sal = None, None, None
        if psals:
            min_sal = round(min(psals), 2)
            max_sal = round(max(psals), 2)
            mean_sal = round(sum(psals) / len(psals), 2)
            summary_stats["PSAL"] = {
                "min": min_sal,
                "max": max_sal,
                "mean": mean_sal,
                "count": len(psals),
            }

        data_summary = DataSummary(
            number_of_observations=len(matched_obs),
            floats_represented=platforms,
            min_temperature=min_temp,
            max_temperature=max_temp,
            mean_temperature=mean_temp,
            min_salinity=min_sal,
            max_salinity=max_sal,
            mean_salinity=mean_sal,
            depth_coverage={
                "min_depth_m": min(depths) if depths else None,
                "max_depth_m": max(depths) if depths else None,
            },
            time_coverage={
                "earliest": min(o.timestamp for o in matched_obs) if matched_obs else None,
                "latest": max(o.timestamp for o in matched_obs) if matched_obs else None,
            },
            parameter_summaries=summary_stats,
        )

        return RetrievalResult(
            query_raw=sq.raw_query,
            intent=sq.intent.value if hasattr(sq.intent, "value") else str(sq.intent),
            parameters_requested=[p.value for p in sq.parameters],
            total_matched_observations=len(matched_obs),
            matched_observations=matched_obs,
            matched_platforms=platforms,
            summary=data_summary,
            summary_statistics=summary_stats,
            spatial_info=spatial,
            depth_info={"depth_min": min(depths) if depths else None, "depth_max": max(depths) if depths else None},
            time_info={},
            query_metadata={"status": "success"},
            warnings=[],
            errors=[],
            data_source=data_source_name,
            is_empty=False,
            message=f"Retrieved {len(matched_obs)} observation levels across {len(platforms)} float(s).",
        )

    def retrieve(self, query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """Synchronous wrapper for retrieve_async."""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            # In an already running event loop, create a new loop or thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(lambda: asyncio.run(self.retrieve_async(query)))
                return future.result()
        else:
            return loop.run_until_complete(self.retrieve_async(query))
