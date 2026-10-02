"""
DecisionOS — Scenario Lab API Routes

Endpoints:
- GET  /api/scenarios
- GET  /api/v1/scenario/presets
  Returns predefined scenario presets (Growth Push, Conservative Cash Buffer, Margin Defense, Baseline).
- POST /api/scenarios
- POST /api/v1/scenario/simulate
  Calculates real projected outcomes across revenue, profit, margin, orders, inventory, constraints,
  sensitivity, and uncertainty.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.models.scenario import ScenarioVariablesModel
from app.schemas.common import ApiResponse
from app.schemas.scenario import (
    ScenarioPresetSchema,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
)
from app.services import scenario_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Scenario Lab"])


@router.get(
    "/api/scenarios",
    response_model=ApiResponse[list[ScenarioPresetSchema]],
    summary="List Scenario Presets",
    description="Returns predefined scenario lever presets grounded in current business baseline.",
)
@router.get(
    "/api/v1/scenario/presets",
    response_model=ApiResponse[list[ScenarioPresetSchema]],
    include_in_schema=False,
)
async def list_scenario_presets(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[ScenarioPresetSchema]]:
    presets = await scenario_service.get_scenario_presets(db, auth)
    return ApiResponse(
        success=True,
        data=presets,
        message=f"Retrieved {len(presets)} scenario presets.",
    )


@router.post(
    "/api/scenarios",
    response_model=ApiResponse[ScenarioSimulationResponse],
    summary="Simulate Business Scenario",
    description="Simulates real projected commercial outcomes using microeconomic elasticity and inventory constraint models.",
)
@router.post(
    "/api/v1/scenario/simulate",
    response_model=ApiResponse[ScenarioSimulationResponse],
    include_in_schema=False,
)
async def simulate_scenario(
    req: ScenarioSimulationRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[ScenarioSimulationResponse]:
    # Extract variables from req.variables or req.levers or defaults
    vars_obj = req.variables or req.levers

    if vars_obj:
        mktg = vars_obj.marketingBudget
        inv = vars_obj.workingInventory
        price = vars_obj.unitPrice
    else:
        # Default levers for preset_growth
        mktg = 1.85
        inv = 1300.0
        price = 102.0

    levers_model = ScenarioVariablesModel(
        marketing_budget=mktg,
        working_inventory=inv,
        unit_price=price,
    )

    preset_id = req.presetId or req.preset_id or "preset_growth"
    base_id = req.baselineId or req.baseline_id

    result = await scenario_service.simulate_scenario(
        db=db,
        auth=auth,
        levers=levers_model,
        preset_id=preset_id,
        scenario_name=req.scenarioName,
        baseline_id=base_id,
    )

    return ApiResponse(
        success=True,
        data=result,
        message="Scenario simulation executed successfully.",
    )


@router.get(
    "/api/scenarios/baseline",
    summary="Get Dataset-Derived Scenario Baseline",
    description=(
        "Returns the current dataset baseline values for the three scenario levers: "
        "marketing spend (DATA_DERIVED or UNAVAILABLE), working inventory (DATA_DERIVED or UNAVAILABLE), "
        "and real price baseline (DATA_DERIVED or UNAVAILABLE). "
        "These values must be shown to users instead of hardcoded model defaults."
    ),
)
async def get_scenario_baseline(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[dict]:
    baseline = await scenario_service.get_scenario_baseline(db, auth)
    return ApiResponse(
        success=True,
        data=baseline,
        message="Dataset-derived scenario baseline retrieved.",
    )
