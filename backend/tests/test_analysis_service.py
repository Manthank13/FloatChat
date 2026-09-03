from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock
import pytest
from app.models.analysis import (
    DepthProfileRequest,
    FloatComparisonRequest,
    StatisticsRequest,
    TrendAnalysisRequest,
)
from app.models.query import ObservationQuery, QueryResponse, QueryResultItem
from app.services.analysis import ScientificAnalysisService
from app.services.mock import MockArgoDataSource


@pytest.mark.asyncio
async def test_statistics_known_fixed_values() -> None:
    # Setup mock query service returning known fixed values: [10.0, 20.0, 30.0]
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    mock_query_res = QueryResponse(
        query={},
        count=3,
        results=[
            QueryResultItem(
                float_id="6902746",
                variable="TEMP",
                value=10.0,
                unit="°C",
                latitude=25.0,
                longitude=-75.0,
                timestamp=datetime.now(timezone.utc),
                data_source="erddap_ifremer",
                is_mock=False,
            ),
            QueryResultItem(
                float_id="6902746",
                variable="TEMP",
                value=20.0,
                unit="°C",
                latitude=25.0,
                longitude=-75.0,
                timestamp=datetime.now(timezone.utc),
                data_source="erddap_ifremer",
                is_mock=False,
            ),
            QueryResultItem(
                float_id="6902746",
                variable="TEMP",
                value=30.0,
                unit="°C",
                latitude=25.0,
                longitude=-75.0,
                timestamp=datetime.now(timezone.utc),
                data_source="erddap_ifremer",
                is_mock=False,
            ),
        ],
    )

    service.query_service.execute_query = AsyncMock(return_value=mock_query_res)

    req = StatisticsRequest(query=ObservationQuery(), target_variable="TEMP")
    stats = await service.calculate_statistics(req)

    assert stats.status == "success"
    assert stats.variable == "TEMP"
    assert stats.unit == "°C"
    assert stats.requested_count == 3
    assert stats.valid_count == 3
    assert stats.mean == 20.0
    assert stats.median == 20.0
    assert stats.minimum == 10.0
    assert stats.maximum == 30.0
    assert stats.float_ids == ["6902746"]


@pytest.mark.asyncio
async def test_statistics_empty_no_data() -> None:
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    mock_empty_res = QueryResponse(query={}, count=0, results=[])
    service.query_service.execute_query = AsyncMock(return_value=mock_empty_res)

    req = StatisticsRequest(query=ObservationQuery(), target_variable="PSAL")
    stats = await service.calculate_statistics(req)

    assert stats.status == "no_data"
    assert stats.valid_count == 0
    assert stats.mean is None
    assert stats.median is None
    assert stats.minimum is None
    assert stats.maximum is None


@pytest.mark.asyncio
async def test_statistics_single_observation() -> None:
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    mock_single_res = QueryResponse(
        query={},
        count=1,
        results=[
            QueryResultItem(
                float_id="6902746",
                variable="PSAL",
                value=35.45,
                unit="PSU",
                latitude=25.0,
                longitude=-75.0,
                timestamp=datetime.now(timezone.utc),
                data_source="erddap_ifremer",
                is_mock=False,
            )
        ],
    )
    service.query_service.execute_query = AsyncMock(return_value=mock_single_res)

    req = StatisticsRequest(query=ObservationQuery(), target_variable="PSAL")
    stats = await service.calculate_statistics(req)

    assert stats.status == "success"
    assert stats.valid_count == 1
    assert stats.mean == 35.45
    assert stats.median == 35.45
    assert stats.minimum == 35.45
    assert stats.maximum == 35.45


@pytest.mark.asyncio
async def test_depth_profile_generation() -> None:
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    profile_res = await service.generate_depth_profile(DepthProfileRequest(query=ObservationQuery(float_id="MOCK6902746", limit=10)))

    assert profile_res.status == "success"
    assert profile_res.float_id == "MOCK6902746"
    assert profile_res.point_count > 0
    assert profile_res.profile_points[0].depth_m is not None


@pytest.mark.asyncio
async def test_float_comparison() -> None:
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    comp_req = FloatComparisonRequest(
        float_id_a="MOCK6902746",
        float_id_b="MOCK6902747",
        target_variable="TEMP",
        depth_tolerance_m=10.0,
    )
    res = await service.compare_floats(comp_req)

    assert res.status == "success"
    assert res.float_id_a == "MOCK6902746"
    assert res.float_id_b == "MOCK6902747"
    assert res.variable == "TEMP"
    assert res.matched_levels_count > 0
    assert res.mean_difference is not None


@pytest.mark.asyncio
async def test_trend_analysis() -> None:
    service = ScientificAnalysisService(data_source=MockArgoDataSource())

    now = datetime.now(timezone.utc)
    mock_trend_res = QueryResponse(
        query={},
        count=2,
        results=[
            QueryResultItem(
                float_id="6902746",
                variable="TEMP",
                value=20.0,
                unit="°C",
                latitude=25.0,
                longitude=-75.0,
                timestamp=now - timedelta(days=10),
                data_source="erddap_ifremer",
                is_mock=False,
            ),
            QueryResultItem(
                float_id="6902746",
                variable="TEMP",
                value=25.0,
                unit="°C",
                latitude=25.0,
                longitude=-75.0,
                timestamp=now,
                data_source="erddap_ifremer",
                is_mock=False,
            ),
        ],
    )
    service.query_service.execute_query = AsyncMock(return_value=mock_trend_res)

    trend_req = TrendAnalysisRequest(query=ObservationQuery(float_id="6902746"), target_variable="TEMP")
    res = await service.analyze_trend(trend_req)

    assert res.status == "success"
    assert res.start_value == 20.0
    assert res.end_value == 25.0
    assert res.absolute_change == 5.0
    assert res.percentage_change == 25.0  # (5 / 20) * 100
