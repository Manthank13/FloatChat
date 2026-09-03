import pytest
from app.db.repositories.user import UserRepository


@pytest.fixture(autouse=True)
def clear_in_memory_users():
    UserRepository._in_memory_users.clear()
    yield
    UserRepository._in_memory_users.clear()


@pytest.mark.asyncio
async def test_user_repository_create_and_find() -> None:
    repo = UserRepository(db=None)

    email = "Oceanographer@FloatChat.Org"
    user = await repo.create_user(
        email=email,
        password_hash="$argon2id$mock_hash_123",
        display_name="Dr. Sylvia Earle",
    )

    assert user.id is not None
    assert user.email == "oceanographer@floatchat.org"  # Normalized to lowercase
    assert user.display_name == "Dr. Sylvia Earle"

    # Find by email
    found_email = await repo.find_by_email("OCEANOGRAPHER@floatchat.org")
    assert found_email is not None
    assert found_email.id == user.id

    # Find by ID
    found_id = await repo.find_by_id(user.id)
    assert found_id is not None
    assert found_id.email == "oceanographer@floatchat.org"


@pytest.mark.asyncio
async def test_user_repository_duplicate_email_prevention() -> None:
    repo = UserRepository(db=None)

    email = "duplicate@floatchat.org"
    await repo.create_user(email=email, password_hash="hash1", display_name="User 1")

    with pytest.raises(ValueError) as exc:
        await repo.create_user(email=email.upper(), password_hash="hash2", display_name="User 2")

    assert "already exists" in str(exc.value)
