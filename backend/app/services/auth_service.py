"""
DecisionOS — Authentication Service

All auth business logic lives here — routes only handle HTTP concerns.
The service receives a database handle injected by FastAPI deps; it never
creates its own connection.

Organization isolation design:
    - Every User document contains an organization_id.
    - Every query against user-owned resources in future services MUST filter by organization_id.
    - The organization_id is stamped at signup and included in the JWT.
    - No route ever reads organization_id from the request body/params for auth decisions.
"""

import logging
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import get_settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.organization import OrganizationDocument
from app.models.user import UserDocument
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    UpdateProfileRequest,
    TokenResponse,
    UserResponse,
)

logger = logging.getLogger(__name__)

# ── MongoDB collection names ───────────────────────────────────────────────────
USERS_COLLECTION = "users"
ORGS_COLLECTION = "organizations"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_user_response(user: UserDocument, org_name: str) -> UserResponse:
    """Maps a UserDocument to the safe API response (no password_hash)."""
    return UserResponse(
        id=user.id,
        userId=user.id,
        email=user.email,
        first_name=user.first_name,
        firstName=user.first_name,
        last_name=user.last_name,
        lastName=user.last_name,
        full_name=user.name,
        fullName=user.name,
        role=user.role,
        title=user.title,
        department=user.department,
        organization_id=user.organization_id,
        organizationId=user.organization_id,
        organization_name=org_name,
        organizationName=org_name,
        status=user.status,
        created_at=user.created_at,
        createdAt=user.created_at,
        last_login_at=user.last_login_at,
        lastLoginAt=user.last_login_at,
    )


# ── Service functions ─────────────────────────────────────────────────────────

async def signup(db: AsyncIOMotorDatabase, request: SignupRequest) -> TokenResponse:
    """
    Creates a new Organization and its first User atomically.

    Steps:
        1. Check email uniqueness (case-insensitive — emails normalized to lowercase).
        2. Create Organization document.
        3. Create User document with hashed password and organization_id.
        4. Issue JWT containing user_id and org_id.

    Raises:
        ValueError: If email is already registered.
    """
    org_name = request.get_organization_name()

    # 1. Check email uniqueness
    existing = await db[USERS_COLLECTION].find_one({"email": request.email})
    if existing:
        raise ValueError(f"Email '{request.email}' is already registered.")

    # 2. Create Organization
    org = OrganizationDocument(
        id=str(uuid.uuid4()),
        name=org_name,
    )
    await db[ORGS_COLLECTION].insert_one(org.to_mongo())
    logger.info("Organization created: id=%s name=%s", org.id, org.name)

    # 3. Create User (first user in an org is admin)
    user = UserDocument(
        id=str(uuid.uuid4()),
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        organization_id=org.id,
        role="admin",
        created_at=datetime.now(timezone.utc),
    )
    await db[USERS_COLLECTION].insert_one(user.to_mongo())
    logger.info("User created: id=%s email=%s org=%s", user.id, user.email, org.id)

    # 4. Issue token
    settings = get_settings()
    token = create_access_token(user.id, org.id, user.email)

    return TokenResponse(
        access_token=token,
        expires_in_hours=settings.jwt_expiry_hours,
        user=_build_user_response(user, org.name),
    )


async def login(db: AsyncIOMotorDatabase, request: LoginRequest) -> TokenResponse:
    """
    Authenticates a user with email + password.

    Steps:
        1. Find user by email (case-insensitive).
        2. Verify password against stored PBKDF2 hash.
        3. Update last_login_at timestamp.
        4. Issue JWT.

    Raises:
        ValueError: If credentials are invalid (vague on purpose — no email enumeration).
    """
    # 1. Find user
    doc = await db[USERS_COLLECTION].find_one({"email": request.email})
    if not doc:
        # Deliberate vague error — prevents email enumeration
        raise ValueError("Invalid email or password.")

    user = UserDocument.from_mongo(doc)

    # 2. Verify password
    if not verify_password(request.password, user.password_hash):
        raise ValueError("Invalid email or password.")

    # 3. Update last_login_at
    now = datetime.now(timezone.utc)
    await db[USERS_COLLECTION].update_one(
        {"_id": user.id},
        {"$set": {"last_login_at": now}},
    )
    user.last_login_at = now

    # 4. Fetch org name for response
    org_doc = await db[ORGS_COLLECTION].find_one({"_id": user.organization_id})
    org_name = org_doc["name"] if org_doc else "Unknown Organization"

    # 5. Issue token
    settings = get_settings()
    token = create_access_token(user.id, user.organization_id, user.email)

    logger.info("User logged in: id=%s email=%s", user.id, user.email)

    return TokenResponse(
        access_token=token,
        expires_in_hours=settings.jwt_expiry_hours,
        user=_build_user_response(user, org_name),
    )


async def get_me(db: AsyncIOMotorDatabase, user_id: str) -> UserResponse:
    """
    Returns the authenticated user's profile.
    user_id is sourced exclusively from the verified JWT — never from the request.

    Raises:
        ValueError: If the user no longer exists (e.g., account deleted after token issued).
    """
    doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
    if not doc:
        raise ValueError("Authenticated user account not found.")

    user = UserDocument.from_mongo(doc)

    org_doc = await db[ORGS_COLLECTION].find_one({"_id": user.organization_id})
    org_name = org_doc["name"] if org_doc else "Unknown Organization"

    return _build_user_response(user, org_name)


async def update_profile(
    db: AsyncIOMotorDatabase,
    user_id: str,
    request: UpdateProfileRequest,
) -> UserResponse:
    """
    Updates editable profile fields for the authenticated user only.
    Enforces that user_id is the authenticated user and cannot modify other users or org_id.
    """
    doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
    if not doc:
        raise ValueError("Authenticated user account not found.")

    user = UserDocument.from_mongo(doc)

    updates: dict = {}

    # Handle full name / first + last name
    new_name = request.fullName or request.name
    if not new_name and (request.firstName is not None or request.lastName is not None or request.first_name is not None or request.last_name is not None):
        first = request.firstName if request.firstName is not None else (request.first_name if request.first_name is not None else user.first_name)
        last = request.lastName if request.lastName is not None else (request.last_name if request.last_name is not None else user.last_name)
        new_name = f"{first} {last}".strip()

    if new_name is not None and new_name.strip():
        updates["name"] = new_name.strip()

    if request.title is not None:
        updates["title"] = request.title.strip()

    if request.department is not None:
        updates["department"] = request.department.strip()

    if updates:
        await db[USERS_COLLECTION].update_one(
            {"_id": user_id},
            {"$set": updates},
        )
        # Fetch updated doc
        doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
        user = UserDocument.from_mongo(doc)

    org_doc = await db[ORGS_COLLECTION].find_one({"_id": user.organization_id})
    org_name = org_doc["name"] if org_doc else "Unknown Organization"

    return _build_user_response(user, org_name)

