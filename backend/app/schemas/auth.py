"""
DecisionOS — Auth Request/Response Schemas

These are the API-surface Pydantic models for authentication endpoints.
They are DISTINCT from the MongoDB document models (app/models/):
    - Document models describe what's stored.
    - Schemas describe what goes in/out of the API.

password_hash is NEVER included in any response schema.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import validate_and_normalize_email


# ── Signup ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    """
    POST /api/auth/signup

    Creates a new organization and its first user (admin role).
    The organization name becomes the root tenant for all data isolation.
    Accepts organization_name or organizationName.
    """
    name: str = Field(..., min_length=2, max_length=100, description="Full name, e.g. 'Alexandra Chen'")
    email: str = Field(..., description="Login email — must be unique across the system")
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    organization_name: Optional[str] = None
    organizationName: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return validate_and_normalize_email(v)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    def get_organization_name(self) -> str:
        org = self.organization_name or self.organizationName
        if not org or len(str(org).strip()) < 2:
            raise ValueError("organization_name or organizationName is required (at least 2 characters)")
        return str(org).strip()


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """POST /api/auth/login"""
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return validate_and_normalize_email(v)


# ── Update Profile ────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    """
    PATCH /api/auth/me
    Payload for updating the currently authenticated user's profile.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    firstName: Optional[str] = Field(None, max_length=50)
    lastName: Optional[str] = Field(None, max_length=50)
    fullName: Optional[str] = Field(None, max_length=100)



# ── User Response (safe — no password_hash) ───────────────────────────────────

class UserResponse(BaseModel):
    """
    Safe user representation returned in all auth responses.
    Matches the frontend User interface in types/user.ts.
    password_hash is intentionally excluded.
    Supports both snake_case and camelCase field access.
    """
    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    role: str
    title: str = ""
    department: str = ""
    organization_id: str
    organization_name: str
    status: str = "active"
    created_at: datetime
    last_login_at: Optional[datetime] = None

    # camelCase aliases matching frontend and specification
    userId: Optional[str] = None
    organizationId: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    fullName: Optional[str] = None
    organizationName: Optional[str] = None
    createdAt: Optional[datetime] = None
    lastLoginAt: Optional[datetime] = None


# ── Token Response ─────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """
    Returned on successful signup or login.
    The access_token is a signed JWT (HS256).
    Frontend should store it and send it as: Authorization: Bearer <token>
    """
    access_token: str
    token: Optional[str] = None
    token_type: str = "bearer"
    expires_in_hours: int
    user: UserResponse

    def model_post_init(self, __context):
        if not self.token:
            self.token = self.access_token



# ── Auth Context (internal — decoded from JWT) ─────────────────────────────────

class AuthContext(BaseModel):
    """
    Decoded JWT claims attached to every authenticated request.
    Populated by the get_current_user dependency in app/api/deps.py.

    NEVER populated from request body or query params.
    Always decoded from the verified JWT signature.
    """
    user_id: str
    org_id: str
    email: str
