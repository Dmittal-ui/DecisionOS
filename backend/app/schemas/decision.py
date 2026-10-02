"""
DecisionOS — Decision Registry & Human Approval Schemas

Pydantic schemas conforming to docs/API_CONTRACT.md section 8,
frontend types/decision-registry.ts, and Phase 9 specifications.
"""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionComparisonItemSchema(BaseModel):
    """Before vs After comparison for a metric."""
    model_config = ConfigDict(populate_by_name=True)

    metric: str
    current: str
    recommended: str
    change: str
    changeType: str = "positive"  # positive | negative | neutral


class DecisionConstraintSchema(BaseModel):
    """Operational constraint state within a decision package."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    limit: str
    recommended: str
    slack: str
    status: str  # satisfied | violated | binding


class DecisionEvidenceItemSchema(BaseModel):
    """Evidence artifact attached to the decision."""
    model_config = ConfigDict(populate_by_name=True)

    title: str
    signal: str
    detail: str
    type: str = "efficiency"


class DecisionAuditTimelineItemSchema(BaseModel):
    """Timeline event in the decision audit trail."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    time: str
    timestamp: str
    event: str
    actor: str
    type: str = "review"  # generated | review | evidence | constraint | approved | modified | rejected | recorded


class DecisionProvenanceSchema(BaseModel):
    """Traceability links across all upstream DecisionOS phases."""
    model_config = ConfigDict(populate_by_name=True)

    opportunityId: str = ""
    investigationId: str = ""
    replayId: str = ""
    scenarioId: str = ""
    optimizerId: str = ""


class DecisionConfidenceDetailsSchema(BaseModel):
    """Detailed confidence breakdown and uncertainty bounds."""
    model_config = ConfigDict(populate_by_name=True)

    score: float
    highConfidenceSignals: int = 3
    supportingEvidence: int = 4
    constraintsVerified: int = 5
    totalConstraints: int = 5
    explanation: str = ""
    projectedProfitRange: str = ""
    projectedRevenueRange: str = ""
    uncertaintyExplanation: str = ""


class ModifiedConfigurationSchema(BaseModel):
    """Audit record of human configuration override."""
    model_config = ConfigDict(populate_by_name=True)

    marketingBudget: str
    workingInventory: str
    unitPrice: str
    modifiedAt: str
    modifiedBy: str
    notes: Optional[str] = None


class RejectionDetailsSchema(BaseModel):
    """Audit record of decision rejection."""
    model_config = ConfigDict(populate_by_name=True)

    reason: str
    notes: Optional[str] = None
    rejectedAt: str
    rejectedBy: str


class DecisionItemResponse(BaseModel):
    """Full decision registry item returned to API clients."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    code: str
    title: str
    source: str = "optimization"
    objective: str = "Maximize Gross Profit"
    impact: str
    impactNum: float
    confidence: float
    status: str
    priority: str = "high"
    owner: str
    createdAt: str
    updatedAt: str
    summary: str
    recommendation: dict[str, Any] = Field(default_factory=dict)
    comparisons: list[DecisionComparisonItemSchema] = Field(default_factory=list)
    constraints: list[DecisionConstraintSchema] = Field(default_factory=list)
    evidence: list[DecisionEvidenceItemSchema] = Field(default_factory=list)
    confidenceDetails: DecisionConfidenceDetailsSchema
    auditTimeline: list[DecisionAuditTimelineItemSchema] = Field(default_factory=list)
    provenance: DecisionProvenanceSchema
    modifiedConfig: Optional[ModifiedConfigurationSchema] = None
    rejectionDetails: Optional[RejectionDetailsSchema] = None


# ─────────────────────────────────────────────────────────────────────────────
# Request Bodies for Human Actions
# ─────────────────────────────────────────────────────────────────────────────

class ApproveDecisionRequest(BaseModel):
    """Payload for human stakeholder approval action."""
    model_config = ConfigDict(populate_by_name=True)

    approverName: str = Field(..., description="Full name of the authorized human stakeholder")
    approverRole: Optional[str] = Field(default="Authorized Approver", description="Role or title of approver")
    notes: Optional[str] = Field(default=None, description="Executive authorization notes or rationale")


class ModifyDecisionRequest(BaseModel):
    """Payload for human stakeholder override of decision variables."""
    model_config = ConfigDict(populate_by_name=True)

    modifiedBy: str = Field(..., description="Full name of the authorizing human modifier")
    marketingBudget: Optional[Any] = Field(default=None, description="Modified marketing budget (string or float)")
    workingInventory: Optional[Any] = Field(default=None, description="Modified working inventory (string or float)")
    unitPrice: Optional[Any] = Field(default=None, description="Modified unit price (string or float)")
    justification: Optional[str] = Field(default=None, description="Reason for configuration override")
    notes: Optional[str] = Field(default=None, description="Alternative field for notes")


class RejectDecisionRequest(BaseModel):
    """Payload for human stakeholder rejection action."""
    model_config = ConfigDict(populate_by_name=True)

    rejectedBy: str = Field(..., description="Full name of stakeholder rejecting proposal")
    reason: str = Field(..., description="Core business reason for rejection")
    notes: Optional[str] = Field(default=None, description="Additional context or remediation guidance")
