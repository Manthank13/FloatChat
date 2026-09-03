from datetime import timedelta
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.db.repositories.user import UserRepository


@pytest.fixture
def two_users() -> dict:
    """Fixture creating two distinct users with valid bearer tokens."""
    repo = UserRepository(db=None)
    import asyncio

    user_a = asyncio.run(repo.create_user(
        email="user_a@floatchat.org",
        password_hash="$argon2id$user_a_hash",
        display_name="User Alpha",
    ))
    user_b = asyncio.run(repo.create_user(
        email="user_b@floatchat.org",
        password_hash="$argon2id$user_b_hash",
        display_name="User Beta",
    ))

    token_a = create_access_token(subject=user_a.id, expires_delta=timedelta(hours=1))
    token_b = create_access_token(subject=user_b.id, expires_delta=timedelta(hours=1))

    return {
        "user_a": {"id": user_a.id, "headers": {"Authorization": f"Bearer {token_a}"}},
        "user_b": {"id": user_b.id, "headers": {"Authorization": f"Bearer {token_b}"}},
    }


def test_unauthenticated_requests_rejected(client: TestClient) -> None:
    # Chat sessions
    assert client.get("/api/v1/chat/sessions").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.post("/api/v1/chat/sessions", json={}).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get("/api/v1/chat/sessions/dummy_id").status_code == status.HTTP_401_UNAUTHORIZED

    # Saved queries
    assert client.get("/api/v1/saved-queries").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.post("/api/v1/saved-queries", json={}).status_code == status.HTTP_401_UNAUTHORIZED

    # Preferences
    assert client.get("/api/v1/preferences").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.put("/api/v1/preferences", json={}).status_code == status.HTTP_401_UNAUTHORIZED


def test_cross_user_session_access_denied(client: TestClient, two_users: dict) -> None:
    headers_a = two_users["user_a"]["headers"]
    headers_b = two_users["user_b"]["headers"]

    # User A creates a session
    res_a = client.post("/api/v1/chat/sessions", json={"title": "Private Session A"}, headers=headers_a)
    session_id = res_a.json()["id"]

    # User B cannot retrieve User A's session -> 404
    res_b_get = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers_b)
    assert res_b_get.status_code == status.HTTP_404_NOT_FOUND

    # User B cannot update User A's session -> 404
    res_b_patch = client.patch(
        f"/api/v1/chat/sessions/{session_id}",
        json={"title": "Hacked Title"},
        headers=headers_b,
    )
    assert res_b_patch.status_code == status.HTTP_404_NOT_FOUND

    # User B cannot post a message to User A's session -> 404
    res_b_msg = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        json={"role": "user", "content": "Spam message"},
        headers=headers_b,
    )
    assert res_b_msg.status_code == status.HTTP_404_NOT_FOUND

    # User B cannot list messages in User A's session -> 404
    res_b_msgs = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=headers_b)
    assert res_b_msgs.status_code == status.HTTP_404_NOT_FOUND

    # User B cannot delete User A's session -> 404
    res_b_del = client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers_b)
    assert res_b_del.status_code == status.HTTP_404_NOT_FOUND

    # User B's list does not contain User A's session
    res_b_list = client.get("/api/v1/chat/sessions", headers=headers_b)
    assert res_b_list.json()["total"] == 0


def test_cross_user_saved_query_access_denied(client: TestClient, two_users: dict) -> None:
    headers_a = two_users["user_a"]["headers"]
    headers_b = two_users["user_b"]["headers"]

    # User A creates a saved query
    res_a = client.post(
        "/api/v1/saved-queries",
        json={"name": "Secret Query A", "query": {"latitude": 20.0, "longitude": 60.0}},
        headers=headers_a,
    )
    query_id = res_a.json()["id"]

    # User B cannot access User A's saved query -> 404
    assert client.get(f"/api/v1/saved-queries/{query_id}", headers=headers_b).status_code == status.HTTP_404_NOT_FOUND
    assert client.patch(f"/api/v1/saved-queries/{query_id}", json={"name": "Hijacked"}, headers=headers_b).status_code == status.HTTP_404_NOT_FOUND
    assert client.delete(f"/api/v1/saved-queries/{query_id}", headers=headers_b).status_code == status.HTTP_404_NOT_FOUND

    # User B list is empty
    assert client.get("/api/v1/saved-queries", headers=headers_b).json()["total"] == 0


def test_cross_user_preferences_isolated(client: TestClient, two_users: dict) -> None:
    headers_a = two_users["user_a"]["headers"]
    headers_b = two_users["user_b"]["headers"]

    # User A customizes preferences to "light" and "fr"
    client.put("/api/v1/preferences", json={"theme": "light", "language": "fr"}, headers=headers_a)

    # User B retrieves preferences -> should receive User B's own defaults ("dark", "en")
    res_b = client.get("/api/v1/preferences", headers=headers_b)
    assert res_b.status_code == status.HTTP_200_OK
    assert res_b.json()["theme"] == "dark"
    assert res_b.json()["language"] == "en"
    assert res_b.json()["user_id"] == two_users["user_b"]["id"]


def test_pagination_bounds_validation(client: TestClient, two_users: dict) -> None:
    headers = two_users["user_a"]["headers"]

    # Page 0 or negative -> 422
    assert client.get("/api/v1/chat/sessions?page=0", headers=headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert client.get("/api/v1/chat/sessions?page=-5", headers=headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Page size > 100 -> 422
    assert client.get("/api/v1/chat/sessions?page_size=101", headers=headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert client.get("/api/v1/saved-queries?page_size=0", headers=headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
