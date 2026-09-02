from datetime import timedelta
import jwt
import pytest
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_argon2_password_hashing_and_verification() -> None:
    raw_password = "SecretPassword123!"
    hashed = get_password_hash(raw_password)

    # Password hash must not equal raw password
    assert hashed != raw_password
    assert hashed.startswith("$argon2id$")

    # Verification success
    assert verify_password(raw_password, hashed) is True

    # Verification failure on wrong password
    assert verify_password("WrongPassword123!", hashed) is False


def test_jwt_creation_and_decoding() -> None:
    user_id = "user_12345"
    token = create_access_token(subject=user_id, expires_delta=timedelta(minutes=15))

    assert isinstance(token, str)
    assert len(token) > 0

    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert "exp" in payload
    assert "iat" in payload


def test_jwt_expired_token() -> None:
    user_id = "user_expired"
    # Create token expired 1 minute ago
    token = create_access_token(subject=user_id, expires_delta=timedelta(minutes=-1))

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_jwt_malformed_token() -> None:
    with pytest.raises(jwt.PyJWTError):
        decode_access_token("invalid.malformed.jwt_token")
