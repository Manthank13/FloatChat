from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Tuple

if TYPE_CHECKING:
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


def approximate_potential_density(temp_c: float, psal_psu: float) -> float:
    """
    Compute approximate seawater density anomaly sigma_t (kg/m^3) at atmospheric pressure
    using empirical polynomial equation of state.
    """
    # Polynomial approximation of sigma_t = rho(S,T,0) - 1000
    t = temp_c
    s = psal_psu
    sigma_t = (
        28.14
        - 0.0735 * t
        - 0.00469 * (t ** 2)
        + (0.802 - 0.002 * t) * (s - 35.0)
    )
    return round(sigma_t, 4)


def calculate_mixed_layer_depth(
    observations: List[ArgoObservation],
    ref_depth_m: float = 10.0,
    temp_threshold_c: float = 0.2,
    density_threshold: float = 0.03,
) -> Dict[str, Any]:
    """
    Calculate Mixed Layer Depth (MLD) using:
    1. Temperature criterion: depth where T = T(10m) - 0.2°C (de Boyer Montégut et al., 2004)
    2. Density criterion: depth where sigma_t = sigma_t(10m) + 0.03 kg/m^3
    """
    valid_obs = [
        obs for obs in sorted(observations, key=lambda x: x.depth_m)
        if obs.temp_c is not None and obs.is_valid_measurement("TEMP")
    ]
    if len(valid_obs) < 2:
        return {"mld_temperature_m": None, "mld_density_m": None, "method": "de_boyer_montegut_2004"}

    # Find reference level closest to ref_depth_m
    ref_obs = min(valid_obs, key=lambda x: abs(x.depth_m - ref_depth_m))
    t_ref = ref_obs.temp_c
    ref_d = ref_obs.depth_m

    mld_temp = None
    for obs in valid_obs:
        if obs.depth_m > ref_d and obs.temp_c is not None:
            if obs.temp_c <= (t_ref - temp_threshold_c):
                mld_temp = round(obs.depth_m, 1)
                break

    # Density-based MLD if salinity is available
    mld_dens = None
    if ref_obs.psal_psu is not None:
        dens_ref = approximate_potential_density(ref_obs.temp_c, ref_obs.psal_psu)
        for obs in valid_obs:
            if obs.depth_m > ref_d and obs.temp_c is not None and obs.psal_psu is not None:
                dens_obs = approximate_potential_density(obs.temp_c, obs.psal_psu)
                if dens_obs >= (dens_ref + density_threshold):
                    mld_dens = round(obs.depth_m, 1)
                    break

    return {
        "mld_temperature_m": mld_temp,
        "mld_density_m": mld_dens,
        "reference_depth_m": ref_d,
        "reference_temperature_c": t_ref,
        "method": "de_boyer_montegut_2004",
    }


def calculate_thermocline_gradient(observations: List[ArgoObservation]) -> Dict[str, Any]:
    """
    Compute vertical temperature gradient dT/dz (°C/m) across depth levels
    and identify maximum thermocline gradient depth.
    """
    valid_obs = [
        obs for obs in sorted(observations, key=lambda x: x.depth_m)
        if obs.temp_c is not None and obs.is_valid_measurement("TEMP")
    ]
    if len(valid_obs) < 2:
        return {"max_gradient_c_per_m": None, "thermocline_depth_m": None}

    max_grad = 0.0
    therm_depth = None

    for i in range(len(valid_obs) - 1):
        z1, t1 = valid_obs[i].depth_m, valid_obs[i].temp_c
        z2, t2 = valid_obs[i + 1].depth_m, valid_obs[i + 1].temp_c
        dz = abs(z2 - z1)
        if dz > 0.5:
            grad = abs(t2 - t1) / dz
            if grad > max_grad:
                max_grad = grad
                therm_depth = round((z1 + z2) / 2.0, 1)

    return {
        "max_gradient_c_per_m": round(max_grad, 4) if therm_depth else None,
        "thermocline_depth_m": therm_depth,
    }


def calculate_barrier_layer_thickness(observations: List[ArgoObservation]) -> Dict[str, Any]:
    """
    Calculate Salinity Barrier Layer Thickness (BLT):
    BLT = max(0.0, Isothermal Layer Depth - Density Mixed Layer Depth)
    Crucial metric for Bay of Bengal ocean stratification and cyclone heat energy.
    """
    mld_info = calculate_mixed_layer_depth(observations)
    ild = mld_info.get("mld_temperature_m")
    mld = mld_info.get("mld_density_m")

    if ild is not None and mld is not None and ild >= mld:
        blt = round(ild - mld, 1)
    else:
        blt = 0.0 if (ild is not None and mld is not None) else None

    return {
        "barrier_layer_thickness_m": blt,
        "isothermal_layer_depth_m": ild,
        "mixed_layer_depth_m": mld,
        "has_barrier_layer": bool(blt and blt > 5.0),
    }


def detect_marine_heatwave_anomalies(
    observations: List[ArgoObservation],
    baseline_temp_c: float = 28.5,
    anomaly_threshold_c: float = 1.5,
) -> List[Dict[str, Any]]:
    """
    Identify upper-ocean (<50m) temperature observations indicating marine heatwave anomalies.
    """
    anomalies = []
    for obs in observations:
        if obs.depth_m <= 50.0 and obs.temp_c is not None and obs.is_valid_measurement("TEMP"):
            anomaly = obs.temp_c - baseline_temp_c
            if anomaly >= anomaly_threshold_c:
                anomalies.append({
                    "platform_id": obs.platform_id,
                    "depth_m": obs.depth_m,
                    "temperature_c": obs.temp_c,
                    "baseline_temp_c": baseline_temp_c,
                    "anomaly_c": round(anomaly, 2),
                    "timestamp": obs.timestamp,
                })
    return anomalies


def compute_oceanographic_indicators(observations: List[ArgoObservation]) -> Dict[str, Any]:
    """
    Compute all physical oceanographic indicators for a set of observations.
    """
    mld = calculate_mixed_layer_depth(observations)
    therm = calculate_thermocline_gradient(observations)
    blt = calculate_barrier_layer_thickness(observations)
    mhw = detect_marine_heatwave_anomalies(observations)

    return {
        "mixed_layer_depth": mld,
        "thermocline": therm,
        "barrier_layer": blt,
        "marine_heatwave_anomalies": mhw,
    }


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
            indicators={},
        )

    stats = compute_statistics(observations, parameters)
    indicators = compute_oceanographic_indicators(observations)
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
        indicators=indicators,
    )

