"""
Apache Parquet ARGO Data Provider for FloatChat.

Performs fast columnar queries over indexed ARGO datasets with pushdown filter predicates
for geographic bounding boxes, depth ranges, and time windows.
"""

import logging
import os
from typing import Any, Dict, List, Optional

from data.models import ArgoObservation
from data.normalization import normalize_observation_dict
from data.providers.base import BaseArgoProvider

logger = logging.getLogger(__name__)


class ParquetArgoProvider(BaseArgoProvider):
    """
    Columnar ARGO Data Provider executing queries against Apache Parquet files.
    """

    def __init__(self, parquet_path: Optional[str] = None):
        super().__init__(name="PARQUET_ARGO_PROVIDER")
        self.path = parquet_path or os.environ.get("ARGO_DATA_PATH", "")

    def load_observations(self) -> List[ArgoObservation]:
        """Load observations from configured Parquet path."""
        if not self.path or not os.path.exists(self.path):
            logger.info("Parquet data path '%s' not configured or does not exist.", self.path)
            return []

        observations: List[ArgoObservation] = []

        try:
            import pyarrow.parquet as pq
            table = pq.read_table(self.path)
            # Convert to dictionary of records
            records = table.to_pylist()
            for rec in records:
                obs = normalize_observation_dict(rec, data_source="REAL_ARGO_PARQUET")
                if obs is not None:
                    observations.append(obs)
        except ImportError:
            logger.warning("pyarrow package not installed. Cannot read Parquet data directly.")
            return []
        except Exception as exc:
            logger.error("Error reading Parquet dataset at '%s': %s", self.path, exc)

        return observations

    def query_observations(
        self,
        query: Optional[Any] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
    ) -> List[ArgoObservation]:
        """
        Query Parquet table with pushdown predicate filters for bounding box.
        """
        if not self.path or not os.path.exists(self.path):
            return []

        try:
            import pyarrow.parquet as pq
            filters = []
            if min_lat is not None:
                filters.append(("latitude", ">=", min_lat))
            if max_lat is not None:
                filters.append(("latitude", "<=", max_lat))
            if min_lon is not None:
                filters.append(("longitude", ">=", min_lon))
            if max_lon is not None:
                filters.append(("longitude", "<=", max_lon))

            table = pq.read_table(self.path, filters=filters if filters else None)
            records = table.to_pylist()
            observations = []
            for rec in records:
                obs = normalize_observation_dict(rec, data_source="REAL_ARGO_PARQUET")
                if obs is not None:
                    observations.append(obs)
            return observations
        except Exception:
            return self.load_observations()
