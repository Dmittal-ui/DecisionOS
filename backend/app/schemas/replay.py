"""
DecisionOS — Decision Replay API Schemas

Pydantic schemas conforming to docs/API_CONTRACT.md section 5 and
frontend types/replay-workspace.ts.

CRITICAL ARCHITECTURAL GUARANTEE:
All counterfactual results are explicitly tagged as simulated.
The system does NOT claim simulated outcomes definitely would have occurred.
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class CounterfactualBranchSchema(BaseModel):
    """Available alternative path for a past decision."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    description: str
    actionTaken: Optional[str] = None
    historicalOutcomeValue: Optional[float] = None
    counterfactualOutcomeValue: Optional[float] = None
    deltaValue: Optional[float] = None
    varianceExplanation: Optional[str] = None


class HistoricalDecisionResponse(BaseModel):
    """Historical decision with recorded outcome and available counterfactual branches."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    code: str
    title: str
    date: str
    actionTaken: str
    owner: str = "Chief Strategy & Operating Officer"
    approvers: list[str] = Field(default_factory=list)
    constraint: str = ""
    reason: str = ""
    status: str = "executed"
    availableBranches: list[CounterfactualBranchSchema] = Field(default_factory=list)


class TimelineMetricChangeSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: str
    value: str
    direction: str = "positive"  # positive | negative | neutral


class TimelineBranchStepSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    periodLabel: str
    date: str
    eventTitle: str
    explanation: str
    metricChanges: list[TimelineMetricChangeSchema] = Field(default_factory=list)
    statusVariant: str = "neutral"  # neutral | warning | positive | critical


class ReplayMetricComparisonSchema(BaseModel):
    """Side-by-side actual vs counterfactual recalculation."""
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    actualValue: str
    counterfactualValue: str
    delta: str
    deltaType: str = "positive"  # positive | negative | neutral
    actualNum: float
    counterfactualNum: float
    unit: str
    explanation: Optional[str] = None


class CounterfactualInsightSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    headline: str
    summary: str
    revenueDiff: str
    profitDiff: str
    marginDiff: str
    whatChangedExplanation: str


class ReplayUncertaintySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    confidenceScore: float
    explanation: str
    ranges: list[dict[str, str]] = Field(default_factory=list)


class ReplayWorkspaceResponse(BaseModel):
    """
    Complete Replay Workspace comparing empirical history against simulated counterfactual.
    """
    model_config = ConfigDict(populate_by_name=True)

    decision: HistoricalDecisionResponse
    selectedBranchId: str
    decisionPoint: dict[str, str]
    actualTimeline: list[TimelineBranchStepSchema] = Field(default_factory=list)
    counterfactualTimeline: list[TimelineBranchStepSchema] = Field(default_factory=list)
    metrics: list[ReplayMetricComparisonSchema] = Field(default_factory=list)
    insight: CounterfactualInsightSchema
    evidence: dict[str, Any] = Field(default_factory=dict)
    uncertainty: ReplayUncertaintySchema
    isSimulated: bool = Field(True, description="Strictly flags result as counterfactual simulation")
    disclaimer: str = Field(
        "Simulated counterfactual projection based on historical telemetry elasticity models. "
        "Does not guarantee absolute historical occurrence.",
        description="Epistemic disclaimer",
    )


class ReplaySimulationRequest(BaseModel):
    """Request to simulate a counterfactual branch on a past decision."""
    model_config = ConfigDict(populate_by_name=True)

    decisionId: Optional[str] = None
    decision_id: Optional[str] = None
    branchId: Optional[str] = "branch_reallocate"
    branch_id: Optional[str] = None
    counterfactualConfig: Optional[dict[str, Any]] = None
