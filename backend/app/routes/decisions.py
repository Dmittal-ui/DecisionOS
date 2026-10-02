"""
DecisionOS — Decision Registry & Human Approval Routes

Endpoints:
- GET  /api/decisions
- GET  /api/v1/decisions
- GET  /api/decisions/{id}
- GET  /api/v1/decisions/{id}
- POST /api/decisions/{id}/approve
- POST /api/v1/decisions/{id}/approve
- POST /api/decisions/{id}/modify
- POST /api/v1/decisions/{id}/modify
- POST /api/decisions/{id}/reject
- POST /api/v1/decisions/{id}/reject
- GET  /api/decisions/{id}/audits
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse
from app.schemas.decision import (
    ApproveDecisionRequest,
    DecisionItemResponse,
    ModifyDecisionRequest,
    RejectDecisionRequest,
)
from app.services import decision_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Decision Registry & Human Governance"])


@router.get(
    "/api/decisions",
    response_model=ApiResponse[list[DecisionItemResponse]],
    summary="List Decisions in Registry",
    description="Returns all governance decision items with audit timelines, evidence chains, and status.",
)
@router.get(
    "/api/v1/decisions",
    response_model=ApiResponse[list[DecisionItemResponse]],
    include_in_schema=False,
)
async def list_decisions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by decision status"),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[DecisionItemResponse]]:
    decisions = await decision_service.list_decisions(db, auth, status_filter=status_filter)
    return ApiResponse(
        success=True,
        data=decisions,
        message=f"Retrieved {len(decisions)} decisions from registry.",
    )


@router.get(
    "/api/decisions/{id}",
    response_model=ApiResponse[DecisionItemResponse],
    summary="Get Decision Detail",
    description="Returns complete decision package by ID.",
)
@router.get(
    "/api/v1/decisions/{id}",
    response_model=ApiResponse[DecisionItemResponse],
    include_in_schema=False,
)
async def get_decision(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DecisionItemResponse]:
    decision = await decision_service.get_decision_by_id(db, auth, id)
    return ApiResponse(
        success=True,
        data=decision,
        message="Decision retrieved successfully.",
    )


@router.post(
    "/api/decisions/{id}/approve",
    response_model=ApiResponse[DecisionItemResponse],
    summary="Human Approval Action",
    description="Authorized human stakeholder approval action. Never approved automatically.",
)
@router.post(
    "/api/v1/decisions/{id}/approve",
    response_model=ApiResponse[DecisionItemResponse],
    include_in_schema=False,
)
async def approve_decision(
    id: str,
    req: ApproveDecisionRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DecisionItemResponse]:
    if not req.approverName or req.approverName.strip() == "":
        req.approverName = auth.email or f"User {auth.user_id[:8]}"
    if not req.approverRole or req.approverRole.strip() == "":
        req.approverRole = auth.role or "Authorized Stakeholder"

    updated_dec = await decision_service.approve_decision(db, auth, id, req)
    return ApiResponse(
        success=True,
        data=updated_dec,
        message=f"Decision '{id}' successfully approved by {req.approverName}. Decision DNA recorded.",
    )


@router.post(
    "/api/decisions/{id}/modify",
    response_model=ApiResponse[DecisionItemResponse],
    summary="Human Override / Modification",
    description="Human stakeholder configuration variable override. Stores changed configuration and recalculates outcomes.",
)
@router.post(
    "/api/v1/decisions/{id}/modify",
    response_model=ApiResponse[DecisionItemResponse],
    include_in_schema=False,
)
async def modify_decision(
    id: str,
    req: ModifyDecisionRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DecisionItemResponse]:
    updated_dec = await decision_service.modify_decision(db, auth, id, req)
    return ApiResponse(
        success=True,
        data=updated_dec,
        message=f"Decision '{id}' modified by {req.modifiedBy}. Recalculated outcomes and Decision DNA recorded.",
    )


@router.post(
    "/api/decisions/{id}/reject",
    response_model=ApiResponse[DecisionItemResponse],
    summary="Human Rejection Action",
    description="Rejects proposed decision configuration and records rejection rationale.",
)
@router.post(
    "/api/v1/decisions/{id}/reject",
    response_model=ApiResponse[DecisionItemResponse],
    include_in_schema=False,
)
async def reject_decision(
    id: str,
    req: RejectDecisionRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DecisionItemResponse]:
    updated_dec = await decision_service.reject_decision(db, auth, id, req)
    return ApiResponse(
        success=True,
        data=updated_dec,
        message=f"Decision '{id}' rejected by {req.rejectedBy}. Rejection reason stored in Decision DNA.",
    )


@router.get(
    "/api/decisions/{id}/audits",
    response_model=ApiResponse[list[dict[str, Any]]],
    summary="Get Decision Audit Events",
    description="Returns immutable audit history events for the decision.",
)
async def get_decision_audits(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[dict[str, Any]]]:
    audits = await decision_service.list_audit_events_for_decision(db, auth, id)
    return ApiResponse(
        success=True,
        data=audits,
        message=f"Retrieved {len(audits)} audit events.",
    )
