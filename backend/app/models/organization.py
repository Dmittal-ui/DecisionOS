"""
DecisionOS — Organization MongoDB Document Model

An Organization is the root tenant for all data isolation.
Every user, dataset, opportunity, and decision is scoped to an org_id.

Organization isolation rule:
    No query in any route ever omits the org_id filter.
    The org_id is always taken from the verified JWT, never from the client.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class OrganizationDocument(BaseModel):
    """
    Represents an Organization document as stored in the 'organizations' MongoDB collection.
    
    id (str):            Public-facing UUID string stored as MongoDB _id.
    name (str):          Organization display name.
    created_at:          UTC timestamp of creation.
    """

    id: str = Field(..., description="UUID string — used as MongoDB _id")
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def organizationId(self) -> str:
        return self.id

    @property
    def organization_id(self) -> str:
        return self.id

    @property
    def createdAt(self) -> datetime:
        return self.created_at

    def to_mongo(self) -> dict:
        """Converts to MongoDB document format (maps id → _id, includes aliases)."""
        return {
            "_id": self.id,
            "organizationId": self.id,
            "organization_id": self.id,
            "name": self.name,
            "created_at": self.created_at,
            "createdAt": self.created_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "OrganizationDocument":
        """Constructs an OrganizationDocument from a raw MongoDB document."""
        return cls(
            id=str(doc.get("_id") or doc.get("organizationId") or doc.get("organization_id")),
            name=doc["name"],
            created_at=doc.get("created_at") or doc.get("createdAt") or datetime.now(timezone.utc),
        )
