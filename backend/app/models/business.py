"""
DecisionOS — Business Workspace MongoDB Document Model

A Business workspace represents an organization's business profile and operating context.
It is strictly scoped to an organization_id for multi-tenant isolation.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class BusinessDocument(BaseModel):
    """
    Represents a Business Workspace document stored in the 'businesses' MongoDB collection.

    Fields:
        id (str):               UUID string used as MongoDB _id.
        organization_id (str):  FK -> organizations._id (Root tenant isolation).
        business_name (str):    Name of the business (e.g. "UrbanCart").
        industry (str):         Industry sector (e.g. "E-Commerce", "Retail", "Manufacturing").
        currency (str):         Operational currency code (default "INR").
        timezone (str):         Operational timezone (default "Asia/Kolkata").
        created_at (datetime):  UTC timestamp of creation.
        updated_at (datetime):  UTC timestamp of last update.
    """

    id: str = Field(..., description="UUID string - used as MongoDB _id")
    organization_id: str
    business_name: str
    industry: str
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def businessId(self) -> str:
        return self.id

    @property
    def business_id(self) -> str:
        return self.id

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessName(self) -> str:
        return self.business_name

    @property
    def createdAt(self) -> datetime:
        return self.created_at

    @property
    def updatedAt(self) -> datetime:
        return self.updated_at

    def to_mongo(self) -> dict:
        """Converts to MongoDB document format (maps id -> _id, includes aliases)."""
        return {
            "_id": self.id,
            "businessId": self.id,
            "business_id": self.id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_name": self.business_name,
            "businessName": self.business_name,
            "industry": self.industry,
            "currency": self.currency,
            "timezone": self.timezone,
            "created_at": self.created_at,
            "createdAt": self.created_at,
            "updated_at": self.updated_at,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "BusinessDocument":
        """Constructs a BusinessDocument from a raw MongoDB document."""
        return cls(
            id=str(doc.get("_id") or doc.get("businessId") or doc.get("business_id")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_name=doc.get("business_name") or doc.get("businessName") or "",
            industry=doc.get("industry", "General"),
            currency=doc.get("currency", "INR"),
            timezone=doc.get("timezone", "Asia/Kolkata"),
            created_at=doc.get("created_at") or doc.get("createdAt") or datetime.now(timezone.utc),
            updated_at=doc.get("updated_at") or doc.get("updatedAt") or datetime.now(timezone.utc),
        )
