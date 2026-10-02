"""
DecisionOS — Decision DNA API Routes

Endpoints:
- GET /api/decision-dna
- GET /api/v1/decision-dna
- GET /api/decision-dna/{id}
- GET /api/v1/decision-dna/{id}

Guarantees:
- Returns immutable auditable decision packages tracing:
  Trigger → Evidence → Alternatives → Constraints → Human Action → Expected vs Actual → Learning.
- If empirical post-implementation data does not yet exist:
  strictly returns 'Outcome Pending'. Never fabricates results.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse
from app.schemas.decision_dna import DecisionDNARecordResponse
from app.services import decision_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Decision DNA"])


@router.get(
    "/api/decision-dna",
    response_model=ApiResponse[list[DecisionDNARecordResponse]],
    summary="List Decision DNA Records",
    description="Returns all persistent Decision DNA packages tracing end-to-end decision lineage.",
)
@router.get(
    "/api/v1/decision-dna",
    response_model=ApiResponse[list[DecisionDNARecordResponse]],
    include_in_schema=False,
)
async def list_decision_dna(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[DecisionDNARecordResponse]]:
    dna_records = await decision_service.list_decision_dna(db, auth)
    return ApiResponse(
        success=True,
        data=dna_records,
        message=f"Retrieved {len(dna_records)} Decision DNA records.",
    )


@router.get(
    "/api/decision-dna/{id}",
    response_model=ApiResponse[DecisionDNARecordResponse],
    summary="Get Decision DNA Package",
    description="Returns complete Decision DNA record with full lineage, human authorization record, and learning loop.",
)
@router.get(
    "/api/v1/decision-dna/{id}",
    response_model=ApiResponse[DecisionDNARecordResponse],
    include_in_schema=False,
)
async def get_decision_dna(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DecisionDNARecordResponse]:
    dna_record = await decision_service.get_decision_dna_by_id(db, auth, id)
    return ApiResponse(
        success=True,
        data=dna_record,
        message="Decision DNA retrieved successfully.",
    )
