"""
Remote REST API ARGO Data Provider for FloatChat (Argovis / ERDDAP).

Fetches live ARGO profiles and depth observations from public oceanographic REST endpoints.
Safely retrieves API keys from environment variables without exposing credentials in code.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from ai.models import StructuredQuery
from data.config import DataConfig
from data.models import ArgoObservation
from data.normalization import normalize_observation_dict
from data.providers.base import BaseArgoProvider

logger = logging.getLogger(__name__)


class ArgovisRESTProvider(BaseArgoProvider):
    """
    ARGO Data Provider querying public Argovis or ERDDAP REST endpoints.
    """

    def __init__(self, config: Optional[DataConfig] = None):
        super().__init__(name="ARGOVIS_REST_PROVIDER")
        self.config = config or DataConfig()
        self.base_url = self.config.remote_api_url
        self.api_key = self.config.get_api_key()

    def load_observations(self) -> List[ArgoObservation]:
        """Default retrieval for remote provider."""
        return []

    def query_observations(
        self,
        query: Optional[StructuredQuery] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
    ) -> List[ArgoObservation]:
        """
        Query remote Argovis API for profiles within spatial/temporal bounds.
        """
        if query is None:
            return []

        params: Dict[str, Any] = {}

        # 1. Platform Filter
        if query.platform_id:
            params["platform"] = query.platform_id

        # 2. Time Filter
        if query.time_range and query.time_range.start_date:
            params["startDate"] = f"{query.time_range.start_date}T00:00:00Z"
        if query.time_range and query.time_range.end_date:
            params["endDate"] = f"{query.time_range.end_date}T23:59:59Z"

        # 3. Spatial Filter
        if query.location and query.location.latitude is not None and query.location.longitude is not None:
            radius_km = query.radius_km or (query.location.radius_km if query.location.radius_km is not None else 50.0)
            params["center"] = f"{query.location.longitude},{query.location.latitude}"
            params["radius"] = int(radius_km * 1000)  # meters
        elif min_lat is not None and max_lat is not None and min_lon is not None and max_lon is not None:
            params["box"] = f"[[{min_lon},{min_lat}],[{max_lon},{max_lat}]]"

        # 4. Depth Filter
        if query.depth:
            if query.depth.target_depth is not None:
                params["pressureRange"] = f"{max(0, query.depth.target_depth - 30)},{query.depth.target_depth + 30}"
            elif query.depth.depth_min is not None and query.depth.depth_max is not None:
                params["pressureRange"] = f"{query.depth.depth_min},{query.depth.depth_max}"

        query_str = urllib.parse.urlencode(params)
        req_url = f"{self.base_url}?{query_str}" if query_str else self.base_url

        headers = {"User-Agent": "FloatChat-OceanAI/1.0", "Accept": "application/json"}
        if self.api_key:
            headers["x-argokey"] = self.api_key

        req = urllib.request.Request(req_url, headers=headers, method="GET")

        observations: List[ArgoObservation] = []

        try:
            with urllib.request.urlopen(req, timeout=self.config.timeout_seconds) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                # If Argovis profile objects returned
                if isinstance(data, list):
                    for profile_item in data:
                        obs_list = self._extract_observations_from_profile(profile_item)
                        observations.extend(obs_list)
        except urllib.error.HTTPError as http_err:
            logger.warning("Remote ARGO API HTTP %s: %s", http_err.code, http_err.reason)
        except Exception as exc:
            logger.warning("Failed to retrieve data from remote ARGO API: %s", exc)

        return observations

    def _extract_observations_from_profile(self, profile: Dict[str, Any]) -> List[ArgoObservation]:
        """Convert Argovis JSON profile record into list of level observations."""
        observations: List[ArgoObservation] = []
        plat_id = str(profile.get("platform_number") or profile.get("_id", "").split("_")[0] or "UNKNOWN")
        geolocation = profile.get("geolocation", {}).get("coordinates", [None, None])
        lon = geolocation[0] if len(geolocation) > 0 else None
        lat = geolocation[1] if len(geolocation) > 1 else None
        ts = profile.get("timestamp")
        cycle = profile.get("cycle_number")

        data_rows = profile.get("data", [])
        data_keys = profile.get("data_keys", [])

        if data_rows and data_keys:
            for row in data_rows:
                row_dict = dict(zip(data_keys, row))
                row_dict["platform_id"] = plat_id
                row_dict["latitude"] = lat
                row_dict["longitude"] = lon
                row_dict["timestamp"] = ts
                row_dict["cycle_number"] = cycle

                obs = normalize_observation_dict(row_dict, data_source="REAL_ARGO_ARGOVIS")
                if obs is not None:
                    observations.append(obs)

        return observations
