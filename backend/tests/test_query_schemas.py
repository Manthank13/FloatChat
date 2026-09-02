from datetime import datetime, timedelta, timezone
import pytest
from pydantic import ValidationError
from app.models.query import ObservationQuery


def test_valid_observation_query() -> None:
    query = ObservationQuery(
        latitude=13.0827,
        longitude=80.2707,
        radius_km=150.0,
        variable="TEMP",
        depth_m=100.0,
    )
    assert query.latitude == 13.0827
    assert query.radius_km == 150.0
    assert query.variable == ["TEMP"]
    assert query.depth_m == 100.0


def test_query_schema_unsupported_variable() -> None:
    with pytest.raises(ValidationError) as exc:
        ObservationQuery(variable="INVALID_VAR")
    assert "Unsupported oceanographic variable" in str(exc.value)


def test_query_schema_invalid_coordinates() -> None:
    with pytest.raises(ValidationError):
        ObservationQuery(latitude=100.0, longitude=0.0)

    with pytest.raises(ValidationError):
        ObservationQuery(latitude=0.0, longitude=-200.0)


def test_query_schema_incomplete_geo_query() -> None:
    with pytest.raises(ValidationError) as exc:
        ObservationQuery(latitude=13.0827)  # Longitude missing
    assert "Both latitude and longitude must be provided" in str(exc.value)


def test_query_schema_depth_range_order() -> None:
    with pytest.raises(ValidationError) as exc:
        ObservationQuery(depth_min_m=200.0, depth_max_m=100.0)
    assert "depth_min_m" in str(exc.value)


def test_query_schema_time_range_order() -> None:
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError) as exc:
        ObservationQuery(start_time=now, end_time=now - timedelta(days=1))
    assert "start_time cannot be after end_time" in str(exc.value)
