"""
DecisionOS — Investigation API Schemas

Pydantic schemas for the Investigation Workspace conforming to
docs/API_CONTRACT.md section 4 and frontend types/investigation-workspace.ts.

Ensures strict architectural separation between:
- Observed empirical evidence (factual observations from data)
- Competing hypotheses (probabilistic structural explanations)
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.opportunity import OpportunitySignalSchema


class InvestigationEvidenceSchema(BaseModel):
    """
    Factual evidence item observed directly in commercial telemetry.
    Strictly separated from hypotheses.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str
    description: str
    metric: Optional[str] = None
    value: Optional[str] = None
    direction: str = Field("supporting", description="supporting | contradicting | neutral")
    strength: str = Field("high", description="high | medium | low")
    source: Optional[str] = Field(None, description="e.g. Paid Channel Telemetry, ERP Feed")


class InvestigationHypothesisSchema(BaseModel):
    """
    A competing structural explanation evaluated against evidence.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str = Field("A", description="Letter identifier: A, B, C")
    title: str
    statement: str
    description: Optional[str] = None
    confidenceScore: float = Field(..., description="0 to 100 confidence score")
    status: str = Field("under_investigation", description="leading | strong_evidence | moderate_evidence | weak_evidence")
    rank: int = 1
    evidenceCount: int = 0
    evidenceItems: list[InvestigationEvidenceSchema] = Field(default_factory=list)
    affectedMetrics: list[str] = Field(default_factory=list)
    supportingSignals: list[str] = Field(default_factory=list)
    contradictingSignals: list[str] = Field(default_factory=list)


class InvestigationTreeNodeSchema(BaseModel):
    """Hierarchical decision tree node for root-cause diagnosis."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    type: str = Field("decision", description="root | decision | leaf | root_cause_candidate")
    status: str = Field("active", description="root | active | supporting | conflicting | neutral | root_cause_candidate")
    metric: Optional[str] = None
    value: Optional[str] = None
    confidenceScore: Optional[float] = None
    hypothesisId: Optional[str] = None
    evidenceIds: list[str] = Field(default_factory=list)
    description: Optional[str] = None
    children: list["InvestigationTreeNodeSchema"] = Field(default_factory=list)


# Enable recursive self-reference
InvestigationTreeNodeSchema.model_rebuild()


class InvestigationTimelineEventSchema(BaseModel):
    """Chronological event tracing anomaly timeline."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    time: str
    label: str
    description: Optional[str] = None
    type: str = Field("detection", description="detection | signal | hypothesis | comparison | ready")
    severity: Optional[str] = "high"


class InvestigationWorkspaceResponse(BaseModel):
    """
    Complete Investigation Workspace response.
    Returns:
    - opportunityContext
    - signals
    - hypotheses
    - evidence (distinct from hypotheses)
    - decisionTree / treeRoot
    - timeline
    - confidence / overallConfidence
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Investigation identifier")
    opportunityId: str = Field(..., description="Associated opportunity ID")
    opportunityCode: str = Field(..., description="Associated opportunity human-readable code")
    opportunityContext: dict[str, Any] = Field(default_factory=dict, description="Contextual opportunity summary")
    overallConfidence: float = Field(..., description="Overall confidence score (0 to 100)")
    confidence: float = Field(..., description="Alias for overallConfidence")
    summary: str = Field(..., description="Synthesized investigation summary")
    leadingHypothesisId: str = Field(..., description="ID of leading hypothesis")
    signals: list[OpportunitySignalSchema] = Field(default_factory=list, description="Observed anomaly signals")
    hypotheses: list[InvestigationHypothesisSchema] = Field(default_factory=list, description="Competing explanations")
    evidence: list[InvestigationEvidenceSchema] = Field(default_factory=list, description="Observed empirical evidence (distinct from hypotheses)")
    treeRoot: InvestigationTreeNodeSchema = Field(..., description="Root of diagnostic decision tree")
    decisionTree: InvestigationTreeNodeSchema = Field(..., description="Alias for treeRoot")
    timeline: list[InvestigationTimelineEventSchema] = Field(default_factory=list, description="Chronological timeline")
    status: str = Field("in_progress", description="open | in_progress | synthesizing | completed")
    startedAt: str = Field(..., description="ISO 8601 timestamp")
    updatedAt: str = Field(..., description="ISO 8601 timestamp")
