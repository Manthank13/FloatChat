from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.auth import AuthTokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    description="Registers a new user, hashes password with Argon2, creates database record, and issues a JWT access token.",
)
async def register(data: UserRegister) -> AuthTokenResponse:
    try:
        service = AuthService()
        return await service.register_user(data)
    except ValueError as exc:
        msg = str(exc)
        if "already registered" in msg or "already exists" in msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {str(exc)}",
        )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials against Argon2 password hash and returns a JWT access token.",
)
async def login(data: UserLogin) -> AuthTokenResponse:
    try:
        service = AuthService()
        return await service.login_user(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error authenticating user: {str(exc)}",
        )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
    description="Returns the profile information of the currently authenticated user.",
)
async def get_me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Stateless JWT logout endpoint. Informs frontend client to discard access token.",
)
async def logout() -> dict:
    return {
        "status": "logged_out",
        "message": "Successfully logged out. Client must discard local access token.",
        "note": "FloatChat JWTs are stateless. Discarding the token on the client completes logout.",
    }
