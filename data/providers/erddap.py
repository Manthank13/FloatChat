from __future__ import annotations

import csv
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

DEFAULT_ERDDAP_URL = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv"
COLUMNS = "platform_number,cycle_number,time,latitude,longitude,pres,temp,psal,pres_qc,temp_qc,psal_qc"


class ErddapArgoProvider(BaseArgoProvider):
    """
    Live ARGO Data Provider querying public IFREMER ERDDAP GDAC REST endpoints
    using streamed CSV transfers for ultra-low memory overhead and instant response times.
    """

    def __init__(self, config: Optional[DataConfig] = None):
        super().__init__(name="ERDDAP_IFREMER_PROVIDER")
        self.config = config or DataConfig()
        base = self.config.remote_api_url or DEFAULT_ERDDAP_URL
        if base.endswith(".json"):
            base = base.replace(".json", ".csv")
        self.base_url = base
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
        Query IFREMER ERDDAP for profiles matching spatial, platform, or temporal bounds
        with streaming CSV processing.
        """
        query_constraints: List[str] = []

        # 1. Platform Filter
        if query and query.platform_id:
            clean_plat = str(query.platform_id).strip()
            query_constraints.append(f'platform_number="{clean_plat}"')

        # 2. Spatial Filter: Clamp maximum bounding box span to prevent excessive remote generation
        if min_lat is not None and max_lat is not None:
            c_lat = (float(min_lat) + float(max_lat)) / 2.0
            span_lat = float(max_lat) - float(min_lat)
            if span_lat > 6.0:
                min_lat = c_lat - 3.0
                max_lat = c_lat + 3.0
            query_constraints.append(f"latitude>={float(min_lat):.4f}")
            query_constraints.append(f"latitude<={float(max_lat):.4f}")
        elif min_lat is not None:
            query_constraints.append(f"latitude>={float(min_lat):.4f}")
        elif max_lat is not None:
            query_constraints.append(f"latitude<={float(max_lat):.4f}")

        if min_lon is not None and max_lon is not None:
            c_lon = (float(min_lon) + float(max_lon)) / 2.0
            span_lon = float(max_lon) - float(min_lon)
            if span_lon > 6.0:
                min_lon = c_lon - 3.0
                max_lon = c_lon + 3.0
            query_constraints.append(f"longitude>={float(min_lon):.4f}")
            query_constraints.append(f"longitude<={float(max_lon):.4f}")
        elif min_lon is not None:
            query_constraints.append(f"longitude>={float(min_lon):.4f}")
        elif max_lon is not None:
            query_constraints.append(f"longitude<={float(max_lon):.4f}")

        # 3. Time Filter
        if query and query.time_range and query.time_range.start_date:
            query_constraints.append(f'time>="{query.time_range.start_date}T00:00:00Z"')
        elif min_lat is not None:
            # Default to modern 2024+ telemetry window
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
        logger.info("Executing streaming live ARGO ERDDAP query: %s", req_url)

        headers = {
            "User-Agent": "FloatChat/1.0 (Oceanographic AI Assistant; IFREMER GDAC Client)",
            "Accept": "text/csv, application/json",
        }

        observations: List[ArgoObservation] = []

        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                with client.stream("GET", req_url, headers=headers) as resp:
                    if resp.status_code == 200:
                        lines = resp.iter_lines()
                        header_line = next(lines, None)
                        units_line = next(lines, None)
                        if header_line:
                            col_names = [c.strip() for c in next(csv.reader([header_line]))]
                            for line in lines:
                                if not line:
                                    continue
                                row_values = next(csv.reader([line]))
                                if len(row_values) == len(col_names):
                                    row_dict = dict(zip(col_names, row_values))
                                    obs = normalize_observation_dict(row_dict, data_source="REAL_ARGO_GDAC")
                                    if obs is not None:
                                        observations.append(obs)
                                        if len(observations) >= self.max_obs:
                                            break

                        logger.info(
                            "ERDDAP stream yielded %d valid normalized observations.",
                            len(observations),
                        )
                    elif resp.status_code == 404:
                        logger.info("ERDDAP returned 404 (No matching data found for query constraints).")
                    else:
                        logger.warning("ERDDAP HTTP %s error", resp.status_code)
        except httpx.TimeoutException:
            logger.warning("Timeout (%ss) connecting to live IFREMER ERDDAP service.", self.timeout)
        except Exception as exc:
            logger.warning("Failed to query live IFREMER ERDDAP service: %s", exc)

        return observations
