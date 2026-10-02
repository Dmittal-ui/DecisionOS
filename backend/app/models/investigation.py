"""
DecisionOS — Investigation MongoDB Document Model

Stores structured decision investigations, competing hypotheses, observed factual
evidence, causal decision trees, and chronological anomaly progression timelines.
Conforms strictly to docs/API_CONTRACT.md and frontend types/investigation-workspace.ts.

Key Architecture Rule:
Clearly distinguishes observed empirical evidence (ground truth facts) from
competing structural hypotheses (probabilistic explanations).
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.opportunity import OpportunitySignalModel


class InvestigationEvidenceModel(BaseModel):
    """
    Empirical evidence observed directly in commercial telemetry.
    Distinct from hypotheses: evidence represents verified facts.
    """
    id: str
    description: str
    metric: Optional[str] = None
    value: Optional[str] = None
    direction: str = "supporting"  # supporting | contradicting | neutral
    strength: str = "high"         # high | medium | low
    source: Optional[str] = None   # e.g. "Paid Channel Telemetry", "Inventory Ledger"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "description": self.description,
            "metric": self.metric,
            "value": self.value,
            "direction": self.direction,
            "strength": self.strength,
            "source": self.source,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InvestigationEvidenceModel":
        return cls(
            id=str(data.get("id", "")),
            description=str(data.get("description", "")),
            metric=data.get("metric"),
            value=data.get("value"),
            direction=str(data.get("direction", "supporting")),
            strength=str(data.get("strength", "high")),
            source=data.get("source"),
        )


class InvestigationHypothesisModel(BaseModel):
    """
    A competing explanation evaluated against observed evidence.
    Hypotheses represent structural causal theories.
    """
    id: str
    label: str  # "A", "B", "C"
    title: str
    statement: str
    description: Optional[str] = None
    confidence_score: float  # 0 to 100
    status: str = "under_investigation"  # leading | strong_evidence | moderate_evidence | weak_evidence | under_investigation
    rank: int = 1
    evidence_items: list[InvestigationEvidenceModel] = Field(default_factory=list)
    affected_metrics: list[str] = Field(default_factory=list)
    supporting_signals: list[str] = Field(default_factory=list)
    contradicting_signals: list[str] = Field(default_factory=list)

    @property
    def confidenceScore(self) -> float:
        return self.confidence_score

    @property
    def evidenceItems(self) -> list[InvestigationEvidenceModel]:
        return self.evidence_items

    @property
    def affectedMetrics(self) -> list[str]:
        return self.affected_metrics

    @property
    def supportingSignals(self) -> list[str]:
        return self.supporting_signals

    @property
    def contradictingSignals(self) -> list[str]:
        return self.contradicting_signals

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "title": self.title,
            "statement": self.statement,
            "description": self.description or self.statement,
            "confidenceScore": self.confidence_score,
            "confidence_score": self.confidence_score,
            "status": self.status,
            "rank": self.rank,
            "evidenceCount": len(self.evidence_items),
            "evidenceItems": [e.to_dict() for e in self.evidence_items],
            "evidence_items": [e.to_dict() for e in self.evidence_items],
            "affectedMetrics": self.affected_metrics,
            "affected_metrics": self.affected_metrics,
            "supportingSignals": self.supporting_signals,
            "supporting_signals": self.supporting_signals,
            "contradictingSignals": self.contradicting_signals,
            "contradicting_signals": self.contradicting_signals,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InvestigationHypothesisModel":
        ev_raw = data.get("evidenceItems") or data.get("evidence_items") or []
        stmt = str(data.get("statement") or data.get("description") or "")
        return cls(
            id=str(data.get("id", "")),
            label=str(data.get("label", "A")),
            title=str(data.get("title", "")),
            statement=stmt,
            description=str(data.get("description") or stmt),
            confidence_score=float(data.get("confidenceScore") or data.get("confidence_score") or 0.0),
            status=str(data.get("status", "under_investigation")),
            rank=int(data.get("rank", 1)),
            evidence_items=[InvestigationEvidenceModel.from_dict(e) for e in ev_raw if isinstance(e, dict)],
            affected_metrics=data.get("affectedMetrics") or data.get("affected_metrics") or [],
            supporting_signals=data.get("supportingSignals") or data.get("supporting_signals") or [],
            contradicting_signals=data.get("contradictingSignals") or data.get("contradicting_signals") or [],
        )


class InvestigationTreeNodeModel(BaseModel):
    """Hierarchical decision tree node tracing diagnostic logic."""
    id: str
    label: str
    type: str = "decision"  # root | decision | leaf | root_cause_candidate
    status: str = "active"  # root | active | supporting | conflicting | neutral | root_cause_candidate
    metric: Optional[str] = None
    value: Optional[str] = None
    confidence_score: Optional[float] = None
    hypothesis_id: Optional[str] = None
    evidence_ids: list[str] = Field(default_factory=list)
    description: Optional[str] = None
    children: list["InvestigationTreeNodeModel"] = Field(default_factory=list)

    @property
    def confidenceScore(self) -> Optional[float]:
        return self.confidence_score

    @property
    def hypothesisId(self) -> Optional[str]:
        return self.hypothesis_id

    @property
    def evidenceIds(self) -> list[str]:
        return self.evidence_ids

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "type": self.type,
            "status": self.status,
            "metric": self.metric,
            "value": self.value,
            "confidenceScore": self.confidence_score,
            "confidence_score": self.confidence_score,
            "hypothesisId": self.hypothesis_id,
            "hypothesis_id": self.hypothesis_id,
            "evidenceIds": self.evidence_ids,
            "evidence_ids": self.evidence_ids,
            "description": self.description,
            "children": [c.to_dict() for c in self.children],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InvestigationTreeNodeModel":
        children_raw = data.get("children") or []
        return cls(
            id=str(data.get("id", "")),
            label=str(data.get("label", "")),
            type=str(data.get("type", "decision")),
            status=str(data.get("status", "active")),
            metric=data.get("metric"),
            value=data.get("value"),
            confidence_score=data.get("confidenceScore") or data.get("confidence_score"),
            hypothesis_id=data.get("hypothesisId") or data.get("hypothesis_id"),
            evidence_ids=data.get("evidenceIds") or data.get("evidence_ids") or [],
            description=data.get("description"),
            children=[cls.from_dict(c) for c in children_raw if isinstance(c, dict)],
        )


# Allow recursive self-reference for TreeNode
InvestigationTreeNodeModel.model_rebuild()


class InvestigationTimelineEventModel(BaseModel):
    """Chronological event tracing anomaly inception, signals, and investigation milestones."""
    id: str
    time: str
    label: str
    description: Optional[str] = None
    type: str = "detection"  # detection | signal | hypothesis | comparison | ready
    severity: Optional[str] = "high"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "time": self.time,
            "timestamp": self.time,
            "label": self.label,
            "title": self.label,
            "description": self.description,
            "type": self.type,
            "severity": self.severity,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InvestigationTimelineEventModel":
        time_val = str(data.get("time") or data.get("timestamp") or "")
        label_val = str(data.get("label") or data.get("title") or "")
        return cls(
            id=str(data.get("id", "")),
            time=time_val,
            label=label_val,
            description=data.get("description"),
            type=str(data.get("type", "detection")),
            severity=data.get("severity", "high"),
        )


class InvestigationDocument(BaseModel):
    """
    Represents an Investigation document stored in 'investigations'.

    Fields:
        id (str):                      UUID string used as MongoDB _id (investigationId).
        opportunity_id (str):          FK -> opportunities._id.
        opportunity_code (str):        Human-readable code (e.g. OPP-9021).
        organization_id (str):         FK -> organizations._id.
        business_id (str):             FK -> businesses._id.
        opportunity_context (dict):    Captured opportunity metadata.
        overall_confidence (float):    Composite confidence score (0 to 100).
        summary (str):                 Analytical synthesis of the investigation.
        leading_hypothesis_id (str):   ID of leading hypothesis.
        signals (list):                Observed raw anomaly signals.
        hypotheses (list):             Competing diagnostic hypotheses.
        evidence (list):               All observed empirical evidence items (clearly distinguished).
        tree_root (TreeNodeModel):     Decision tree root node.
        timeline (list):               Chronological investigation progression events.
        status (str):                  open | in_progress | synthesizing | completed
        started_at (datetime):         UTC timestamp when investigation initialized.
        updated_at (datetime):         UTC timestamp of latest diagnostic run.
    """

    id: str = Field(..., description="UUID string - used as MongoDB _id")
    opportunity_id: str
    opportunity_code: str
    organization_id: str
    business_id: str
    dataset_id: str = Field(default="", description="FK -> datasets._id. Scopes this investigation to the dataset it was built from.")
    opportunity_context: dict[str, Any] = Field(default_factory=dict)
    overall_confidence: float = 88.0
    summary: str = ""
    leading_hypothesis_id: str = "hyp_1"
    signals: list[OpportunitySignalModel] = Field(default_factory=list)
    hypotheses: list[InvestigationHypothesisModel] = Field(default_factory=list)
    evidence: list[InvestigationEvidenceModel] = Field(default_factory=list)
    tree_root: InvestigationTreeNodeModel
    timeline: list[InvestigationTimelineEventModel] = Field(default_factory=list)
    status: str = "in_progress"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def investigationId(self) -> str:
        return self.id

    @property
    def opportunityId(self) -> str:
        return self.opportunity_id

    @property
    def opportunityCode(self) -> str:
        return self.opportunity_code

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def overallConfidence(self) -> float:
        return self.overall_confidence

    @property
    def leadingHypothesisId(self) -> str:
        return self.leading_hypothesis_id

    @property
    def treeRoot(self) -> InvestigationTreeNodeModel:
        return self.tree_root

    @property
    def startedAt(self) -> datetime:
        return self.started_at

    @property
    def updatedAt(self) -> datetime:
        return self.updated_at

    def to_mongo(self) -> dict[str, Any]:
        """Serializes document to MongoDB."""
        return {
            "_id": self.id,
            "investigationId": self.id,
            "investigation_id": self.id,
            "opportunity_id": self.opportunity_id,
            "opportunityId": self.opportunity_id,
            "opportunity_code": self.opportunity_code,
            "opportunityCode": self.opportunity_code,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "dataset_id": self.dataset_id,
            "datasetId": self.dataset_id,
            "opportunity_context": self.opportunity_context,
            "opportunityContext": self.opportunity_context,
            "overall_confidence": self.overall_confidence,
            "overallConfidence": self.overall_confidence,
            "confidence": self.overall_confidence,
            "summary": self.summary,
            "leading_hypothesis_id": self.leading_hypothesis_id,
            "leadingHypothesisId": self.leading_hypothesis_id,
            "signals": [s.to_dict() for s in self.signals],
            "hypotheses": [h.to_dict() for h in self.hypotheses],
            "evidence": [e.to_dict() for e in self.evidence],
            "tree_root": self.tree_root.to_dict(),
            "treeRoot": self.tree_root.to_dict(),
            "decision_tree": self.tree_root.to_dict(),
            "decisionTree": self.tree_root.to_dict(),
            "timeline": [t.to_dict() for t in self.timeline],
            "status": self.status,
            "started_at": self.started_at,
            "startedAt": self.started_at,
            "updated_at": self.updated_at,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "InvestigationDocument":
        """Reconstructs InvestigationDocument from MongoDB document."""
        signals_raw = doc.get("signals") or []
        hyp_raw = doc.get("hypotheses") or []
        ev_raw = doc.get("evidence") or []
        tree_raw = doc.get("tree_root") or doc.get("treeRoot") or doc.get("decision_tree") or doc.get("decisionTree") or {}
        time_raw = doc.get("timeline") or []
        opp_ctx = doc.get("opportunity_context") or doc.get("opportunityContext") or {}

        # Fallback tree root if missing
        if not tree_raw:
            tree_root = InvestigationTreeNodeModel(
                id="node_root",
                label=f"Opportunity {doc.get('opportunity_code', 'OPP-0000')} Investigation",
                type="root",
                status="root",
            )
        else:
            tree_root = InvestigationTreeNodeModel.from_dict(tree_raw)

        return cls(
            id=str(doc.get("_id") or doc.get("investigationId") or doc.get("investigation_id")),
            opportunity_id=str(doc.get("opportunity_id") or doc.get("opportunityId")),
            opportunity_code=str(doc.get("opportunity_code") or doc.get("opportunityCode", "")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            dataset_id=str(doc.get("dataset_id") or doc.get("datasetId") or ""),
            opportunity_context=opp_ctx,
            overall_confidence=float(doc.get("overall_confidence") or doc.get("overallConfidence") or doc.get("confidence") or 85.0),
            summary=str(doc.get("summary", "")),
            leading_hypothesis_id=str(doc.get("leading_hypothesis_id") or doc.get("leadingHypothesisId", "hyp_1")),
            signals=[OpportunitySignalModel.from_dict(s) for s in signals_raw if isinstance(s, dict)],
            hypotheses=[InvestigationHypothesisModel.from_dict(h) for h in hyp_raw if isinstance(h, dict)],
            evidence=[InvestigationEvidenceModel.from_dict(e) for e in ev_raw if isinstance(e, dict)],
            tree_root=tree_root,
            timeline=[InvestigationTimelineEventModel.from_dict(t) for t in time_raw if isinstance(t, dict)],
            status=str(doc.get("status", "in_progress")),
            started_at=doc.get("started_at") or doc.get("startedAt") or datetime.now(timezone.utc),
            updated_at=doc.get("updated_at") or doc.get("updatedAt") or datetime.now(timezone.utc),
        )
