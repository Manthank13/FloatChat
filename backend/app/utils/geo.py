import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two geographic points in kilometers using the Haversine formula.

    :param lat1: Latitude of point 1 in degrees (-90 to 90)
    :param lon1: Longitude of point 1 in degrees (-180 to 180)
    :param lat2: Latitude of point 2 in degrees (-90 to 90)
    :param lon2: Longitude of point 2 in degrees (-180 to 180)
    :return: Distance in kilometers rounded to 2 decimal places.
    """
    if not (-90.0 <= lat1 <= 90.0) or not (-90.0 <= lat2 <= 90.0):
        raise ValueError(f"Latitude must be between -90 and 90 degrees. Received: {lat1}, {lat2}")
    if not (-180.0 <= lon1 <= 180.0) or not (-180.0 <= lon2 <= 180.0):
        raise ValueError(f"Longitude must be between -180 and 180 degrees. Received: {lon1}, {lon2}")

    EARTH_RADIUS_KM = 6371.0088

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = EARTH_RADIUS_KM * c
    return round(distance, 2)
