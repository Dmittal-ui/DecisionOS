"""
DecisionOS — Optimizer API Routes

Endpoints:
- POST /api/optimizer
- POST /api/optimizer/solve
- POST /api/v1/optimizer/solve
  Invokes the deterministic constraint-aware mathematical solver.
- GET  /api/optimizer
- GET  /api/v1/optimizer
  Returns the complete optimizer workspace state.
- GET  /api/optimizer/history
  Returns past optimization solver runs for the authenticated organization.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse
from app.schemas.optimizer import (
    OptimizerSolveRequest,
    OptimizerSolveResponse,
    OptimizerWorkspaceResponse,
)
from app.services import optimizer_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Constraint Optimizer"])


@router.post(
    "/api/optimizer",
    response_model=ApiResponse[OptimizerSolveResponse],
    summary="Solve Constraint Optimization",
    description="Invokes the deterministic constraint-aware discrete grid search solver.",
)
@router.post(
    "/api/optimizer/solve",
    response_model=ApiResponse[OptimizerSolveResponse],
    include_in_schema=False,
)
@router.post(
    "/api/v1/optimizer/solve",
    response_model=ApiResponse[OptimizerSolveResponse],
    include_in_schema=False,
)
async def solve_optimization(
    req: OptimizerSolveRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[OptimizerSolveResponse]:
    """
    Evaluates discrete candidate configurations over microeconomic models,
    prunes hard constraint violations, and returns the optimal feasible configuration.
    """
    result = await optimizer_service.solve_optimization(
        db=db,
        auth=auth,
        objective=req.objective or "maximize_gross_profit",
        hard_constraints=req.hardConstraints,
        allowed_ranges=req.allowedRanges,
        decision_variables=req.decisionVariables,
    )

    msg = (
        f"Optimization complete. Found feasible optimal configuration for objective '{req.objective}'."
        if result.get("status") == "optimal"
        else "Optimization completed: Infeasible constraints. No configuration satisfied all constraints simultaneously."
    )

    return ApiResponse(
        success=True,
        data=OptimizerSolveResponse(**result),
        message=msg,
    )


@router.get(
    "/api/optimizer",
    response_model=ApiResponse[OptimizerWorkspaceResponse],
    summary="Get Optimizer Workspace",
    description="Returns the full optimizer workspace state including objectives, decision levers, and active solution space.",
)
@router.get(
    "/api/v1/optimizer",
    response_model=ApiResponse[OptimizerWorkspaceResponse],
    include_in_schema=False,
)
async def get_optimizer_workspace(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[OptimizerWorkspaceResponse]:
    workspace = await optimizer_service.get_optimizer_workspace(db, auth)
    return ApiResponse(
        success=True,
        data=OptimizerWorkspaceResponse(**workspace),
        message="Retrieved optimizer workspace.",
    )


@router.get(
    "/api/optimizer/history",
    response_model=ApiResponse[list[dict[str, Any]]],
    summary="Optimization History",
    description="Returns past optimization runs for the authenticated organization.",
)
async def get_optimization_history(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[dict[str, Any]]]:
    history = await optimizer_service.list_optimization_history(db, auth)
    return ApiResponse(
        success=True,
        data=history,
        message=f"Retrieved {len(history)} optimization runs.",
    )
