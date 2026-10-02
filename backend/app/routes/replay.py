"""
DecisionOS — Decision Replay API Routes

Endpoints:
- GET  /api/replay
- GET  /api/v1/replay/historical-decisions
  Returns past decisions with empirical baseline outcome telemetry.
- GET  /api/replay/{id}
- GET  /api/v1/replay/workspace/{id}
  Returns actual trajectory vs counterfactual trajectory and side-by-side metric comparison.
- POST /api/replay
- POST /api/v1/replay/simulate
  Simulates an alternative counterfactual branch on a past decision.

CRITICAL ARCHITECTURAL GUARANTEE:
All counterfactual results are explicitly tagged as simulated.
The system does NOT claim simulated outcomes definitely would have occurred.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse, ErrorCode
from app.schemas.replay import (
    HistoricalDecisionResponse,
    ReplaySimulationRequest,
    ReplayWorkspaceResponse,
)
from app.services import replay_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Decision Replay"])


@router.get(
    "/api/replay",
    response_model=ApiResponse[list[HistoricalDecisionResponse]],
    summary="List Historical Decisions for Replay",
    description="Returns past decisions that have empirical baseline outcome telemetry.",
)
@router.get(
    "/api/v1/replay/historical-decisions",
    response_model=ApiResponse[list[HistoricalDecisionResponse]],
    include_in_schema=False,
)
async def list_replay_decisions(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[HistoricalDecisionResponse]]:
    decisions = await replay_service.list_historical_decisions(db, auth)
    return ApiResponse(
        success=True,
        data=decisions,
        message=f"Retrieved {len(decisions)} historical decisions.",
    )


@router.get(
    "/api/replay/{id}",
    response_model=ApiResponse[ReplayWorkspaceResponse],
    summary="Get Decision Replay Workspace",
    description="Returns actual trajectory vs counterfactual trajectory, timeline fork markers, and outcome comparisons.",
)
@router.get(
    "/api/v1/replay/workspace/{id}",
    response_model=ApiResponse[ReplayWorkspaceResponse],
    include_in_schema=False,
)
async def get_replay_workspace(
    id: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[ReplayWorkspaceResponse]:
    workspace = await replay_service.get_replay_workspace(db, auth, id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": ErrorCode.NOT_FOUND,
                "message": f"Historical decision '{id}' not found or access denied.",
            },
        )
    return ApiResponse(
        success=True,
        data=workspace,
        message="Replay workspace retrieved successfully. Counterfactual outcomes are simulated.",
    )


@router.post(
    "/api/replay",
    response_model=ApiResponse[ReplayWorkspaceResponse],
    summary="Simulate Decision Replay",
    description="Recalculates supported commercial metrics for an alternative counterfactual branch.",
)
@router.post(
    "/api/v1/replay/simulate",
    response_model=ApiResponse[ReplayWorkspaceResponse],
    include_in_schema=False,
)
async def simulate_replay(
    req: ReplaySimulationRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[ReplayWorkspaceResponse]:
    dec_id = req.decisionId or req.decision_id
    if not dec_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": ErrorCode.BAD_REQUEST,
                "message": "decisionId is required to simulate a counterfactual replay.",
            },
        )
    br_id = req.branchId or req.branch_id

    result = await replay_service.simulate_replay(
        db=db,
        auth=auth,
        decision_id=dec_id,
        branch_id=br_id,
        counterfactual_config=req.counterfactualConfig,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": ErrorCode.NOT_FOUND,
                "message": f"Historical decision '{dec_id}' not found or access denied.",
            },
        )
    return ApiResponse(
        success=True,
        data=result,
        message="Counterfactual branch simulated successfully. Results are modeled estimates.",
    )
