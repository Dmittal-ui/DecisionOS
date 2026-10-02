"""
DecisionOS — Investigation Workspace Routes

Endpoints:
- GET /api/investigations/{id}
- GET /api/v1/investigation/{id}
  Returns the active investigation workspace, competing hypotheses, Bayesian confidence weights,
  observed empirical evidence, causal decision tree, and timeline.

Architectural Guarantees:
- Clearly distinguishes observed empirical evidence from competing structural hypotheses.
- Strictly isolated by authenticated organization.
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.models.investigation import (
    InvestigationDocument,
    InvestigationEvidenceModel,
    InvestigationHypothesisModel,
    InvestigationTimelineEventModel,
    InvestigationTreeNodeModel,
)
from app.schemas.common import ApiResponse, ErrorCode
from app.schemas.investigation import (
    InvestigationEvidenceSchema,
    InvestigationHypothesisSchema,
    InvestigationTimelineEventSchema,
    InvestigationTreeNodeSchema,
    InvestigationWorkspaceResponse,
)
from app.schemas.opportunity import OpportunitySignalSchema
from app.services import investigation_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Investigation Workspace"])


def _map_tree_node(node: InvestigationTreeNodeModel) -> InvestigationTreeNodeSchema:
    """Recursively converts internal tree node model to API schema."""
    return InvestigationTreeNodeSchema(
        id=node.id,
        label=node.label,
        type=node.type,
        status=node.status,
        metric=node.metric,
        value=node.value,
        confidenceScore=node.confidence_score,
        hypothesisId=node.hypothesis_id,
        evidenceIds=node.evidence_ids,
        description=node.description,
        children=[_map_tree_node(c) for c in node.children],
    )


def _map_investigation_to_response(inv: InvestigationDocument) -> InvestigationWorkspaceResponse:
    """Maps InvestigationDocument to API response schema."""
    start_iso = inv.started_at.isoformat() if isinstance(inv.started_at, datetime) else str(inv.started_at)
    upd_iso = inv.updated_at.isoformat() if isinstance(inv.updated_at, datetime) else str(inv.updated_at)

    tree_schema = _map_tree_node(inv.tree_root)

    return InvestigationWorkspaceResponse(
        id=inv.id,
        opportunityId=inv.opportunity_id,
        opportunityCode=inv.opportunity_code,
        opportunityContext=inv.opportunity_context,
        overallConfidence=inv.overall_confidence,
        confidence=inv.overall_confidence,
        summary=inv.summary,
        leadingHypothesisId=inv.leading_hypothesis_id,
        signals=[
            OpportunitySignalSchema(
                id=s.id,
                label=s.label,
                metric=s.metric,
                value=s.value,
                direction=s.direction,
                group=s.group,
                description=s.description,
                observedValue=s.observed_value,
                baselineValue=s.baseline_value,
                changePercent=s.change_percent,
            )
            for s in inv.signals
        ],
        hypotheses=[
            InvestigationHypothesisSchema(
                id=h.id,
                label=h.label,
                title=h.title,
                statement=h.statement,
                description=h.description or h.statement,
                confidenceScore=h.confidence_score,
                status=h.status,
                rank=h.rank,
                evidenceCount=len(h.evidence_items),
                evidenceItems=[
                    InvestigationEvidenceSchema(
                        id=e.id,
                        description=e.description,
                        metric=e.metric,
                        value=e.value,
                        direction=e.direction,
                        strength=e.strength,
                        source=e.source,
                    )
                    for e in h.evidence_items
                ],
                affectedMetrics=h.affected_metrics,
                supportingSignals=h.supporting_signals,
                contradictingSignals=h.contradicting_signals,
            )
            for h in inv.hypotheses
        ],
        evidence=[
            InvestigationEvidenceSchema(
                id=e.id,
                description=e.description,
                metric=e.metric,
                value=e.value,
                direction=e.direction,
                strength=e.strength,
                source=e.source,
            )
            for e in inv.evidence
        ],
        treeRoot=tree_schema,
        decisionTree=tree_schema,
        timeline=[
            InvestigationTimelineEventSchema(
                id=t.id,
                time=t.time,
                label=t.label,
                description=t.description,
                type=t.type,
                severity=t.severity,
            )
            for t in inv.timeline
        ],
        status=inv.status,
        startedAt=start_iso,
        updatedAt=upd_iso,
    )


@router.get(
    "/api/investigations/{id}",
    response_model=ApiResponse[InvestigationWorkspaceResponse],
    summary="Get Investigation Workspace",
    description="Returns the active investigation workspace for an investigationId, opportunityId, or opportunityCode.",
)
@router.get(
    "/api/v1/investigation/{id}",
    response_model=ApiResponse[InvestigationWorkspaceResponse],
    include_in_schema=False,
)
async def get_investigation(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[InvestigationWorkspaceResponse]:
    inv = await investigation_service.get_investigation_by_id_or_code(db, auth, id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": ErrorCode.NOT_FOUND,
                "message": f"Investigation or Opportunity '{id}' not found or access denied.",
            },
        )

    return ApiResponse(
        success=True,
        data=_map_investigation_to_response(inv),
        message="Investigation workspace retrieved successfully.",
    )
