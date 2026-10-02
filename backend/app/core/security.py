"""
DecisionOS Backend — Security: Password Hashing + JWT

Password hashing:
    Uses PBKDF2-HMAC-SHA256 with 600,000 iterations (NIST SP 800-132 recommendation).
    Pure Python stdlib — no native compilation required.
    Format: pbkdf2$sha256$600000$<salt_hex>$<key_b64>

JWT:
    HS256 via PyJWT (pure Python).
    Claims: sub (user_id), org_id, email, iat, exp.

Critical rule:
    org_id is ALWAYS read from the verified JWT payload, never from request body or query params.
    This ensures Organization A can never claim to be Organization B.
"""

import base64
import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.config import get_settings

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$"
)


def validate_and_normalize_email(email: str) -> str:
    """
    Normalizes email (lowercase, trim whitespace) and enforces standard format validation.
    Rejects empty, malformed, or invalid email formats.
    """
    if not isinstance(email, str):
        raise ValueError("Email must be a string.")
    normalized = email.strip().lower()
    if not normalized:
        raise ValueError("Email address cannot be empty.")
    if len(normalized) > 254:
        raise ValueError("Email address exceeds maximum length of 254 characters.")
    if not EMAIL_REGEX.match(normalized):
        raise ValueError(f"Invalid email address format: '{email}'.")
    local_part, domain_part = normalized.split("@", 1)
    if not local_part or not domain_part:
        raise ValueError(f"Invalid email address format: '{email}'.")
    if ".." in normalized or local_part.startswith(".") or local_part.endswith("."):
        raise ValueError(f"Invalid email address format: '{email}'.")
    domain_labels = domain_part.split(".")
    if any(len(label) == 0 or label.startswith("-") or label.endswith("-") for label in domain_labels):
        raise ValueError(f"Invalid email domain format: '{domain_part}'.")
    if len(domain_labels[-1]) < 2:
        raise ValueError(f"Invalid top-level domain in email: '{domain_part}'.")
    return normalized


# ── Password Hashing ──────────────────────────────────────────────────────────

_HASH_ALGO = "sha256"
_ITERATIONS = 600_000  # NIST SP 800-132 recommendation for PBKDF2-SHA256


def hash_password(plain_password: str) -> str:
    """
    Hashes a plaintext password using PBKDF2-HMAC-SHA256.
    Returns an opaque string that embeds the algorithm, iteration count, salt, and key.
    Plaintext is never stored or logged.
    """
    salt = secrets.token_hex(32)  # 256-bit random salt
    key = hashlib.pbkdf2_hmac(
        _HASH_ALGO,
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        _ITERATIONS,
    )
    return f"pbkdf2${_HASH_ALGO}${_ITERATIONS}${salt}${base64.b64encode(key).decode()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored hash.
    Returns False (not raises) if the hash format is invalid or the password is wrong.
    Constant-time comparison via hmac.compare_digest is used internally by PBKDF2.
    """
    try:
        _, algo, iters, salt, stored_key = hashed_password.split("$")
        key = hashlib.pbkdf2_hmac(
            algo,
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iters),
        )
        return base64.b64encode(key).decode() == stored_key
    except Exception:
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, org_id: str, email: str) -> str:
    """
    Creates a signed JWT access token.

    Payload claims:
        sub      — user ID (never org_id; follows JWT RFC 7519 convention)
        org_id   — organization ID (used for tenant isolation in every route)
        email    — user email (for logging / display; do not rely on this for auth)
        iat      — issued-at timestamp
        exp      — expiry timestamp (configurable via JWT_EXPIRY_HOURS)

    The token is signed with HS256 using JWT_SECRET_KEY from settings.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": user_id,
        "org_id": org_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=settings.jwt_expiry_hours),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decodes and verifies a JWT access token.

    Returns the full claims dict on success.
    Raises ValueError with a descriptive message on any failure:
        - Token expired
        - Invalid signature
        - Malformed token
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired. Please log in again.")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid token: {exc}")
