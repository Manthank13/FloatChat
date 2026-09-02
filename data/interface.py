"""
Abstract Data Source and Data Retriever interfaces for FloatChat.
"""

import abc
from typing import Any, Dict, List, Optional, Tuple, Union

from ai.models import StructuredQuery
from data.models import ArgoObservation, ArgoProfile, RetrievalResult


class BaseArgoDataSource(abc.ABC):
    """
    Abstract interface for loading and querying ARGO float datasets.
    
    Decouples the retrieval and filtering layer from specific file formats
    such as NetCDF (.nc), Apache Parquet (.parquet), SQLite, or remote GDAC REST APIs.
    """

    @abc.abstractmethod
    def load_observations(self) -> List[ArgoObservation]:
        """Load and return all available depth-level observation records."""
        pass

    @abc.abstractmethod
    def load_profiles(self) -> List[ArgoProfile]:
        """Load and return all available vertical float profiles."""
        pass

    @abc.abstractmethod
    def get_available_platforms(self) -> List[str]:
        """Return list of distinct 7-digit ARGO float WMO identifiers."""
        pass

    @abc.abstractmethod
    def get_spatial_bounds(self) -> Tuple[float, float, float, float]:
        """Return bounding box (min_lat, min_lon, max_lat, max_lon) of dataset."""
        pass

    @abc.abstractmethod
    def get_temporal_bounds(self) -> Tuple[str, str]:
        """Return ISO timestamp bounds (earliest_date, latest_date) of dataset."""
        pass


class BaseDataRetriever(abc.ABC):
    """
    Abstract interface for executing StructuredQuery requests to retrieve ARGO observations.
    """

    @abc.abstractmethod
    def retrieve(self, query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """
        Execute structured query and return structured RetrievalResult.
        """
        pass

    def query(self, query: Union[StructuredQuery, Dict[str, Any]]) -> RetrievalResult:
        """Alias for retrieve() to ensure backward compatibility."""
        return self.retrieve(query)
