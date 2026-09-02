from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from app.models.argo import FloatMetadata, Observation, Profile


def test_observation_model_valid() -> None:
    obs = Observation(
        float_id="6902746",
        timestamp=datetime.now(timezone.utc),
        latitude=25.143,
        longitude=-80.071,
        pressure=100.0,
        depth=99.3,
        temperature=18.5,
        salinity=36.2,
        is_mock=False,
        data_source="argo_gdac",
    )
    assert obs.float_id == "6902746"
    assert obs.latitude == 25.143
    assert obs.longitude == -80.071
    assert obs.is_mock is False


def test_observation_model_invalid_coordinates() -> None:
    with pytest.raises(ValidationError):
        Observation(
            float_id="6902746",
            timestamp=datetime.now(timezone.utc),
            latitude=95.0,  # Invalid latitude > 90
            longitude=-80.0,
        )

    with pytest.raises(ValidationError):
        Observation(
            float_id="6902746",
            timestamp=datetime.now(timezone.utc),
            latitude=25.0,
            longitude=-185.0,  # Invalid longitude < -180
        )


def test_profile_model_valid() -> None:
    profile = Profile(
        float_id="6902746",
        cycle_number=135,
        timestamp=datetime.now(timezone.utc),
        latitude=24.974,
        longitude=-84.123,
        observations=[],
        is_mock=False,
    )
    assert profile.cycle_number == 135
    assert profile.observation_count == 0


def test_scientific_rule_mock_distinction() -> None:
    raw_obs = Observation(
        float_id="6902746",
        timestamp=datetime.now(timezone.utc),
        latitude=25.0,
        longitude=-80.0,
        is_mock=False,
        data_source="erddap_ifremer",
    )
    mock_obs = Observation(
        float_id="MOCK12345",
        timestamp=datetime.now(timezone.utc),
        latitude=25.0,
        longitude=-80.0,
        is_mock=True,
        data_source="mock",
    )

    assert raw_obs.is_mock is False
    assert raw_obs.data_source == "erddap_ifremer"
    assert mock_obs.is_mock is True
    assert mock_obs.data_source == "mock"
