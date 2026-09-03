from app.core.config import settings
from app.core.logging import logger
from app.services.base import ArgoDataSource
from app.services.erddap import ErddapArgoDataSource
from app.services.mock import MockArgoDataSource


def get_argo_data_source(provider_override: str = None) -> ArgoDataSource:
    """Factory function instantiating the active Argo data provider based on configuration or runtime override."""
    provider_name = (provider_override or settings.DATA_PROVIDER).strip().lower()

    if provider_override is None and settings.is_testing():
        logger.info("Initializing MockArgoDataSource provider (testing mode)")
        return MockArgoDataSource()

    if provider_name in ("mock", "demo", "synthetic"):
        logger.info("Initializing MockArgoDataSource provider")
        return MockArgoDataSource()

    logger.info(f"Initializing ErddapArgoDataSource provider ({settings.ARGO_BASE_URL})")
    return ErddapArgoDataSource()
