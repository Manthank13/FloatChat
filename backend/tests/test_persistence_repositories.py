from datetime import datetime, timezone
import pytest
from app.db.repositories.chat_message import ChatMessageRepository
from app.db.repositories.chat_session import ChatSessionRepository
from app.db.repositories.saved_query import SavedQueryRepository
from app.db.repositories.user_preferences import UserPreferencesRepository


@pytest.mark.asyncio
async def test_chat_session_repository_crud() -> None:
    repo = ChatSessionRepository(db=None)

    # 1. Create
    session = await repo.create_session(user_id="user_123", title="Deep Sea Trenches")
    assert session.id is not None
    assert session.user_id == "user_123"
    assert session.title == "Deep Sea Trenches"
    assert session.is_archived is False

    # 2. Get
    fetched = await repo.get_session(session_id=session.id, user_id="user_123")
    assert fetched is not None
    assert fetched.title == "Deep Sea Trenches"

    # Get with wrong user returns None
    assert await repo.get_session(session_id=session.id, user_id="wrong_user") is None

    # 3. Update
    updated = await repo.update_session(session_id=session.id, user_id="user_123", title="Updated Trenches", is_archived=True)
    assert updated is not None
    assert updated.title == "Updated Trenches"
    assert updated.is_archived is True

    # 4. List
    sessions, total = await repo.list_sessions(user_id="user_123", page=1, page_size=10)
    assert total == 1
    assert sessions[0].id == session.id

    # 5. Delete
    assert await repo.delete_session(session_id=session.id, user_id="user_123") is True
    assert await repo.get_session(session_id=session.id, user_id="user_123") is None


@pytest.mark.asyncio
async def test_chat_message_repository_crud() -> None:
    repo = ChatMessageRepository(db=None)

    # 1. Create messages
    msg1 = await repo.create_message(session_id="sess_1", user_id="user_123", role="user", content="Hello ocean!")
    msg2 = await repo.create_message(session_id="sess_1", user_id="user_123", role="assistant", content="Hello explorer!")

    assert msg1.id is not None
    assert msg1.role == "user"
    assert msg2.role == "assistant"

    # 2. List messages (chronological)
    messages, total = await repo.list_messages(session_id="sess_1", user_id="user_123", page=1, page_size=10)
    assert total == 2
    assert messages[0].content == "Hello ocean!"
    assert messages[1].content == "Hello explorer!"

    # 3. Delete messages by session
    deleted_count = await repo.delete_messages_by_session(session_id="sess_1", user_id="user_123")
    assert deleted_count == 2
    _, total_after = await repo.list_messages(session_id="sess_1", user_id="user_123")
    assert total_after == 0


@pytest.mark.asyncio
async def test_saved_query_repository_crud() -> None:
    repo = SavedQueryRepository(db=None)

    query_payload = {"latitude": -20.0, "longitude": 100.0, "variable": "PSAL"}
    record = await repo.create_query(user_id="user_456", name="Salinity Profile", description="Indian Ocean", query=query_payload)
    assert record.id is not None
    assert record.name == "Salinity Profile"

    # Fetch
    fetched = await repo.get_query(query_id=record.id, user_id="user_456")
    assert fetched is not None
    assert fetched.query["variable"] == "PSAL"

    # Wrong user -> None
    assert await repo.get_query(query_id=record.id, user_id="other_user") is None

    # Update
    updated = await repo.update_query(query_id=record.id, user_id="user_456", name="New Name")
    assert updated.name == "New Name"

    # Delete
    assert await repo.delete_query(query_id=record.id, user_id="user_456") is True
    assert await repo.get_query(query_id=record.id, user_id="user_456") is None


@pytest.mark.asyncio
async def test_user_preferences_repository_crud() -> None:
    repo = UserPreferencesRepository(db=None)

    # 1. Get or create default
    prefs = await repo.get_or_create_default(user_id="user_pref_test")
    assert prefs.user_id == "user_pref_test"
    assert prefs.theme == "dark"
    assert prefs.language == "en"

    # 2. Upsert preferences
    updated = await repo.upsert_preferences(
        user_id="user_pref_test",
        theme="light",
        language="de",
        default_map_zoom=6,
    )
    assert updated.theme == "light"
    assert updated.language == "de"
    assert updated.default_map_zoom == 6

    # 3. Subsequent get returns updated preferences
    refetched = await repo.get_preferences(user_id="user_pref_test")
    assert refetched.theme == "light"


@pytest.mark.asyncio
async def test_repositories_create_indexes_safe_without_db() -> None:
    # All create_indexes methods should execute safely without crashing when collection is None
    await ChatSessionRepository(db=None).create_indexes()
    await ChatMessageRepository(db=None).create_indexes()
    await SavedQueryRepository(db=None).create_indexes()
    await UserPreferencesRepository(db=None).create_indexes()
