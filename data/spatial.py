"""
Geospatial calculation utilities for FloatChat oceanographic retrieval.

Implements standard geodesic distance calculations using the Haversine formula
and bounding-box spatial tests.
"""

import math
from typing import Optional, Tuple

# Mean Earth Radius in Kilometers (IUGG Recommended Earth Radius)
EARTH_RADIUS_KM = 6371.0088


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two geographic coordinates on Earth
    in kilometers using the Haversine formula.

    Args:
        lat1: Latitude of point 1 in decimal degrees.
        lon1: Longitude of point 1 in decimal degrees.
        lat2: Latitude of point 2 in decimal degrees.
        lon2: Longitude of point 2 in decimal degrees.

    Returns:
        Great-circle distance in kilometers.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clamp to [-1.0, 1.0] to prevent floating point domain errors in sqrt/asin
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(EARTH_RADIUS_KM * c, 4)


def is_point_within_radius(
    center_lat: float, center_lon: float, point_lat: float, point_lon: float, radius_km: Optional[float] = 50.0
) -> Tuple[bool, float]:
    """
    Check if a point lies within a circular radius from a center coordinate.

    Returns:
        (is_within, calculated_distance_km)
    """
    r = radius_km if radius_km is not None else 50.0
    distance = haversine_distance(center_lat, center_lon, point_lat, point_lon)
    return distance <= r, distance


def is_point_in_bounding_box(
    lat: float, lon: float, min_lat: float, min_lon: float, max_lat: float, max_lon: float
) -> bool:
    """
    Check if a point lies within a latitude/longitude bounding box.
    """
    lat_ok = min_lat <= lat <= max_lat
    if min_lon <= max_lon:
        lon_ok = min_lon <= lon <= max_lon
    else:
        # Crosses the 180° meridian
        lon_ok = lon >= min_lon or lon <= max_lon

    return lat_ok and lon_ok
