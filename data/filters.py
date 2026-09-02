"""
Filter functions and statistical calculation utilities for ARGO oceanographic observations.
"""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from ai.models import DepthFilter, LocationFilter, TimeRangeFilter
from data.models import ArgoObservation, DataSummary
from data.spatial import haversine_distance, is_point_in_bounding_box, is_point_within_radius


def _copy_obs(obs: ArgoObservation) -> ArgoObservation:
    """Safely deep copy an ArgoObservation model."""
    if hasattr(obs, "model_copy"):
        return obs.model_copy(deep=True)
    return obs.copy(deep=True)


def filter_by_platform(observations: List[ArgoObservation], platform_id: Optional[str]) -> List[ArgoObservation]:
    """Filter observations by ARGO float WMO ID."""
    if not platform_id:
        return observations
    clean_id = platform_id.strip()
    return [obs for obs in observations if obs.platform_id == clean_id]


def filter_by_spatial(
    observations: List[ArgoObservation],
    location: Optional[LocationFilter],
    default_radius_km: Optional[float] = 50.0,
) -> List[ArgoObservation]:
    """
    Filter observations by radial distance from a point or within a geographic bounding box.
    Annotates matching observations with geodesic distance in kilometers.
    """
    if not location:
        return observations

    # 1. Bounding Box takes precedence if bounding_box is present and no explicit radius_km was requested
    if location.bounding_box is not None and location.radius_km is None:
        bbox = location.bounding_box
        min_lat = bbox.min_latitude if hasattr(bbox, "min_latitude") else bbox[0]
        min_lon = bbox.min_longitude if hasattr(bbox, "min_longitude") else bbox[1]
        max_lat = bbox.max_latitude if hasattr(bbox, "max_latitude") else bbox[2]
        max_lon = bbox.max_longitude if hasattr(bbox, "max_longitude") else bbox[3]

        matched_bbox = []
        for obs in observations:
            if is_point_in_bounding_box(
                lat=obs.latitude,
                lon=obs.longitude,
                min_lat=min_lat,
                min_lon=min_lon,
                max_lat=max_lat,
                max_lon=max_lon,
            ):
                matched_bbox.append(_copy_obs(obs))
        return matched_bbox

    # 2. Point Coordinate + Radius Filtering
    if location.latitude is not None and location.longitude is not None:
        center_lat = location.latitude
        center_lon = location.longitude
        radius = location.radius_km if location.radius_km is not None else (default_radius_km or 50.0)

        matched = []
        for obs in observations:
            within, dist = is_point_within_radius(
                center_lat=center_lat,
                center_lon=center_lon,
                point_lat=obs.latitude,
                point_lon=obs.longitude,
                radius_km=radius,
            )
            if within:
                obs_copy = _copy_obs(obs)
                obs_copy.distance_km = dist
                matched.append(obs_copy)

        return sorted(matched, key=lambda x: x.distance_km if x.distance_km is not None else 0.0)

    return observations


def filter_by_depth(
    observations: List[ArgoObservation],
    depth_filter: Optional[DepthFilter],
    default_tolerance_m: float = 20.0,
) -> List[ArgoObservation]:
    """
    Filter observations by depth criteria (exact target depth with nearest tolerance, or depth range).
    """
    if not depth_filter:
        return observations

    # 1. Single Target Depth (e.g., at 100 meters)
    if depth_filter.target_depth is not None:
        target = depth_filter.target_depth
        
        # Look for observations within configurable tolerance
        in_tolerance = [
            obs for obs in observations
            if abs(obs.depth_m - target) <= default_tolerance_m
        ]
        if in_tolerance:
            # Sort by closest vertical distance to target
            return sorted(in_tolerance, key=lambda x: abs(x.depth_m - target))

        # If none within strict tolerance, return nearest available observation if observations exist
        if observations:
            sorted_by_closeness = sorted(observations, key=lambda x: abs(x.depth_m - target))
            return [sorted_by_closeness[0]]
        return []

    # 2. Depth Range (e.g., between 50m and 200m)
    d_min = depth_filter.depth_min if depth_filter.depth_min is not None else 0.0
    d_max = depth_filter.depth_max if depth_filter.depth_max is not None else 6000.0

    matched = [
        obs for obs in observations
        if d_min <= obs.depth_m <= d_max
    ]
    return sorted(matched, key=lambda x: x.depth_m)


