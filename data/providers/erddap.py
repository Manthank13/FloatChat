from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import httpx

if TYPE_CHECKING:
    from ai.models import StructuredQuery

from data.config import DataConfig
from data.models import ArgoObservation
from data.normalization import normalize_observation_dict
from data.providers.base import BaseArgoProvider

logger = logging.getLogger(__name__)

DEFAULT_ERDDAP_URL = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json"
COLUMNS = "platform_number,cycle_number,time,latitude,longitude,pres,temp,psal,pres_qc,temp_qc,psal_qc"


class ErddapArgoProvider(BaseArgoProvider):
    """
    Live ARGO Data Provider querying public IFREMER ERDDAP GDAC REST endpoints.
    """

    def __init__(self, config: Optional[DataConfig] = None):
        super().__init__(name="ERDDAP_IFREMER_PROVIDER")
        self.config = config or DataConfig()
        self.base_url = self.config.remote_api_url or DEFAULT_ERDDAP_URL
        if not self.base_url.endswith(".json") and "tabledap" in self.base_url:
            self.base_url = f"{self.base_url}.json"
        self.timeout = self.config.timeout_seconds or 25.0
        self.max_obs = self.config.max_observations or 1000

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
        Query IFREMER ERDDAP for profiles matching spatial, platform, or temporal bounds.
        """
        query_constraints: List[str] = []

        # 1. Platform Filter
        if query and query.platform_id:
            clean_plat = str(query.platform_id).strip()
            query_constraints.append(f'platform_number="{clean_plat}"')

        # 2. Spatial Filter
        if min_lat is not None:
            query_constraints.append(f"latitude>={float(min_lat):.4f}")
        if max_lat is not None:
            query_constraints.append(f"latitude<={float(max_lat):.4f}")
        if min_lon is not None:
            query_constraints.append(f"longitude>={float(min_lon):.4f}")
        if max_lon is not None:
            query_constraints.append(f"longitude<={float(max_lon):.4f}")

        # 3. Time Filter
        if query and query.time_range and query.time_range.start_date:
            query_constraints.append(f'time>="{query.time_range.start_date}T00:00:00Z"')
        elif min_lat is not None:
            # Default to modern 2024+ telemetry window for lightning-fast querying and minimal memory overhead
            query_constraints.append('time>="2024-01-01T00:00:00Z"')

        if query and query.time_range and query.time_range.end_date:
            query_constraints.append(f'time<="{query.time_range.end_date}T23:59:59Z"')

        # 4. Depth Filter
        if query and query.depth:
            if query.depth.target_depth is not None:
                d = float(query.depth.target_depth)
                query_constraints.append(f"pres>={max(0.0, d - 30.0):.1f}")
                query_constraints.append(f"pres<={d + 30.0:.1f}")
            elif query.depth.depth_min is not None and query.depth.depth_max is not None:
                query_constraints.append(f"pres>={float(query.depth.depth_min):.1f}")
                query_constraints.append(f"pres<={float(query.depth.depth_max):.1f}")

        # If no platform or spatial bounding box specified, we cannot run an unconstrained query against GDAC
        if not query_constraints:
            logger.info("No spatial or platform constraints provided for ERDDAP query.")
            return []

        query_string = f"{COLUMNS}&{'&'.join(query_constraints)}"
        req_url = f"{self.base_url}?{query_string}"
        logger.info("Executing live ARGO ERDDAP query: %s", req_url)

        headers = {
            "User-Agent": "FloatChat/1.0 (Oceanographic AI Assistant; IFREMER GDAC Client)",
            "Accept": "application/json",
        }

        observations: List[ArgoObservation] = []

        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                resp = client.get(req_url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    table = data.get("table", {})
                    column_names = table.get("columnNames", [])
                    rows = table.get("rows", [])

                    for row in rows:
                        row_dict = dict(zip(column_names, row))
                        obs = normalize_observation_dict(row_dict, data_source="REAL_ARGO_GDAC")
                        if obs is not None:
                            observations.append(obs)
                            if len(observations) >= self.max_obs:
                                break

                    logger.info(
                        "ERDDAP returned %d raw rows, normalized %d valid ARGO observations.",
                        len(rows),
                        len(observations),
                    )
                elif resp.status_code == 404:
                    logger.info("ERDDAP returned 404 (No matching data found for query constraints).")
                else:
                    logger.warning("ERDDAP HTTP %s error: %s", resp.status_code, resp.text[:200])
        except httpx.TimeoutException:
            logger.warning("Timeout (%ss) connecting to live IFREMER ERDDAP service.", self.timeout)
        except Exception as exc:
            logger.warning("Failed to query live IFREMER ERDDAP service: %s", exc)

        return observations
