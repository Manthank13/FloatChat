from unittest.mock import patch
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.db.repositories.user import UserRepository


@pytest.fixture(autouse=True)
def clear_in_memory_users():
    UserRepository._in_memory_users.clear()
    yield
    UserRepository._in_memory_users.clear()


def test_auth_register_login_me_logout_flow(client: TestClient) -> None:
    fake_repo = UserRepository(db=None)

    with patch("app.services.auth.UserRepository", return_value=fake_repo), patch("app.api.deps.UserRepository", return_value=fake_repo):
        # 1. POST /api/v1/auth/register
        reg_payload = {
            "email": "Explorer@FloatChat.Org",
            "password": "SecurePassword123!",
            "display_name": "Ocean Explorer",
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == status.HTTP_201_CREATED

        data_reg = res_reg.json()
        assert "access_token" in data_reg
        assert data_reg["token_type"] == "bearer"
        assert data_reg["user"]["email"] == "explorer@floatchat.org"
        assert "password_hash" not in data_reg["user"]

        token = data_reg["access_token"]

        # 2. POST /api/v1/auth/login
        login_payload = {"email": "explorer@floatchat.org", "password": "SecurePassword123!"}
        res_login = client.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == status.HTTP_200_OK

        data_login = res_login.json()
        assert "access_token" in data_login

        # 3. GET /api/v1/auth/me (Protected Route)
        headers = {"Authorization": f"Bearer {token}"}
        res_me = client.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == status.HTTP_200_OK

        data_me = res_me.json()
        assert data_me["email"] == "explorer@floatchat.org"
        assert data_me["display_name"] == "Ocean Explorer"

        # 4. POST /api/v1/auth/logout
        res_logout = client.post("/api/v1/auth/logout")
        assert res_logout.status_code == status.HTTP_200_OK
        assert res_logout.json()["status"] == "logged_out"


def test_auth_me_unauthorized_without_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "error" in response.json()


def test_auth_register_duplicate_email_conflict(client: TestClient) -> None:
    fake_repo = UserRepository(db=None)

    with patch("app.services.auth.UserRepository", return_value=fake_repo):
        payload = {"email": "duplicate@floatchat.org", "password": "Password123!", "display_name": "Test User"}
        res1 = client.post("/api/v1/auth/register", json=payload)
        assert res1.status_code == status.HTTP_201_CREATED

        # Duplicate register
        res2 = client.post("/api/v1/auth/register", json=payload)
        assert res2.status_code == status.HTTP_409_CONFLICT
