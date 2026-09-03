from __future__ import annotations

import abc
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple

if TYPE_CHECKING:
    from ai.models import StructuredQuery

from data.interface import BaseArgoDataSource
from data.models import ArgoObservation, ArgoProfile


class BaseArgoProvider(BaseArgoDataSource):
    """
    Abstract interface for all ARGO dataset providers (Sample, NetCDF, Parquet, Remote REST).
    """

    def __init__(self, name: str = "BASE_PROVIDER"):
        self.name = name

    @abc.abstractmethod
    def load_observations(self) -> List[ArgoObservation]:
        """Load all observation records from source."""
        pass

    def load_profiles(self) -> List[ArgoProfile]:
        """Group observations by platform and cycle into vertical profiles."""
        observations = self.load_observations()
        grouped: Dict[Tuple[str, int], List[ArgoObservation]] = {}
        for obs in observations:
            key = (obs.platform_id, obs.cycle_number or 0)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(obs)

        profiles: List[ArgoProfile] = []
        for (plat_id, cycle), levels in grouped.items():
            sorted_levels = sorted(levels, key=lambda x: x.depth_m)
            first = sorted_levels[0]
            profiles.append(
                ArgoProfile(
                    platform_id=plat_id,
                    cycle_number=cycle,
                    latitude=first.latitude,
                    longitude=first.longitude,
                    timestamp=first.timestamp,
                    observations=sorted_levels,
                    data_source=first.data_source,
                )
            )
        return profiles

    def get_available_platforms(self) -> List[str]:
        """Return list of distinct platform WMO IDs."""
        return sorted(list({obs.platform_id for obs in self.load_observations()}))

    def get_spatial_bounds(self) -> Tuple[float, float, float, float]:
        """Return (min_lat, min_lon, max_lat, max_lon)."""
        obs = self.load_observations()
        if not obs:
            return (-90.0, -180.0, 90.0, 180.0)
        lats = [o.latitude for o in obs]
        lons = [o.longitude for o in obs]
        return (min(lats), min(lons), max(lats), max(lons))

    def get_temporal_bounds(self) -> Tuple[str, str]:
        """Return (earliest_date, latest_date)."""
        obs = self.load_observations()
        if not obs:
            return ("1990-01-01T00:00:00Z", "2030-12-31T23:59:59Z")
        timestamps = sorted([o.timestamp for o in obs])
        return (timestamps[0], timestamps[-1])

    def query_observations(
        self,
        query: Optional[StructuredQuery] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
    ) -> List[ArgoObservation]:
        """
        Optional hook for providers supporting server-side or push-down bounding box filtering.
        Defaults to loading all observations and letting the central filter engine process them.
        """
        return self.load_observations()
