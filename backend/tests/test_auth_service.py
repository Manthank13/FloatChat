import pytest
from app.db.repositories.user import UserRepository
from app.models.auth import UserLogin, UserRegister
from app.services.auth import AuthService


@pytest.fixture(autouse=True)
def clear_in_memory_users():
    UserRepository._in_memory_users.clear()
    yield
    UserRepository._in_memory_users.clear()


@pytest.mark.asyncio
async def test_auth_service_register_and_login() -> None:
    repo = UserRepository(db=None)
    service = AuthService(user_repo=repo)

    reg_data = UserRegister(
        email="Scientist@FloatChat.com",
        password="StrongPassword123!",
        display_name="Ocean Scientist",
    )

    # 1. Register User
    reg_response = await service.register_user(reg_data)
    assert reg_response.access_token is not None
    assert reg_response.token_type == "bearer"
    assert reg_response.user.email == "scientist@floatchat.com"
    assert reg_response.user.display_name == "Ocean Scientist"

    # Password hash must NEVER be in response
    assert not hasattr(reg_response.user, "password_hash")

    # 2. Login with valid credentials
    login_data = UserLogin(email="SCIENTIST@floatchat.com", password="StrongPassword123!")
    login_response = await service.login_user(login_data)
    assert login_response.access_token is not None
    assert login_response.user.id == reg_response.user.id


@pytest.mark.asyncio
async def test_auth_service_duplicate_email_conflict() -> None:
    repo = UserRepository(db=None)
    service = AuthService(user_repo=repo)

    reg_data = UserRegister(email="user@floatchat.com", password="Password123!", display_name="User A")
    await service.register_user(reg_data)

    # Duplicate registration
    with pytest.raises(ValueError) as exc:
        await service.register_user(reg_data)

    assert "already registered" in str(exc.value)


@pytest.mark.asyncio
async def test_auth_service_invalid_login_credentials() -> None:
    repo = UserRepository(db=None)
    service = AuthService(user_repo=repo)

    reg_data = UserRegister(email="user2@floatchat.com", password="Password123!", display_name="User B")
    await service.register_user(reg_data)

    # Wrong password
    with pytest.raises(ValueError) as exc1:
        await service.login_user(UserLogin(email="user2@floatchat.com", password="WrongPassword!"))
    assert "Invalid email or password" in str(exc1.value)

    # Nonexistent email
    with pytest.raises(ValueError) as exc2:
        await service.login_user(UserLogin(email="nonexistent@floatchat.com", password="Password123!"))
    assert "Invalid email or password" in str(exc2.value)
