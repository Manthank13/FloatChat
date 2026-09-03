import pytest
from app.utils.geo import haversine_distance


def test_haversine_same_point() -> None:
    assert haversine_distance(13.0827, 80.2707, 13.0827, 80.2707) == 0.0


def test_haversine_known_distances() -> None:
    # Chennai to Bengaluru (approx 290 km)
    dist_chennai_bengaluru = haversine_distance(13.0827, 80.2707, 12.9716, 77.5946)
    assert 280.0 <= dist_chennai_bengaluru <= 300.0

    # London to Paris (approx 343 km)
    dist_london_paris = haversine_distance(51.5074, -0.1278, 48.8566, 2.3522)
    assert 335.0 <= dist_london_paris <= 350.0


def test_haversine_invalid_coordinates() -> None:
    with pytest.raises(ValueError):
        haversine_distance(95.0, 0.0, 10.0, 10.0)

    with pytest.raises(ValueError):
        haversine_distance(10.0, 10.0, 10.0, -190.0)
