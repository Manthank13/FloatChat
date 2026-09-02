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

from app.db.repositories.chat_message import ChatMessageRepository
from app.db.repositories.chat_session import ChatSessionRepository
from app.db.repositories.saved_query import SavedQueryRepository
from app.db.repositories.user import UserRepository
from app.db.repositories.user_preferences import UserPreferencesRepository
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Fixture returning FastAPI TestClient."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def isolate_in_memory_database():
    """Ensures each test starts and ends with clean isolated in-memory repositories."""
    UserRepository._in_memory_users.clear()
    ChatSessionRepository._in_memory_sessions.clear()
    ChatMessageRepository._in_memory_messages.clear()
    SavedQueryRepository._in_memory_queries.clear()
    UserPreferencesRepository._in_memory_preferences.clear()
    yield
    UserRepository._in_memory_users.clear()
    ChatSessionRepository._in_memory_sessions.clear()
    ChatMessageRepository._in_memory_messages.clear()
    SavedQueryRepository._in_memory_queries.clear()
    UserPreferencesRepository._in_memory_preferences.clear()
