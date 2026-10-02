"""
DecisionOS — Decision Replay MongoDB Document Models

Stores historical decisions and simulated counterfactual replay sessions.
Clearly separates empirical historical reality from simulated counterfactual branches.
Conforms strictly to docs/API_CONTRACT.md section 5 and frontend types/replay-workspace.ts.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class CounterfactualBranchModel(BaseModel):
    """A counterfactual alternative branch for a historical decision."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    description: str
    action_taken: str = ""
    historical_outcome_value: float = 0.0
    counterfactual_outcome_value: float = 0.0
    delta_value: float = 0.0
    variance_explanation: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "description": self.description,
            "actionTaken": self.action_taken,
            "action_taken": self.action_taken,
            "historicalOutcomeValue": self.historical_outcome_value,
            "historical_outcome_value": self.historical_outcome_value,
            "counterfactualOutcomeValue": self.counterfactual_outcome_value,
            "counterfactual_outcome_value": self.counterfactual_outcome_value,
            "deltaValue": self.delta_value,
            "delta_value": self.delta_value,
            "varianceExplanation": self.variance_explanation,
            "variance_explanation": self.variance_explanation,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CounterfactualBranchModel":
        return cls(
            id=str(data.get("id", "")),
            label=str(data.get("label", "")),
            description=str(data.get("description", "")),
            action_taken=str(data.get("actionTaken") or data.get("action_taken", "")),
            historical_outcome_value=float(data.get("historicalOutcomeValue") or data.get("historical_outcome_value", 0.0)),
            counterfactual_outcome_value=float(data.get("counterfactualOutcomeValue") or data.get("counterfactual_outcome_value", 0.0)),
            delta_value=float(data.get("deltaValue") or data.get("delta_value", 0.0)),
            variance_explanation=str(data.get("varianceExplanation") or data.get("variance_explanation", "")),
        )


