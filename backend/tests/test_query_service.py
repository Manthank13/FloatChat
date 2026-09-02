from datetime import datetime, timedelta, timezone
import pytest
from app.models.query import ObservationQuery
from app.services.mock import MockArgoDataSource
from app.services.query import ObservationQueryService


@pytest.mark.asyncio
async def test_service_variable_filtering() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    # Query only PSAL
    query_psal = ObservationQuery(variable="PSAL", limit=10)
    res_psal = await service.execute_query(query_psal)

    assert res_psal.count > 0
    assert all(r.variable == "PSAL" for r in res_psal.results)
    assert all(r.unit == "PSU" for r in res_psal.results)

    # Query TEMP and PRES
    query_multi = ObservationQuery(variable=["TEMP", "PRES"], limit=10)
    res_multi = await service.execute_query(query_multi)
    assert res_multi.count > 0
    assert set(r.variable for r in res_multi.results).issubset({"TEMP", "PRES"})


@pytest.mark.asyncio
async def test_service_geographic_filtering() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    query = ObservationQuery(
        latitude=25.0,
        longitude=-75.0,
        radius_km=150.0,
        limit=20,
    )
    res = await service.execute_query(query)

    assert res.count > 0
    assert all(r.distance_km is not None for r in res.results)
    assert all(r.distance_km <= 150.0 for r in res.results)


@pytest.mark.asyncio
async def test_service_depth_target_matching() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    query = ObservationQuery(depth_m=100.0, variable="TEMP", limit=5)
    res = await service.execute_query(query)

    assert res.count > 0
    for r in res.results:
        assert r.requested_depth_m == 100.0
        assert r.actual_depth_m is not None
        assert r.depth_difference_m == round(abs(r.actual_depth_m - 100.0), 2)


@pytest.mark.asyncio
async def test_service_depth_range_filtering() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    query = ObservationQuery(depth_min_m=50.0, depth_max_m=300.0, limit=20)
    res = await service.execute_query(query)

    assert res.count > 0
    assert all(50.0 <= r.depth_m <= 300.0 for r in res.results if r.depth_m is not None)


@pytest.mark.asyncio
async def test_service_time_filtering() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())
    now = datetime.now(timezone.utc)

    query = ObservationQuery(
        start_time=now - timedelta(days=15),
        end_time=now + timedelta(days=1),
        limit=20,
    )
    res = await service.execute_query(query)

    assert res.count > 0
    assert all(now - timedelta(days=15) <= r.timestamp <= now + timedelta(days=1) for r in res.results)


@pytest.mark.asyncio
async def test_service_combined_querying() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    query = ObservationQuery(
        latitude=25.0,
        longitude=-75.0,
        radius_km=300.0,
        variable="TEMP",
        depth_m=50.0,
        limit=10,
    )
    res = await service.execute_query(query)

    assert res.count > 0
    assert all(r.variable == "TEMP" for r in res.results)
    assert all(r.distance_km <= 300.0 for r in res.results)
    assert all(r.requested_depth_m == 50.0 for r in res.results)


@pytest.mark.asyncio
async def test_service_no_data_behavior() -> None:
    service = ObservationQueryService(data_source=MockArgoDataSource())

    # Query far outside any mock data (e.g. South Pole)
    query = ObservationQuery(
        latitude=-89.0,
        longitude=0.0,
        radius_km=10.0,
    )
    res = await service.execute_query(query)

    assert res.count == 0
    assert res.results == []
    assert "note" in res.metadata
