"""
DecisionOS — Decision DNA MongoDB Document Models

Stores immutable, auditable Decision DNA records preserving full context:
Problem Trigger → Investigation Root Cause → Counterfactual Alternatives →
Optimization Constraints → Human Action → Empirical Outcome → Continuous System Learning.
Strictly returns 'Outcome Pending' when actual post-execution telemetry has not yet elapsed.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionDNADocument(BaseModel):
    """Represents a permanent Decision DNA knowledge artifact in MongoDB."""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id", description="Unique Decision DNA ID, e.g. dna_2026_001")
    decision_id: str = Field(..., description="Target decision ID, e.g. dec_2026_mkt_018")
    organization_id: str = Field(..., description="Tenant organization ID")
    business_id: str = Field(..., description="Business workspace ID")
    dataset_id: str = Field(default="", description="FK -> datasets._id. Scopes this DNA to the dataset lineage.")
    title: str = Field(..., description="Decision title")
    type: str = Field(default="optimization", description="'optimization' | 'scenario' | 'replay' | 'investigation' | 'manual'")
    status: str = Field(default="recorded", description="'approved' | 'modified' | 'rejected' | 'outcome_pending' | 'recorded'")
    decision_date: str = Field(default="", description="ISO timestamp of human authorization")
    owner: str = Field(default="")  # populated from authenticated user; never defaults to a fabricated title
    organization: str = Field(default="")
    opportunity_id: str = Field(default="")
    trigger: dict[str, Any] = Field(default_factory=dict)
    business_question: str = Field(default="")
    summary: str = Field(default="")
    current_configuration: dict[str, Any] = Field(default_factory=dict)
    recommended_configuration: dict[str, Any] = Field(default_factory=dict)
    selected_configuration: dict[str, Any] = Field(default_factory=dict)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    alternatives: list[dict[str, Any]] = Field(default_factory=list)
    constraints: list[dict[str, Any]] = Field(default_factory=list)
    human_decision: dict[str, Any] = Field(default_factory=dict)
    expected_outcome: dict[str, Any] = Field(default_factory=dict)
    actual_outcome: dict[str, Any] = Field(
        default_factory=lambda: {
            "status": "pending",
            "explanation": "Outcome Pending",
            "summary": "Outcome Pending",
            "metrics": [],
        }
    )
    uncertainty: dict[str, Any] = Field(default_factory=dict)
    learning: dict[str, Any] = Field(
        default_factory=lambda: {
            "isAvailable": False,
            "whatWeExpected": "Outcome Pending",
            "whatHappened": "Outcome Pending",
            "whatWeLearned": "Outcome Pending",
            "nextTimeConsideration": "Awaiting empirical telemetry to close the feedback loop.",
        }
    )
    lineage: list[dict[str, Any]] = Field(default_factory=list)
    provenance: dict[str, Any] = Field(default_factory=dict)
    audit_events: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float = Field(default=88.0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def decisionId(self) -> str:
        return self.decision_id

    @property
    def opportunityId(self) -> str:
        return self.opportunity_id

    @property
    def humanDecision(self) -> dict[str, Any]:
        return self.human_decision

    @property
    def actualOutcome(self) -> dict[str, Any]:
        return self.actual_outcome

    def to_mongo(self) -> dict[str, Any]:
        d = self.model_dump(by_alias=False)
        d["_id"] = self.id
        return d

    @classmethod
    def from_mongo(cls, data: dict[str, Any]) -> "DecisionDNADocument":
        d = dict(data)
        if "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        return cls(**d)
