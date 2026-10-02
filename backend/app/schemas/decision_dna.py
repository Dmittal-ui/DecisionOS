"""
DecisionOS — Decision DNA API Schemas

Pydantic schemas conforming to docs/API_CONTRACT.md section 9,
frontend types/decision-dna.ts, and Phase 9 specifications.
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionTriggerSchema(BaseModel):
    """Problem trigger that initiated the decision journey."""
    model_config = ConfigDict(populate_by_name=True)

    problemTitle: str
    description: str
    detectedAt: str
    metricAlert: str
    opportunityId: str


class DecisionDNAEvidenceSchema(BaseModel):
    """Corroborating telemetry signal supporting the decision."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    signal: str
    detail: str
    metricImpact: str
    confidenceContribution: int = 14
    source: str
    timestamp: str
    type: str = "efficiency"


class DecisionAlternativeSchema(BaseModel):
    """Counterfactual option evaluated during simulation or optimization."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    description: str
    marketingBudget: str
    workingInventory: str
    unitPrice: str
    expectedRevenue: str
    expectedProfit: str
    expectedMargin: str
    constraintsSatisfied: bool
    confidence: float
    status: str  # selected | not_selected | rejected | considered
    rejectionReason: Optional[str] = None


class DecisionDNAConstraintSchema(BaseModel):
    """Operational constraint verified for the decision."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    rule: str
    requiredLimit: str
    selectedValue: str
    status: str  # satisfied | violated | binding
    slack: str


class DecisionDNAConfigurationSchema(BaseModel):
    """Parameter state configuration."""
    model_config = ConfigDict(populate_by_name=True)

    marketingBudget: str
    workingInventory: str
    unitPrice: str
    expectedRevenue: str
    expectedProfit: str
    expectedMargin: str
    orders: Optional[str] = None
    inventoryLevels: Optional[str] = None


class HumanDecisionRecordSchema(BaseModel):
    """Human authorization event record."""
    model_config = ConfigDict(populate_by_name=True)

    decisionMaker: str
    role: str
    action: str  # approved | modified | rejected
    decidedAt: str
    reason: str
    modificationDetails: Optional[dict[str, Any]] = None


class DecisionDNAOutcomeSchema(BaseModel):
    """
    Empirical outcome tracking.
    When post-implementation data is not yet elapsed, status is 'pending'
    and explanation is strictly 'Outcome Pending'.
    """
    model_config = ConfigDict(populate_by_name=True)

    status: str = "pending"  # achieved | partially_achieved | missed | pending
    recordedAt: Optional[str] = None
    explanation: str = "Outcome Pending"
    metrics: list[dict[str, Any]] = Field(default_factory=list)
    summary: str = "Outcome Pending"


class DecisionUncertaintyDetailsSchema(BaseModel):
    """Confidence bounds and key sensitivity drivers."""
    model_config = ConfigDict(populate_by_name=True)

    confidence: float
    baseCaseProfit: str
    downsideProfit: str
    upsideProfit: str
    revenueRange: str
    grossProfitRange: str
    keyDrivers: list[str] = Field(default_factory=list)


class DecisionDNALearningSchema(BaseModel):
    """Continuous system learning feedback loop."""
    model_config = ConfigDict(populate_by_name=True)

    isAvailable: bool = False
    whatWeExpected: str = "Outcome Pending"
    whatHappened: str = "Outcome Pending"
    whatWeLearned: str = "Outcome Pending"
    nextTimeConsideration: str = "Awaiting empirical telemetry to close the feedback loop."


class DecisionLineageNodeSchema(BaseModel):
    """Navigation node across the decision lifecycle."""
    model_config = ConfigDict(populate_by_name=True)

    stage: str
    id: str
    status: str = "completed"  # completed | active | bypassed
    timestamp: str
    route: str
    description: str


class DecisionDNAProvenanceSchema(BaseModel):
    """Cryptographically verifiable provenance metadata."""
    model_config = ConfigDict(populate_by_name=True)

    dnaId: str
    decisionId: str
    opportunityId: str
    investigationId: str
    replayId: str
    scenarioId: str
    optimizationId: str
    verifiedBy: str
    recordedAt: str
    integrityHash: Optional[str] = None


class DecisionDNAAuditEventSchema(BaseModel):
    """Chronological audit event in Decision DNA lineage."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    timestamp: str
    time: str
    actor: str
    event: str
    description: str
    type: str = "authorized"


class DecisionDNARecordResponse(BaseModel):
    """Complete Decision DNA package conforming to frontend and API contract."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    decisionId: str
    title: str
    type: str = "optimization"
    status: str
    createdAt: str
    decisionDate: str
    owner: str
    organization: str
    opportunityId: str
    trigger: DecisionTriggerSchema
    businessQuestion: str
    summary: str
    currentConfiguration: DecisionDNAConfigurationSchema
    recommendedConfiguration: DecisionDNAConfigurationSchema
    selectedConfiguration: DecisionDNAConfigurationSchema
    evidence: list[DecisionDNAEvidenceSchema] = Field(default_factory=list)
    alternatives: list[DecisionAlternativeSchema] = Field(default_factory=list)
    constraints: list[DecisionDNAConstraintSchema] = Field(default_factory=list)
    humanDecision: HumanDecisionRecordSchema
    expectedOutcome: DecisionDNAConfigurationSchema
    actualOutcome: DecisionDNAOutcomeSchema
    uncertainty: DecisionUncertaintyDetailsSchema
    learning: DecisionDNALearningSchema
    lineage: list[DecisionLineageNodeSchema] = Field(default_factory=list)
    provenance: DecisionDNAProvenanceSchema
    auditEvents: list[DecisionDNAAuditEventSchema] = Field(default_factory=list)
    confidence: float
