from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.argo import FloatMetadata, Profile


class ArgoDataSource(ABC):
    """Abstract Base Class for Argo ocean data providers."""

    @abstractmethod
    async def get_float(self, float_id: str) -> Optional[FloatMetadata]:
        """Retrieves metadata for a specific Argo float platform."""
        pass

    @abstractmethod
    async def get_float_profiles(self, float_id: str, limit: int = 10) -> List[Profile]:
        """Retrieves profile observation series for a specific float."""
        pass

    @abstractmethod
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
        pass