def filter_by_time(
    observations: List[ArgoObservation],
    time_filter: Optional[TimeRangeFilter],
) -> List[ArgoObservation]:
    """
    Filter observations by ISO date bounds, year, month, or relative day window.
    """
    if not time_filter:
        return observations

    matched: List[ArgoObservation] = []

    for obs in observations:
        obs_date_str = obs.timestamp[:10]  # YYYY-MM-DD
        try:
            obs_dt = datetime.fromisoformat(obs.timestamp.replace("Z", "+00:00"))
        except Exception:
            obs_dt = None

        keep = True

        # Explicit date range
        if time_filter.start_date and obs_date_str < time_filter.start_date:
            keep = False
        if time_filter.end_date and obs_date_str > time_filter.end_date:
            keep = False

        # Specific Year
        if time_filter.year and obs_dt and obs_dt.year != time_filter.year:
            keep = False

        # Specific Month
        if time_filter.month and obs_dt and obs_dt.month != time_filter.month:
            keep = False

        # Relative days (e.g. last 30 days relative to newest observation or reference time)
        if time_filter.relative_days and obs_dt:
            ref_dt = datetime(2026, 9, 2, tzinfo=timezone.utc)
            delta_days = (ref_dt - obs_dt).total_seconds() / 86400.0
            if delta_days > time_filter.relative_days or delta_days < -1:
                keep = False

        if keep:
            matched.append(obs)

    return matched


def filter_by_quality(observations: List[ArgoObservation], valid_qc: Optional[Set[int]] = None) -> List[ArgoObservation]:
    """Filter out observations flagged with bad or missing quality control codes."""
    qc_set = valid_qc or {1, 2, 3}  # 1=Good, 2=Probably Good, 3=Potentially Correctable
    return [
        obs for obs in observations
        if (obs.temp_qc in qc_set or obs.temp_c is None)
        and (obs.psal_qc in qc_set or obs.psal_psu is None)
    ]


def compute_statistics(observations: List[ArgoObservation], parameters: List[str]) -> Dict[str, Any]:
    """Compute summary statistics (min, max, mean, std, count) for requested parameters."""
    stats: Dict[str, Any] = {}
    if not parameters:
        parameters = ["TEMP", "PSAL"]

    for param in parameters:
        values = [
            obs.get_parameter_value(param)
            for obs in observations
            if obs.is_valid_measurement(param)
        ]
        clean_vals = [v for v in values if v is not None and not math.isnan(v)]

        if clean_vals:
            mean_val = sum(clean_vals) / len(clean_vals)
            variance = sum((x - mean_val) ** 2 for x in clean_vals) / len(clean_vals) if len(clean_vals) > 1 else 0.0
            stats[param.upper()] = {
                "count": len(clean_vals),
                "min": round(min(clean_vals), 4),
                "max": round(max(clean_vals), 4),
                "mean": round(mean_val, 4),
                "std": round(math.sqrt(variance), 4),
            }
        else:
            stats[param.upper()] = {"count": 0, "min": None, "max": None, "mean": None, "std": None}

    return stats


def generate_data_summary(observations: List[ArgoObservation], parameters: List[str]) -> DataSummary:
    """
    Generate authoritative DataSummary object containing pre-computed metrics
    ready for consumption by the LLM response synthesizer.
    """
    if not observations:
        return DataSummary(
            number_of_observations=0,
            floats_represented=[],
            depth_coverage={"min_depth_m": None, "max_depth_m": None},
            time_coverage={"earliest": None, "latest": None},
            parameter_summaries={},
        )

    stats = compute_statistics(observations, parameters)
    floats = sorted(list({obs.platform_id for obs in observations}))
    depths = [obs.depth_m for obs in observations]
    timestamps = sorted([obs.timestamp for obs in observations])

    temp_stats = stats.get("TEMP", {})
    psal_stats = stats.get("PSAL", {})

    return DataSummary(
        number_of_observations=len(observations),
        floats_represented=floats,
        min_temperature=temp_stats.get("min"),
        max_temperature=temp_stats.get("max"),
        mean_temperature=temp_stats.get("mean"),
        min_salinity=psal_stats.get("min"),
        max_salinity=psal_stats.get("max"),
        mean_salinity=psal_stats.get("mean"),
        depth_coverage={
            "min_depth_m": min(depths) if depths else None,
            "max_depth_m": max(depths) if depths else None,
        },
        time_coverage={
            "earliest": timestamps[0] if timestamps else None,
            "latest": timestamps[-1] if timestamps else None,
        },
        parameter_summaries=stats,
    )
