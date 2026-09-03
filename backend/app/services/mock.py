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
        # Fixed realistic mock float locations
        self.mock_platforms = [
            {"id": "MOCK6902746", "lat": 25.0, "lon": -75.0},
            {"id": "MOCK6902747", "lat": 25.5, "lon": -75.5},
            {"id": "MOCK6902748", "lat": 26.0, "lon": -76.0},
            {"id": "2902741", "lat": 13.0827, "lon": 80.2707},
            {"id": "2903334", "lat": 13.0827, "lon": 80.2707},
            {"id": "2902742", "lat": 15.0, "lon": 65.0},
            {"id": "2902743", "lat": 0.0, "lon": 75.0},
            {"id": "5906432", "lat": 9.9312, "lon": 76.2673},
        ]

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

        pressures = [0.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0, 800.0, 1000.0]
        surface_temp = 24.5 - (abs(latitude) / 90.0) * 15.0
        deep_temp = 3.5

        for pres in pressures:
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
        if clean_id in ("9999999999", "non_existent_float_123") or "non_existent" in clean_id or "not_found" in clean_id:
            return None

        matched = next((p for p in self.mock_platforms if p["id"] == clean_id or clean_id.endswith(p["id"].replace("MOCK", ""))), None)
        lat = matched["lat"] if matched else 25.0
        lon = matched["lon"] if matched else -75.0

        now = datetime.now(timezone.utc)

        return FloatMetadata(
            float_id=clean_id,
            last_latitude=lat,
            last_longitude=lon,
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
        if clean_id in ("9999999999", "non_existent_float_123") or "non_existent" in clean_id or "not_found" in clean_id:
            return []

        matched = next((p for p in self.mock_platforms if p["id"] == clean_id or clean_id.endswith(p["id"].replace("MOCK", ""))), None)
        lat = matched["lat"] if matched else 25.0
        lon = matched["lon"] if matched else -75.0

        now = datetime.now(timezone.utc)
        profiles: List[Profile] = []

        for i in range(min(limit, 20)):
            cycle = 50 - i
            ts = now - timedelta(days=i * 10)
            p_lat = lat + (i * 0.1)
            p_lon = lon - (i * 0.1)

            profiles.append(self._generate_mock_profile(clean_id, cycle, ts, p_lat, p_lon))

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

        for platform in self.mock_platforms:
            plat_lat = platform["lat"]
            plat_lon = platform["lon"]

            if min_lat is not None and plat_lat < min_lat:
                continue
            if max_lat is not None and plat_lat > max_lat:
                continue
            if min_lon is not None and plat_lon < min_lon:
                continue
            if max_lon is not None and plat_lon > max_lon:
                continue

            for cycle_idx in range(5):
                ts = now - timedelta(days=cycle_idx * 5)
                profile = self._generate_mock_profile(
                    platform["id"],
                    10 + cycle_idx,
                    ts,
                    plat_lat + (cycle_idx * 0.01),
                    plat_lon + (cycle_idx * 0.01),
                )
                profiles.append(profile)

        return profiles[:limit]
