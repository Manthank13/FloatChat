from typing import List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.models.argo import FloatMetadata, Profile
from app.services.base import ArgoDataSource
from app.services.normalizer import ArgoNormalizer


class ErddapArgoDataSource(ArgoDataSource):
    """Real Argo data provider fetching public observations from IFREMER ERDDAP GDAC API."""

    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None):
        self.base_url = base_url or settings.ARGO_BASE_URL
        self.timeout = timeout or settings.ARGO_REQUEST_TIMEOUT
        self.data_source_id = "erddap_ifremer"

    async def _fetch_erddap_table(self, query_string: str) -> Optional[dict]:
        """Internal helper to execute HTTP request against ERDDAP tabledap endpoint."""
        url = f"{self.base_url}?{query_string}"
        logger.info(f"Fetching Argo GDAC data from ERDDAP: {url}")
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(url, headers={"User-Agent": f"FloatChat/{settings.VERSION}"})
                if response.status_code == 404:
                    logger.warning(f"ERDDAP returned 404 for query: {query_string}")
                    return None
                response.raise_for_status()
                data = response.json()
                return data.get("table")
        except httpx.TimeoutException:
            logger.error(f"Timeout ({self.timeout}s) fetching Argo data from ERDDAP")
            raise RuntimeError(f"Argo ERDDAP request timed out after {self.timeout} seconds")
        except httpx.HTTPStatusError as exc:
            logger.error(f"HTTP error {exc.response.status_code} fetching Argo data: {exc}")
            raise RuntimeError(f"Argo ERDDAP returned HTTP error {exc.response.status_code}")
        except Exception as exc:
            logger.error(f"Unexpected network error fetching Argo data: {exc}")
            raise RuntimeError(f"Failed to retrieve data from Argo GDAC: {str(exc)}")

    async def get_float(self, float_id: str) -> Optional[FloatMetadata]:
        """Retrieves metadata for a specific Argo float platform."""
        clean_id = str(float_id).strip()
        query = f'platform_number,cycle_number,time,latitude,longitude&platform_number="{clean_id}"&orderByMax("time")'

        table_data = await self._fetch_erddap_table(query)
        if not table_data or not table_data.get("rows"):
            return None

        profiles = ArgoNormalizer.normalize_erddap_table(table_data, is_mock=False, data_source=self.data_source_id)
        if not profiles:
            return None

        latest = profiles[0]

        return FloatMetadata(
            float_id=clean_id,
            last_latitude=latest.latitude,
            last_longitude=latest.longitude,
            last_timestamp=latest.timestamp,
            cycle_number=latest.cycle_number,
            total_profiles=len(profiles),
            metadata={"institution": "Euro-Argo GDAC", "dataset": "ArgoFloats"},
            is_mock=False,
            data_source=self.data_source_id,
        )

    async def get_float_profiles(self, float_id: str, limit: int = 10) -> List[Profile]:
        """Retrieves profile observation series for a specific float."""
        clean_id = str(float_id).strip()
        query = (
            f"platform_number,cycle_number,time,latitude,longitude,pres,temp,psal,pres_qc,temp_qc,psal_qc"
            f'&platform_number="{clean_id}"'
        )

        table_data = await self._fetch_erddap_table(query)
        if not table_data:
            return []

        profiles = ArgoNormalizer.normalize_erddap_table(table_data, is_mock=False, data_source=self.data_source_id)

        # Sort profiles by timestamp descending and apply limit
        profiles.sort(key=lambda p: p.timestamp, reverse=True)
        return profiles[:limit]

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
        """Searches profiles matching spatial and temporal constraints."""
        query_parts = ["platform_number,cycle_number,time,latitude,longitude,pres,temp,psal"]

        if min_lat is not None:
            query_parts.append(f"latitude>={min_lat}")
        if max_lat is not None:
            query_parts.append(f"latitude<={max_lat}")
        if min_lon is not None:
            query_parts.append(f"longitude>={min_lon}")
        if max_lon is not None:
            query_parts.append(f"longitude<={max_lon}")

        if start_date:
            query_parts.append(f"time>={start_date}")
        if end_date:
            query_parts.append(f"time<={end_date}")

        query = "&".join(query_parts)

        table_data = await self._fetch_erddap_table(query)
        if not table_data:
            return []

        profiles = ArgoNormalizer.normalize_erddap_table(table_data, is_mock=False, data_source=self.data_source_id)
        profiles.sort(key=lambda p: p.timestamp, reverse=True)
        return profiles[:limit]
