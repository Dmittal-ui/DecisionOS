"""
DecisionOS — Opportunity Center Routes

Endpoints:
- GET /api/opportunities
- GET /api/v1/opportunities
  Query continuous radar scan opportunities with filtering, searching, and sorting.
- GET /api/opportunities/{id}
- GET /api/v1/opportunities/{id}
  Returns granular metadata, evidence signals, and impact projections for an opportunity.
- POST /api/opportunities/scan
- POST /api/v1/opportunities/scan
  Triggers an on-demand deterministic radar scan across enterprise data.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.models.opportunity import OpportunityDocument
from app.schemas.common import ApiResponse, ErrorCode
from app.schemas.opportunity import (
    OpportunityImpactSchema,
    OpportunityListResponse,
    OpportunityResponse,
    OpportunitySignalSchema,
)
from app.services import opportunity_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Opportunity Center"])


def _map_opportunity_to_response(opp: OpportunityDocument) -> OpportunityResponse:
    """Helper to convert OpportunityDocument to API schema with dual property support."""
    det_iso = opp.detected_at.isoformat() if isinstance(opp.detected_at, datetime) else str(opp.detected_at)
    upd_iso = opp.updated_at.isoformat() if isinstance(opp.updated_at, datetime) else str(opp.updated_at)

    return OpportunityResponse(
        id=opp.id,
        opportunityId=opp.id,
        code=opp.code,
        organizationId=opp.organization_id,
        businessId=opp.business_id,
        title=opp.title,
        summary=opp.summary,
        category=opp.category,
        priority=opp.priority,
        urgency=opp.urgency,
        status=opp.status,
        confidence=opp.confidence,
        impact=OpportunityImpactSchema(
            projectedRevenue=opp.impact.projected_revenue,
            costReduction=opp.impact.cost_reduction,
            netValue=opp.impact.net_value,
            confidenceScore=opp.impact.confidence_score,
            timeToRealizationDays=opp.impact.time_to_realization_days,
            netValueFormatted=opp.impact.net_value_formatted,
            timeHorizon=opp.impact.time_horizon,
            riskLevel=opp.impact.risk_level,
        ),
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
            for s in opp.signals
        ],
        affectedSegments=opp.affected_segments,
        tags=opp.tags,
        detectedAt=det_iso,
        updatedAt=upd_iso,
    )


@router.get(
    "/api/opportunities",
    response_model=ApiResponse[list[OpportunityResponse]],
    summary="List Opportunities",
    description="Queries detected opportunities for the authenticated organization with filtering, sorting, and search.",
)
@router.get(
    "/api/v1/opportunities",
    response_model=ApiResponse[list[OpportunityResponse]],
    include_in_schema=False,
)
async def list_opportunities(
    status_filter: Optional[str] = Query(None, alias="status"),
    urgency_filter: Optional[str] = Query(None, alias="urgency"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("impact", alias="sortBy"),
    sort_dir: Optional[str] = Query("desc", alias="sortDir"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[OpportunityResponse]]:
    opps, total = await opportunity_service.list_opportunities(
        db=db,
        auth=auth,
        status=status_filter,
        urgency=urgency_filter,
        priority=priority_filter,
        category=category_filter,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        limit=limit,
    )

    items = [_map_opportunity_to_response(o) for o in opps]
    return ApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} opportunities successfully.",
    )


@router.post(
    "/api/opportunities/scan",
    response_model=ApiResponse[list[OpportunityResponse]],
    summary="Trigger Radar Scan",
    description="Runs deterministic trend and threshold rules over business data to detect actionable decision opportunities.",
)
@router.post(
    "/api/v1/opportunities/scan",
    response_model=ApiResponse[list[OpportunityResponse]],
    include_in_schema=False,
)
async def scan_opportunities(
    business_id: Optional[str] = Query(None, alias="businessId"),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[OpportunityResponse]]:
    opps = await opportunity_service.scan_and_detect_opportunities(
        db=db,
        auth=auth,
        business_id=business_id,
    )
    items = [_map_opportunity_to_response(o) for o in opps]
    return ApiResponse(
        success=True,
        data=items,
        message=f"Radar scan complete. Detected {len(items)} opportunities.",
    )


@router.get(
    "/api/opportunities/{id}",
    response_model=ApiResponse[OpportunityResponse],
    summary="Get Opportunity Detail",
    description="Retrieves a single opportunity by ID or code with strict tenant isolation.",
)
@router.get(
    "/api/v1/opportunities/{id}",
    response_model=ApiResponse[OpportunityResponse],
    include_in_schema=False,
)
async def get_opportunity(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[OpportunityResponse]:
    opp = await opportunity_service.get_opportunity_by_id(db, auth, id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": ErrorCode.NOT_FOUND,
                "message": f"Opportunity '{id}' not found or access denied.",
            },
        )

    return ApiResponse(
        success=True,
        data=_map_opportunity_to_response(opp),
        message="Opportunity retrieved successfully.",
    )
