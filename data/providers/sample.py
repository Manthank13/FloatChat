"""
Sample in-memory ARGO data provider for deterministic testing and local development.
"""

from typing import List, Optional

from data.models import ArgoObservation
from data.providers.base import BaseArgoProvider
from data.sample_data import generate_sample_observations


class SampleArgoProvider(BaseArgoProvider):
    """
    Deterministic in-memory provider delivering realistic observations for the
    Bay of Bengal, Arabian Sea, Chennai, Mumbai, and Kochi offshore regions.
    """

    def __init__(self, custom_observations: Optional[List[ArgoObservation]] = None):
        super().__init__(name="SAMPLE_ARGO_PROVIDER")
        self._observations = (
            custom_observations if custom_observations is not None else generate_sample_observations()
        )

    def load_observations(self) -> List[ArgoObservation]:
        """Return all in-memory sample observation records."""
        return list(self._observations)
