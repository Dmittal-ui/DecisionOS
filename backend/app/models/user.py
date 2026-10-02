"""
DecisionOS — User MongoDB Document Model

A User belongs to exactly one Organization.
password_hash is NEVER exposed in any API response.

Frontend User type alignment (types/user.ts):
    id, email, firstName/lastName (split from 'name'), role,
    organizationId, organizationName, status, createdAt, lastLoginAt
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class UserDocument(BaseModel):
    """
    Represents a User document as stored in the 'users' MongoDB collection.

    Fields:
        id (str):               UUID string used as MongoDB _id.
        name (str):             Full display name (e.g. "Alexandra Chen").
        email (str):            Unique login identifier. Always stored lowercase.
        password_hash (str):    PBKDF2-HMAC-SHA256 hash. NEVER logged or returned.
        organization_id (str):  FK → organizations._id. Controls data isolation.
        role (str):             One of executive|decision_analyst|operator|auditor|admin.
        title (str):            Job title (e.g. "Chief Revenue Officer").
        department (str):       Team or department name.
        status (str):           active|inactive|pending.
        created_at (datetime):  UTC creation timestamp.
        last_login_at:          UTC timestamp of last successful login (nullable).
    """

    id: str = Field(..., description="UUID string — used as MongoDB _id")
    name: str
    email: str
    password_hash: str
    organization_id: str
    role: str = "decision_analyst"
    title: str = ""
    department: str = ""
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None

    @property
    def userId(self) -> str:
        return self.id

    @property
    def user_id(self) -> str:
        return self.id

    @property
    def passwordHash(self) -> str:
        return self.password_hash

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def createdAt(self) -> datetime:
        return self.created_at

    @property
    def first_name(self) -> str:
        parts = self.name.strip().split(" ", 1)
        return parts[0] if parts else ""

    @property
    def last_name(self) -> str:
        parts = self.name.strip().split(" ", 1)
        return parts[1] if len(parts) > 1 else ""

    def to_mongo(self) -> dict:
        """Converts to MongoDB document format (maps id → _id, includes aliases)."""
        return {
            "_id": self.id,
            "userId": self.id,
            "user_id": self.id,
            "name": self.name,
            "email": self.email,
            "password_hash": self.password_hash,
            "passwordHash": self.password_hash,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "role": self.role,
            "title": self.title,
            "department": self.department,
            "status": self.status,
            "created_at": self.created_at,
            "createdAt": self.created_at,
            "last_login_at": self.last_login_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "UserDocument":
        """Constructs a UserDocument from a raw MongoDB document."""
        return cls(
            id=str(doc.get("_id") or doc.get("userId") or doc.get("user_id")),
            name=doc["name"],
            email=doc["email"],
            password_hash=doc.get("password_hash") or doc.get("passwordHash", ""),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            role=doc.get("role", "decision_analyst"),
            title=doc.get("title", ""),
            department=doc.get("department", ""),
            status=doc.get("status", "active"),
            created_at=doc.get("created_at") or doc.get("createdAt") or datetime.now(timezone.utc),
            last_login_at=doc.get("last_login_at") or doc.get("lastLoginAt"),
        )
