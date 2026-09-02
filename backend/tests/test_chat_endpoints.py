from datetime import timedelta
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.db.repositories.user import UserRepository


@pytest.fixture
def auth_header() -> dict:
    """Fixture providing valid Authorization header for a test user."""
    repo = UserRepository(db=None)
    import asyncio
    user = asyncio.run(repo.create_user(
        email="ocean_user@floatchat.org",
        password_hash="$argon2id$mock_hash_123",
        display_name="Ocean Scientist",
    ))
    token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=60))
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


def test_create_and_get_chat_session(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    # 1. Create session with title
    payload = {"title": "North Atlantic Salinity Exploration"}
    res = client.post("/api/v1/chat/sessions", json=payload, headers=headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["title"] == "North Atlantic Salinity Exploration"
    assert data["user_id"] == auth_header["user_id"]
    assert data["is_archived"] is False
    assert data["last_message_at"] is None
    session_id = data["id"]

    # 2. Get session by ID
    res_get = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_get.status_code == status.HTTP_200_OK
    data_get = res_get.json()
    assert data_get["id"] == session_id
    assert data_get["title"] == "North Atlantic Salinity Exploration"


def test_create_session_default_title(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}
    res = client.post("/api/v1/chat/sessions", json={}, headers=headers)
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["title"] == "New Ocean Conversation"


def test_list_chat_sessions_pagination(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}

    # Create 3 sessions
    for i in range(3):
        client.post("/api/v1/chat/sessions", json={"title": f"Session {i}"}, headers=headers)

    res_list = client.get("/api/v1/chat/sessions?page=1&page_size=2", headers=headers)
    assert res_list.status_code == status.HTTP_200_OK
    data = res_list.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["has_more"] is True
    assert data["page"] == 1

    # Page 2
    res_page2 = client.get("/api/v1/chat/sessions?page=2&page_size=2", headers=headers)
    assert res_page2.status_code == status.HTTP_200_OK
    assert len(res_page2.json()["items"]) == 1
    assert res_page2.json()["has_more"] is False


def test_update_chat_session(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}
    created = client.post("/api/v1/chat/sessions", json={"title": "Old Title"}, headers=headers).json()
    session_id = created["id"]

    patch_payload = {"title": "Updated Title", "is_archived": True}
    res_patch = client.patch(f"/api/v1/chat/sessions/{session_id}", json=patch_payload, headers=headers)
    assert res_patch.status_code == status.HTTP_200_OK
    updated = res_patch.json()
    assert updated["title"] == "Updated Title"
    assert updated["is_archived"] is True


def test_messages_flow_and_timestamps(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}
    session = client.post("/api/v1/chat/sessions", json={"title": "Message Test"}, headers=headers).json()
    session_id = session["id"]

    # 1. Add user message
    msg1_payload = {
        "role": "user",
        "content": "Find temperature anomalies near 15N 45W",
        "metadata": {"source": "web_ui"},
    }
    res_msg1 = client.post(f"/api/v1/chat/sessions/{session_id}/messages", json=msg1_payload, headers=headers)
    assert res_msg1.status_code == status.HTTP_201_CREATED
    data_msg1 = res_msg1.json()
    assert data_msg1["role"] == "user"
    assert data_msg1["content"] == msg1_payload["content"]
    assert data_msg1["metadata"]["source"] == "web_ui"
    assert data_msg1["session_id"] == session_id

    # 2. Add assistant message
    msg2_payload = {
        "role": "assistant",
        "content": "I retrieved 4 profiles within 100km of coordinates.",
        "metadata": {"floats_matched": 4},
    }
    res_msg2 = client.post(f"/api/v1/chat/sessions/{session_id}/messages", json=msg2_payload, headers=headers)
    assert res_msg2.status_code == status.HTTP_201_CREATED

    # 3. Check session last_message_at updated
    res_session = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_session.status_code == status.HTTP_200_OK
    assert res_session.json()["last_message_at"] is not None

    # 4. List messages chronologically
    res_msgs = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=headers)
    assert res_msgs.status_code == status.HTTP_200_OK
    msgs_data = res_msgs.json()
    assert msgs_data["total"] == 2
    assert msgs_data["items"][0]["role"] == "user"
    assert msgs_data["items"][1]["role"] == "assistant"


def test_delete_session_and_cascade_messages(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}
    session = client.post("/api/v1/chat/sessions", json={"title": "To Delete"}, headers=headers).json()
    session_id = session["id"]

    # Add message
    client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        json={"role": "user", "content": "Hello!"},
        headers=headers,
    )

    # Delete session
    res_del = client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_del.status_code == status.HTTP_200_OK
    assert res_del.json()["status"] == "deleted"

    # Confirm session is gone
    res_get = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_get.status_code == status.HTTP_404_NOT_FOUND

    # Confirm messages endpoint returns 404
    res_msgs = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=headers)
    assert res_msgs.status_code == status.HTTP_404_NOT_FOUND


def test_invalid_role_and_empty_content_rejected(client: TestClient, auth_header: dict) -> None:
    headers = {"Authorization": auth_header["Authorization"]}
    session = client.post("/api/v1/chat/sessions", json={"title": "Validation"}, headers=headers).json()
    session_id = session["id"]

    # Invalid role
    res_role = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        json={"role": "moderator", "content": "Hello"},
        headers=headers,
    )
    assert res_role.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Empty content
    res_empty = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        json={"role": "user", "content": "   "},
        headers=headers,
    )
    assert res_empty.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
