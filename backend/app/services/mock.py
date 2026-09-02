import math
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.models.argo import FloatMetadata, Observation, Profile
from app.services.base import ArgoDataSource
from app.services.normalizer import ArgoNormalizer


class MockArgoDataSource(ArgoDataSource):
    """Mock Argo data provider generating synthetic observations for development and offline testing."""

    def __init__(self):
        self.data_source_id = "mock"

    def _generate_mock_profile(
        self,
        float_id: str,
        cycle_number: int,
        timestamp: datetime,
        latitude: float,
        longitude: float,
    ) -> Profile:
        """Generates a synthetic oceanic profile with realistic temperature/salinity depth gradients."""
        observations: List[Observation] = []

        # Standard pressure levels (0 to 1000 decibars)
        pressures = [0.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0, 800.0, 1000.0]
        surface_temp = 24.5 - (abs(latitude) / 90.0) * 15.0
        deep_temp = 3.5

        for pres in pressures:
            # Exponential decay model for ocean thermocline
            decay = math.exp(-pres / 200.0)
            temp = deep_temp + (surface_temp - deep_temp) * decay
            psal = 35.0 + 0.5 * (1.0 - decay) - 0.2 * math.sin(pres / 100.0)

            depth = ArgoNormalizer.derive_depth(pres)

            obs = Observation(
                float_id=float_id,
                timestamp=timestamp,
                latitude=latitude,
                longitude=longitude,
                pressure=pres,
                depth=depth,
                temperature=round(temp, 3),
                salinity=round(psal, 3),
                qc_flags={"pres_qc": "1", "temp_qc": "1", "psal_qc": "1"},
                is_mock=True,
                data_source=self.data_source_id,
            )
            observations.append(obs)

        return Profile(
            float_id=float_id,
            cycle_number=cycle_number,
            timestamp=timestamp,
            latitude=latitude,
            longitude=longitude,
            observations=observations,
            observation_count=len(observations),
            is_mock=True,
            data_source=self.data_source_id,
        )

    async def get_float(self, float_id: str) -> Optional[FloatMetadata]:
        """Retrieves mock metadata for a float."""
        clean_id = str(float_id).strip()
        now = datetime.now(timezone.utc)

        return FloatMetadata(
            float_id=clean_id,
            last_latitude=25.0,
            last_longitude=-75.0,
            last_timestamp=now,
            cycle_number=42,
            total_profiles=42,
            metadata={"institution": "Mock Oceanographic Inst.", "platform_type": "MOCK_SLOCUM"},
            is_mock=True,
            data_source=self.data_source_id,
        )

    async def get_float_profiles(self, float_id: str, limit: int = 10) -> List[Profile]:
        """Retrieves synthetic profile series for a mock float."""
        clean_id = str(float_id).strip()
        now = datetime.now(timezone.utc)
        profiles: List[Profile] = []

        for i in range(min(limit, 20)):
            cycle = 50 - i
            ts = now - timedelta(days=i * 10)
            lat = 25.0 + (i * 0.1)
            lon = -75.0 - (i * 0.1)

            profiles.append(self._generate_mock_profile(clean_id, cycle, ts, lat, lon))

        return profiles

    async def search_profiles(
        self,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> List[Profile]:
        """Returns mock profiles matching spatial/temporal filters."""
        now = datetime.now(timezone.utc)
        profiles: List[Profile] = []

        mock_floats = ["MOCK6902746", "MOCK6902747", "MOCK6902748"]
        for idx, fid in enumerate(mock_floats):
            lat = (min_lat + max_lat) / 2.0 if (min_lat is not None and max_lat is not None) else (20.0 + idx * 5.0)
            lon = (min_lon + max_lon) / 2.0 if (min_lon is not None and max_lon is not None) else (-70.0 - idx * 5.0)

            profile = self._generate_mock_profile(fid, 10 + idx, now, lat, lon)
            profiles.append(profile)

        return profiles[:limit]
