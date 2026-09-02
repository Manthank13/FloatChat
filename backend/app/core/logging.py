import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configures application logging level and format."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    logger = logging.getLogger("floatchat")
    logger.setLevel(log_level)
    return logger


logger = setup_logging()
