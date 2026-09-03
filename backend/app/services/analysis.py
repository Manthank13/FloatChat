from datetime import datetime, timezone
import statistics
from typing import List, Optional
from app.core.logging import logger
from app.models.analysis import (
    DepthProfilePoint,
    DepthProfileRequest,
    DepthProfileResult,
    FloatComparisonRequest,
    FloatComparisonResult,
    StatisticsRequest,
    StatisticsResult,
    TrendAnalysisRequest,
    TrendAnalysisResult,
)
from app.models.query import SUPPORTED_VARIABLES, ObservationQuery
from app.services.base import ArgoDataSource
from app.services.factory import get_argo_data_source
from app.services.query import ObservationQueryService


class ScientificAnalysisService:
    """Dedicated scientific analysis service providing statistics, vertical depth profiles, float comparisons, and trend analysis."""

    def __init__(self, data_source: Optional[ArgoDataSource] = None):
        self.data_source = data_source or get_argo_data_source()
        self.query_service = ObservationQueryService(data_source=self.data_source)

    async def calculate_statistics(self, request: StatisticsRequest) -> StatisticsResult:
        """Calculates basic scientific statistics (mean, median, min, max, count) for a target variable."""
        target_var = request.target_variable
        unit = SUPPORTED_VARIABLES[target_var]

        # Ensure query filters for target variable
        request.query.variable = [target_var]
        query_response = await self.query_service.execute_query(request.query)

        requested_count = query_response.count
        raw_items = query_response.results

        # Exclude missing and NaN values
        valid_items = [r for r in raw_items if r.value is not None]
        valid_count = len(valid_items)

        data_source_id = getattr(self.data_source, "data_source_id", "unknown")
        is_mock = any(r.is_mock for r in valid_items) if valid_items else getattr(self.data_source, "data_source_id", "") == "mock"

        if valid_count == 0:
            logger.info(f"No valid observations found for statistics on variable '{target_var}'")
            return StatisticsResult(
                status="no_data",
                variable=target_var,
                unit=unit,
                requested_count=requested_count,
                valid_count=0,
                mean=None,
                median=None,
                minimum=None,
                maximum=None,
                float_ids=[],
                data_source=data_source_id,
                is_mock=is_mock,
            )

        values = [r.value for r in valid_items]
        float_ids = sorted(list(set(r.float_id for r in valid_items)))

        # Precise calculations without premature rounding
        calc_mean = statistics.mean(values)
        calc_median = statistics.median(values)
        calc_min = min(values)
        calc_max = max(values)

        return StatisticsResult(
            status="success",
            variable=target_var,
            unit=unit,
            requested_count=requested_count,
            valid_count=valid_count,
            mean=round(calc_mean, 4),
            median=round(calc_median, 4),
            minimum=round(calc_min, 4),
            maximum=round(calc_max, 4),
            float_ids=float_ids,
            data_source=valid_items[0].data_source if valid_items else data_source_id,
            is_mock=valid_items[0].is_mock if valid_items else is_mock,
        )

    async def generate_depth_profile(self, request: DepthProfileRequest) -> DepthProfileResult:
        """Generates a vertical profile of observations across depth levels."""
        query_response = await self.query_service.execute_query(request.query)

        if not query_response.results:
            data_source_id = getattr(self.data_source, "data_source_id", "unknown")
            is_mock = data_source_id == "mock"
            return DepthProfileResult(
                status="no_data",
                float_id=request.query.float_id or "UNKNOWN",
                timestamp=datetime.now(),
                latitude=request.query.latitude or 0.0,
                longitude=request.query.longitude or 0.0,
                profile_points=[],
                point_count=0,
                data_source=data_source_id,
                is_mock=is_mock,
            )

        items = query_response.results
        # Group measurements by depth/pressure
        points_map = {}
        for item in items:
            depth_key = item.depth_m if item.depth_m is not None else item.pressure_dbar
            if depth_key is None:
                continue

            if depth_key not in points_map:
                points_map[depth_key] = {
                    "depth_m": item.depth_m,
                    "pressure_dbar": item.pressure_dbar,
                    "temperature": None,
                    "salinity": None,
                    "timestamp": item.timestamp,
                    "qc_flags": item.qc_flags,
                }

            if item.variable == "TEMP":
                points_map[depth_key]["temperature"] = item.value
            elif item.variable == "PSAL":
                points_map[depth_key]["salinity"] = item.value

        sorted_depths = sorted(points_map.keys())
        profile_points = [DepthProfilePoint(**points_map[d]) for d in sorted_depths]

        first_item = items[0]
        return DepthProfileResult(
            status="success",
            float_id=first_item.float_id,
            timestamp=first_item.timestamp,
            latitude=first_item.latitude,
            longitude=first_item.longitude,
            profile_points=profile_points,
            point_count=len(profile_points),
            data_source=first_item.data_source,
            is_mock=first_item.is_mock,
        )

    async def compare_floats(self, request: FloatComparisonRequest) -> FloatComparisonResult:
        """Compares observations between two float platforms at depth-matched levels."""
        target_var = request.target_variable
        unit = SUPPORTED_VARIABLES[target_var]

        # Retrieve observations for float A and float B
        query_a = ObservationQuery(float_id=request.float_id_a, variable=[target_var], limit=200)
        query_b = ObservationQuery(float_id=request.float_id_b, variable=[target_var], limit=200)

        res_a = await self.query_service.execute_query(query_a)
        res_b = await self.query_service.execute_query(query_b)

        obs_a = [r for r in res_a.results if r.value is not None and (r.depth_m is not None or r.pressure_dbar is not None)]
        obs_b = [r for r in res_b.results if r.value is not None and (r.depth_m is not None or r.pressure_dbar is not None)]

        data_source_a = res_a.results[0].data_source if res_a.results else getattr(self.data_source, "data_source_id", "unknown")
        data_source_b = res_b.results[0].data_source if res_b.results else getattr(self.data_source, "data_source_id", "unknown")
        is_mock = (res_a.results[0].is_mock if res_a.results else False) or (res_b.results[0].is_mock if res_b.results else False)

        if not obs_a or not obs_b:
            return FloatComparisonResult(
                status="no_data",
                float_id_a=request.float_id_a,
                float_id_b=request.float_id_b,
                variable=target_var,
                unit=unit,
                mean_difference=None,
                max_difference=None,
                min_difference=None,
                matched_levels_count=0,
                data_source_a=data_source_a,
                data_source_b=data_source_b,
                is_mock=is_mock,
            )

        # Match depth levels within depth_tolerance_m
        differences = []
        for item_a in obs_a:
            depth_a = item_a.depth_m if item_a.depth_m is not None else item_a.pressure_dbar
            # Find closest matching depth level in Float B
            best_match = min(
                obs_b,
                key=lambda item_b: abs((item_b.depth_m if item_b.depth_m is not None else item_b.pressure_dbar) - depth_a),
            )
            depth_b = best_match.depth_m if best_match.depth_m is not None else best_match.pressure_dbar

            if abs(depth_a - depth_b) <= request.depth_tolerance_m:
                diff = item_a.value - best_match.value
                differences.append(diff)

        if not differences:
            return FloatComparisonResult(
                status="no_matching_depths",
                float_id_a=request.float_id_a,
                float_id_b=request.float_id_b,
                variable=target_var,
                unit=unit,
                mean_difference=None,
                max_difference=None,
                min_difference=None,
                matched_levels_count=0,
                data_source_a=data_source_a,
                data_source_b=data_source_b,
                is_mock=is_mock,
            )

        mean_diff = statistics.mean(differences)
        max_diff = max(abs(d) for d in differences)
        min_diff = min(abs(d) for d in differences)

        return FloatComparisonResult(
            status="success",
            float_id_a=request.float_id_a,
            float_id_b=request.float_id_b,
            variable=target_var,
            unit=unit,
            metric="depth_matched_difference",
            mean_difference=round(mean_diff, 4),
            max_difference=round(max_diff, 4),
            min_difference=round(min_diff, 4),
            matched_levels_count=len(differences),
            data_source_a=data_source_a,
            data_source_b=data_source_b,
            is_mock=is_mock,
        )

    async def analyze_trend(self, request: TrendAnalysisRequest) -> TrendAnalysisResult:
        """Analyzes temporal changes between earliest and latest observations."""
        target_var = request.target_variable
        unit = SUPPORTED_VARIABLES[target_var]

        request.query.variable = [target_var]
        query_response = await self.query_service.execute_query(request.query)

        valid_items = [r for r in query_response.results if r.value is not None]
        data_source_id = getattr(self.data_source, "data_source_id", "unknown")
        is_mock = any(r.is_mock for r in valid_items) if valid_items else data_source_id == "mock"

        if len(valid_items) < 2:
            return TrendAnalysisResult(
                status="insufficient_data",
                variable=target_var,
                unit=unit,
                start_time=valid_items[0].timestamp if valid_items else None,
                end_time=valid_items[0].timestamp if valid_items else None,
                start_value=valid_items[0].value if valid_items else None,
                end_value=valid_items[0].value if valid_items else None,
                absolute_change=None,
                percentage_change=None,
                observation_count=len(valid_items),
                float_ids=sorted(list(set(r.float_id for r in valid_items))),
                data_source=valid_items[0].data_source if valid_items else data_source_id,
                is_mock=is_mock,
            )

        # Sort chronologically
        valid_items.sort(key=lambda r: r.timestamp)

        earliest = valid_items[0]
        latest = valid_items[-1]

        start_val = earliest.value
        end_val = latest.value
        abs_change = end_val - start_val

        pct_change = (abs_change / start_val * 100.0) if start_val != 0 else None

        return TrendAnalysisResult(
            status="success",
            variable=target_var,
            unit=unit,
            start_time=earliest.timestamp,
            end_time=latest.timestamp,
            start_value=round(start_val, 4),
            end_value=round(end_val, 4),
            absolute_change=round(abs_change, 4),
            percentage_change=round(pct_change, 2) if pct_change is not None else None,
            observation_count=len(valid_items),
            float_ids=sorted(list(set(r.float_id for r in valid_items))),
            data_source=earliest.data_source,
            is_mock=earliest.is_mock,
        )
