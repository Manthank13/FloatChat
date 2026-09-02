import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure app package is importable from tests directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Fixture returning FastAPI TestClient."""
    with TestClient(app) as c:
        yield c
