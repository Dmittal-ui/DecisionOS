"""
DecisionOS — FastAPI Shared Dependencies

Provides reusable dependency functions for:
1. get_current_user  — decodes JWT, returns AuthContext (user_id + org_id)
2. require_org_access — verifies a resource belongs to the authenticated user's org

Organization Isolation Rule (CRITICAL):
    org_id is ALWAYS taken from the verified JWT payload.
    It is NEVER taken from request body, query params, or path params.
    All future services (files, opportunities, decisions, DNA) MUST call
    require_org_access() before reading or mutating any org-scoped resource.

Usage in routes:
    async def my_route(
        auth: AuthContext = Depends(get_current_user),
        db: AsyncIOMotorDatabase = Depends(get_database)
    ):
        # auth.org_id is guaranteed to be the authenticated org
        require_org_access(auth, resource.organization_id)
        ...
"""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, Header, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import decode_access_token
from app.database.mongodb import get_database
from app.schemas.auth import AuthContext

logger = logging.getLogger(__name__)


def _extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Extracts the token string from an 'Authorization: Bearer <token>' header.
    Raises HTTP 401 if the header is missing or malformed.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Authorization header is missing. Include: Authorization: Bearer <token>",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Authorization header must be in format: Bearer <token>",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    return parts[1].strip()


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthContext:
    """
    FastAPI dependency: verifies the JWT from the Authorization header.

    Steps:
        1. Extract Bearer token from Authorization header.
        2. Decode and verify JWT signature + expiry.
        3. Return AuthContext with user_id and org_id from JWT claims.

    Returns AuthContext — org_id is guaranteed to be the authenticated tenant.
    Raises HTTP 401 on any failure.

    Note: We intentionally do NOT hit the database on every request
    (stateless JWT design). A database lookup is only needed if you need
    to verify the user still exists or hasn't been revoked — add that check
    in Phase 2+ if required. For now, the signed JWT is the source of truth.
    """
    token = _extract_bearer_token(authorization)

    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": str(exc),
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    org_id = payload.get("org_id")
    email = payload.get("email", "")

    if not user_id or not org_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Token is missing required claims (sub, org_id).",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthContext(user_id=user_id, org_id=org_id, email=email)


def require_org_access(auth: AuthContext, resource_org_id: str) -> None:
    """
    Organization isolation enforcement helper.

    Verifies that the authenticated user's organization matches the resource's organization.
    Call this in EVERY route that returns or mutates org-scoped data.

    Args:
        auth:             The AuthContext from get_current_user dependency.
        resource_org_id:  The organization_id stored on the resource being accessed.

    Raises:
        HTTP 403 Forbidden if the orgs do not match.

    Example:
        opportunity = await db.opportunities.find_one({"_id": opp_id})
        require_org_access(auth, opportunity["organization_id"])
        return opportunity  # safe to return — same org confirmed
    """
    if auth.org_id != resource_org_id:
        logger.warning(
            "Org isolation violation: user org=%s tried to access resource org=%s",
            auth.org_id,
            resource_org_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Access denied. This resource belongs to a different organization.",
            },
        )
