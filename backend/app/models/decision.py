"""
DecisionOS — Decision Registry & Audit MongoDB Document Models

Stores decision governance records, human approval lifecycles, modifications,
rejections, audit timeline events, and cross-phase provenance links with
strict multi-tenant organization isolation.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionAuditEventDocument(BaseModel):
    """Immutable audit trail event recording human governance actions."""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id", description="Unique audit event ID")
    organization_id: str = Field(..., description="Multi-tenant boundary")
    decision_id: str = Field(..., description="Target decision ID")
    actor: str = Field(..., description="User or role executing the action")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    action: str = Field(..., description="'generated' | 'review' | 'approved' | 'modified' | 'rejected' | 'recorded'")
    details: dict[str, Any] = Field(default_factory=dict, description="Audit event metadata and payload diffs")

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def decisionId(self) -> str:
        return self.decision_id

    def to_mongo(self) -> dict[str, Any]:
        d = self.model_dump(by_alias=False)
        d["_id"] = self.id
        return d

    @classmethod
    def from_mongo(cls, data: dict[str, Any]) -> "DecisionAuditEventDocument":
        d = dict(data)
        if "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        return cls(**d)


class DecisionRegistryDocument(BaseModel):
    """Represents a decision item in the executive Decision Registry."""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id", description="Unique decision ID, e.g. dec_2026_mkt_018")
    code: str = Field(..., description="Human-readable decision reference code, e.g. DEC-2026-MKT-018")
    organization_id: str = Field(..., description="Tenant organization ID")
    business_id: str = Field(..., description="Business workspace ID")
    dataset_id: str = Field(default="", description="FK -> datasets._id. Scopes this decision to the dataset that generated it.")
    title: str = Field(..., description="Decision title")
    source: str = Field(default="optimization", description="'optimization' | 'scenario' | 'replay' | 'investigation' | 'manual'")
    objective: str = Field(default="Maximize Gross Profit", description="Target objective")
    impact: str = Field(default="+₹3.6 Cr Gross Profit", description="Projected financial impact")
    impact_num: float = Field(default=3.6)
    confidence: float = Field(default=88.0, description="Confidence score (0-100)")
    status: str = Field(default="proposed", description="'proposed' | 'under_review' | 'approved' | 'modified' | 'rejected' | 'recorded'")
    priority: str = Field(default="high", description="'critical' | 'high' | 'medium' | 'low'")
    owner: str = Field(default="Chief Strategy & Operating Officer")
    summary: str = Field(default="", description="Executive summary of the proposal")
    recommendation: dict[str, Any] = Field(default_factory=dict)
    comparisons: list[dict[str, Any]] = Field(default_factory=list)
    constraints: list[dict[str, Any]] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    confidence_details: dict[str, Any] = Field(default_factory=dict)
    audit_timeline: list[dict[str, Any]] = Field(default_factory=list)
    provenance: dict[str, Any] = Field(default_factory=dict)
    modified_config: Optional[dict[str, Any]] = None
    rejection_details: Optional[dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def modifiedConfig(self) -> Optional[dict[str, Any]]:
        return self.modified_config

    @property
    def rejectionDetails(self) -> Optional[dict[str, Any]]:
        return self.rejection_details

    def to_mongo(self) -> dict[str, Any]:
        d = self.model_dump(by_alias=False)
        d["_id"] = self.id
        return d

    @classmethod
    def from_mongo(cls, data: dict[str, Any]) -> "DecisionRegistryDocument":
        d = dict(data)
        if "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        return cls(**d)
