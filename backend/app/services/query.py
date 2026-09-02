import math
from typing import List, Optional
from app.core.logging import logger
from app.models.query import (
    SUPPORTED_VARIABLES,
    NearbyFloatResult,
    ObservationQuery,
    QueryResponse,
    QueryResultItem,
)
from app.services.base import ArgoDataSource
from app.services.factory import get_argo_data_source
from app.utils.geo import haversine_distance


class ObservationQueryService:
    """Service layer executing scientific queries over Argo ocean observations."""

    def __init__(self, data_source: Optional[ArgoDataSource] = None):
        self.data_source = data_source or get_argo_data_source()

    async def execute_query(self, query: ObservationQuery) -> QueryResponse:
        """Executes composable observation queries over geography, variable, depth, and time."""
        logger.info(f"Executing ObservationQuery: {query.model_dump(exclude_none=True)}")

        # 1. Bounding box computation for geographic filter optimization
        min_lat, max_lat, min_lon, max_lon = None, None, None, None
        if query.latitude is not None and query.longitude is not None and query.radius_km is not None:
            delta_lat = query.radius_km / 111.0
            cos_lat = max(0.001, math.cos(math.radians(query.latitude)))
            delta_lon = query.radius_km / (111.0 * cos_lat)

            min_lat = max(-90.0, query.latitude - delta_lat)
            max_lat = min(90.0, query.latitude + delta_lat)
            min_lon = max(-180.0, query.longitude - delta_lon)
            max_lon = min(180.0, query.longitude + delta_lon)

        start_str = query.start_time.isoformat() if query.start_time else None
        end_str = query.end_time.isoformat() if query.end_time else None

        # 2. Fetch candidate profiles from data source
        if query.float_id:
            profiles = await self.data_source.get_float_profiles(query.float_id, limit=query.limit * 2)
        else:
            profiles = await self.data_source.search_profiles(
                min_lat=min_lat,
                max_lat=max_lat,
                min_lon=min_lon,
                max_lon=max_lon,
                start_date=start_str,
                end_date=end_str,
                limit=query.limit * 5,
            )

        target_vars = query.variable if query.variable else list(SUPPORTED_VARIABLES.keys())
        results: List[QueryResultItem] = []

        # 3. Apply composable filtering
        for profile in profiles:
            # Spatial distance check
            dist_km: Optional[float] = None
            if query.latitude is not None and query.longitude is not None:
                try:
                    dist_km = haversine_distance(query.latitude, query.longitude, profile.latitude, profile.longitude)
                except ValueError:
                    continue

                if query.radius_km is not None and dist_km > query.radius_km:
                    continue

            # Temporal check
            if query.start_time and profile.timestamp < query.start_time:
                continue
            if query.end_time and profile.timestamp > query.end_time:
                continue

            # Select observations for profile
            obs_candidates = profile.observations

            # Handle single target depth nearest matching
            if query.depth_m is not None:
                valid_depth_obs = [o for o in obs_candidates if o.depth is not None or o.pressure is not None]
                if not valid_depth_obs:
                    continue
                # Pick observation closest to target depth_m
                obs_candidates = [
                    min(
                        valid_depth_obs,
                        key=lambda o: abs((o.depth if o.depth is not None else o.pressure) - query.depth_m),
                    )
                ]

            for obs in obs_candidates:
                obs_depth = obs.depth if obs.depth is not None else obs.pressure

                # Depth range filtering
                if query.depth_min_m is not None and (obs_depth is None or obs_depth < query.depth_min_m):
                    continue
                if query.depth_max_m is not None and (obs_depth is None or obs_depth > query.depth_max_m):
                    continue

                # Depth difference calculation
                req_depth, act_depth, depth_diff = None, None, None
                if query.depth_m is not None:
                    req_depth = query.depth_m
                    act_depth = obs_depth
                    depth_diff = round(abs(obs_depth - query.depth_m), 2) if obs_depth is not None else None

                # Extract requested variables
                for var_name in target_vars:
                    val: Optional[float] = None
                    if var_name == "TEMP":
                        val = obs.temperature
                    elif var_name == "PSAL":
                        val = obs.salinity
                    elif var_name == "PRES":
                        val = obs.pressure

                    if val is None:
                        continue  # Never fabricate missing scientific observations

                    results.append(
                        QueryResultItem(
                            float_id=obs.float_id,
                            variable=var_name,
                            value=val,
                            unit=SUPPORTED_VARIABLES[var_name],
                            latitude=obs.latitude,
                            longitude=obs.longitude,
                            timestamp=obs.timestamp,
                            depth_m=obs.depth,
                            pressure_dbar=obs.pressure,
                            distance_km=dist_km,
                            requested_depth_m=req_depth,
                            actual_depth_m=act_depth,
                            depth_difference_m=depth_diff,
                            qc_flags=obs.qc_flags or {},
                            data_source=obs.data_source,
                            is_mock=obs.is_mock,
                        )
                    )

        # 4. Sort results
        if query.latitude is not None and query.longitude is not None:
            results.sort(key=lambda r: (r.distance_km if r.distance_km is not None else 999999.0))
        elif query.depth_m is not None:
            results.sort(key=lambda r: (r.depth_difference_m if r.depth_difference_m is not None else 999999.0))
        else:
            results.sort(key=lambda r: r.timestamp, reverse=True)

        truncated_results = results[: query.limit]

        metadata = {
            "data_provider": getattr(self.data_source, "data_source_id", "unknown"),
            "total_candidates_evaluated": len(profiles),
            "results_returned": len(truncated_results),
        }

        if not truncated_results:
            metadata["note"] = "No matching ocean observations found for the specified query constraints."

        return QueryResponse(
            query=query.model_dump(exclude_none=True),
            results=truncated_results,
            count=len(truncated_results),
            metadata=metadata,
        )

    async def get_nearby_floats(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 100.0,
        limit: int = 10,
    ) -> List[NearbyFloatResult]:
        """Discovers floats located near a geographic coordinate point."""
        query = ObservationQuery(latitude=latitude, longitude=longitude, radius_km=radius_km, limit=limit * 5)
        response = await self.execute_query(query)

        seen_floats = set()
        nearby_floats: List[NearbyFloatResult] = []

        for item in response.results:
            if item.float_id in seen_floats:
                continue
            seen_floats.add(item.float_id)

            nearby_floats.append(
                NearbyFloatResult(
                    float_id=item.float_id,
                    latitude=item.latitude,
                    longitude=item.longitude,
                    distance_km=item.distance_km or 0.0,
                    last_timestamp=item.timestamp,
                    total_profiles=1,
                    is_mock=item.is_mock,
                    data_source=item.data_source,
                )
            )

            if len(nearby_floats) >= limit:
                break

        return nearby_floats