class HistoricalDecisionDocument(BaseModel):
    """
    Represents an empirical historical decision stored in 'historical_decisions'.

    Fields:
        id (str):                UUID or identifier (e.g. hist_dec_1).
        code (str):              e.g. DEC-2026-MKT-018.
        organization_id (str):   Tenant isolation.
        business_id (str):       Business workspace.
        title (str):             Decision title.
        date (str):              ISO date string of original decision.
        action_taken (str):      What action was actually taken.
        owner (str):             Owner / Executive responsible.
        approvers (list):        Stakeholders who approved.
        constraint (str):        Key business constraint in effect.
        reason (str):            Strategic rationale given at the time.
        status (str):            e.g. "executed" | "approved".
        historical_metrics (dict): Empirical outcome metrics recorded.
        available_branches (list): Counterfactual alternatives that could have been chosen.
        created_at (datetime):   Timestamp of record creation.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique decision ID")
    code: str
    organization_id: str
    business_id: str
    title: str
    date: str
    action_taken: str
    owner: str = "Chief Strategy & Operating Officer"
    approvers: list[str] = Field(default_factory=lambda: ["Chief Executive Officer", "VP Growth"])
    constraint: str = "Working capital ceiling ≤ ₹3.5 Cr"
    reason: str = "Quarterly acquisition volume acceleration"
    status: str = "executed"
    historical_metrics: dict[str, float] = Field(default_factory=dict)
    available_branches: list[CounterfactualBranchModel] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def decisionId(self) -> str:
        return self.id

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def actionTaken(self) -> str:
        return self.action_taken

    def to_mongo(self) -> dict[str, Any]:
        return {
            "_id": self.id,
            "decisionId": self.id,
            "decision_id": self.id,
            "code": self.code,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "title": self.title,
            "date": self.date,
            "action_taken": self.action_taken,
            "actionTaken": self.action_taken,
            "owner": self.owner,
            "approvers": self.approvers,
            "constraint": self.constraint,
            "reason": self.reason,
            "status": self.status,
            "historical_metrics": self.historical_metrics,
            "historicalMetrics": self.historical_metrics,
            "available_branches": [b.to_dict() for b in self.available_branches],
            "availableBranches": [b.to_dict() for b in self.available_branches],
            "created_at": self.created_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "HistoricalDecisionDocument":
        branches_raw = doc.get("available_branches") or doc.get("availableBranches") or []
        return cls(
            id=str(doc.get("_id") or doc.get("decisionId") or doc.get("decision_id")),
            code=str(doc.get("code", "DEC-0000")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            title=str(doc.get("title", "")),
            date=str(doc.get("date", "")),
            action_taken=str(doc.get("action_taken") or doc.get("actionTaken", "")),
            owner=str(doc.get("owner", "Chief Strategy & Operating Officer")),
            approvers=doc.get("approvers") or ["Chief Executive Officer"],
            constraint=str(doc.get("constraint", "")),
            reason=str(doc.get("reason", "")),
            status=str(doc.get("status", "executed")),
            historical_metrics=doc.get("historical_metrics") or doc.get("historicalMetrics") or {},
            available_branches=[CounterfactualBranchModel.from_dict(b) for b in branches_raw if isinstance(b, dict)],
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
        )


class ReplaySessionDocument(BaseModel):
    """
    Persisted replay simulation run storing actual vs counterfactual comparison.
    Explicitly tags results as simulated.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique replay session ID")
    decision_id: str
    branch_id: str
    organization_id: str
    business_id: str
    is_simulated: bool = True
    disclaimer: str = (
        "Counterfactual outcome is an algorithmic simulation grounded in historical elasticity. "
        "It represents an estimate and does not guarantee that this outcome definitely would have occurred."
    )
    selected_branch: CounterfactualBranchModel
    actual_metrics: dict[str, Any]
    counterfactual_metrics: dict[str, Any]
    metrics_comparison: list[dict[str, Any]]
    actual_timeline: list[dict[str, Any]]
    counterfactual_timeline: list[dict[str, Any]]
    insight: dict[str, Any]
    uncertainty: dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_mongo(self) -> dict[str, Any]:
        return {
            "_id": self.id,
            "replayId": self.id,
            "decision_id": self.decision_id,
            "decisionId": self.decision_id,
            "branch_id": self.branch_id,
            "branchId": self.branch_id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "is_simulated": self.is_simulated,
            "isSimulated": self.is_simulated,
            "disclaimer": self.disclaimer,
            "selected_branch": self.selected_branch.to_dict(),
            "selectedBranch": self.selected_branch.to_dict(),
            "actual_metrics": self.actual_metrics,
            "counterfactual_metrics": self.counterfactual_metrics,
            "metrics_comparison": self.metrics_comparison,
            "metricsComparison": self.metrics_comparison,
            "actual_timeline": self.actual_timeline,
            "counterfactual_timeline": self.counterfactual_timeline,
            "insight": self.insight,
            "uncertainty": self.uncertainty,
            "created_at": self.created_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "ReplaySessionDocument":
        branch_raw = doc.get("selected_branch") or doc.get("selectedBranch") or {}
        return cls(
            id=str(doc.get("_id") or doc.get("replayId")),
            decision_id=str(doc.get("decision_id") or doc.get("decisionId")),
            branch_id=str(doc.get("branch_id") or doc.get("branchId")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            is_simulated=bool(doc.get("is_simulated", True)),
            disclaimer=str(doc.get("disclaimer", "")),
            selected_branch=CounterfactualBranchModel.from_dict(branch_raw) if isinstance(branch_raw, dict) else CounterfactualBranchModel(id="default", label="Default", description=""),
            actual_metrics=doc.get("actual_metrics") or {},
            counterfactual_metrics=doc.get("counterfactual_metrics") or {},
            metrics_comparison=doc.get("metrics_comparison") or doc.get("metricsComparison") or [],
            actual_timeline=doc.get("actual_timeline") or [],
            counterfactual_timeline=doc.get("counterfactual_timeline") or [],
            insight=doc.get("insight") or {},
            uncertainty=doc.get("uncertainty") or {},
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
        )
