import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure app package is importable from tests directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Ensure testing environment is active during tests so MongoDB Atlas is never contacted
os.environ["ENVIRONMENT"] = "testing"

from app.core.config import settings
settings.ENVIRONMENT = "testing"

from app.db.repositories.user import UserRepository
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Fixture returning FastAPI TestClient."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def isolate_in_memory_users():
    """Ensures each test starts and ends with an isolated in-memory user repository."""
    UserRepository._in_memory_users.clear()
    yield
    UserRepository._in_memory_users.clear()
