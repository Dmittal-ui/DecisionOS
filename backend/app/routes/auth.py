"""
DecisionOS Backend — Authentication Routes

POST /api/auth/signup  — Create organization + first user
POST /api/auth/login   — Authenticate, return JWT
GET  /api/auth/me      — Return current user (requires Bearer token)

Error handling:
    ValueError from service layer → HTTP 400 (bad request / business rule)
    Duplicate email              → HTTP 409 Conflict
    Invalid credentials          → HTTP 401 Unauthorized
    Missing / bad token          → HTTP 401 (handled by get_current_user dep)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user, AuthContext
from app.database.mongodb import get_database
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    UpdateProfileRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import ApiResponse
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create account and organization",
    description=(
        "Creates a new Organization and its first User (admin role). "
        "Returns a signed JWT access token. "
        "Email must be unique across the entire system."
    ),
)
@router.post(
    "/register",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def signup(
    request: SignupRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[TokenResponse]:
    try:
        token_response = await auth_service.signup(db, request)
        return ApiResponse(
            success=True,
            data=token_response,
            message=f"Account created. Welcome to DecisionOS, {token_response.user.first_name}!",
        )
    except ValueError as exc:
        # Duplicate email
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": str(exc),
            },
        )


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    summary="Authenticate and receive JWT",
    description=(
        "Validates email and password. Returns a signed JWT access token. "
        "Use the token as: Authorization: Bearer <token> on all protected endpoints."
    ),
)
async def login(
    request: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[TokenResponse]:
    try:
        token_response = await auth_service.login(db, request)
        return ApiResponse(
            success=True,
            data=token_response,
            message="Login successful.",
        )
    except ValueError:
        # Deliberately vague — prevents email enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Invalid email or password.",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=ApiResponse[UserResponse],
    summary="Get current authenticated user",
    description=(
        "Returns the profile of the currently authenticated user. "
        "Requires a valid Bearer token in the Authorization header. "
        "The user identity is determined from the JWT — not from any request parameter."
    ),
)
async def get_me(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[UserResponse]:
    try:
        user_response = await auth_service.get_me(db, auth.user_id)
        return ApiResponse(
            success=True,
            data=user_response,
            message="User profile retrieved.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": str(exc),
            },
        )


@router.patch(
    "/me",
    response_model=ApiResponse[UserResponse],
    summary="Update current authenticated user profile",
    description=(
        "Updates editable fields for the currently authenticated user. "
        "The user identity is enforced from the JWT — users can only update their own profile."
    ),
)
@router.put(
    "/me",
    response_model=ApiResponse[UserResponse],
    include_in_schema=False,
)
async def update_me(
    request: UpdateProfileRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[UserResponse]:
    try:
        user_response = await auth_service.update_profile(db, auth.user_id, request)
        return ApiResponse(
            success=True,
            data=user_response,
            message="User profile updated successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "BAD_REQUEST",
                "message": str(exc),
            },
        )

