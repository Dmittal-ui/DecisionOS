"""
DecisionOS — Optimizer Service

Coordinates business data telemetry, executes the deterministic constraint-aware solver,
and manages optimization run history with strict multi-tenant organization isolation.
"""

import logging
import uuid
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.metric_engine import format_currency_value
from app.engine.optimizer_engine import DeterministicGridSearchOptimizer
from app.models.optimizer import OptimizerRunDocument
from app.schemas.auth import AuthContext
from app.services.business_service import get_or_create_default_business
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

OPTIMIZATIONS_COLLECTION = "optimizations"


def get_supported_objectives() -> list[dict[str, Any]]:
    """Returns the list of mathematical optimization objectives supported by the engine."""
    return [
        {
            "key": "maximize_gross_profit",
            "label": "Maximize Gross Profit",
            "description": "Balances price elevation and ad spend to find the absolute maximum gross profit margin.",
            "icon": "TrendingUp",
        },
        {
            "key": "maximize_revenue",
            "label": "Maximize Revenue",
            "description": "Drives top-line transaction volume by capturing maximum market share.",
            "icon": "DollarSign",
        },
        {
            "key": "maximize_operating_margin",
            "label": "Maximize Operating Margin",
            "description": "Protects bottom-line efficiency by minimizing variable unit costs and acquisition spend.",
            "icon": "Percent",
        },
        {
            "key": "minimize_inventory",
            "label": "Minimize Inventory",
            "description": "Reduces working capital tied up in inventory while fulfilling required demand thresholds.",
            "icon": "Package",
        },
    ]


async def solve_optimization(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    objective: str = "maximize_gross_profit",
    hard_constraints: Optional[dict[str, Any]] = None,
    allowed_ranges: Optional[Any] = None,
    decision_variables: Optional[list[Any]] = None,
) -> dict[str, Any]:
    """
    Executes the deterministic constraint-aware grid search optimizer
    calibrated against the authenticated organization's business telemetry.
    """
    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    quality = dataset.data_quality_score if dataset else 100.0
    dataset_id = dataset.id if dataset else ""

    # Calibrate optimizer from real telemetry or robust empirical defaults
    optimizer = DeterministicGridSearchOptimizer.from_dataframe(
        df=df,
        currency=business.currency or "INR",
        data_quality_score=quality,
    )

    # Execute deterministic discrete grid search
    result = optimizer.solve(
        objective=objective,
        hard_constraints=hard_constraints,
        allowed_ranges=allowed_ranges,
        decision_variables=decision_variables,
    )

    # Persist optimization run for tenant audit trail
    run_id = f"opt_{uuid.uuid4().hex[:12]}"
    doc = OptimizerRunDocument(
        id=run_id,
        organization_id=auth.org_id,
        business_id=business.id,
        dataset_id=dataset_id,
        objective=objective,
        status=result.get("status", "optimal"),
        hard_constraints=hard_constraints or {},
        allowed_ranges=allowed_ranges or decision_variables,
        recommended_configuration=result.get("recommendedConfiguration"),
        projected_outcomes=result.get("projectedOutcomes"),
        constraint_status=result.get("constraintStatus", []),
        slack=result.get("slack", []),
        feasible_candidates=result.get("feasibleCandidates", []),
        feasible_solutions=result.get("feasibleSolutions", []),
        pareto_frontier=result.get("paretoFrontier", []),
        results=result.get("results", []),
        summary=result.get("summary", {}),
        sensitivity=result.get("sensitivity", []),
        tradeoffs=result.get("tradeoffs", []),
        disclaimer=result.get("disclaimer"),
    )
    await db[OPTIMIZATIONS_COLLECTION].insert_one(doc.to_mongo())

    return result


async def get_optimizer_workspace(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> dict[str, Any]:
    """
    Retrieves the full optimizer workspace for the authenticated tenant.
    If no prior optimization exists, solves a baseline problem.
    """
    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    quality = dataset.data_quality_score if dataset else 100.0
    dataset_id = dataset.id if dataset else ""
    latest_run = await db[OPTIMIZATIONS_COLLECTION].find_one(
        {"organization_id": auth.org_id, "dataset_id": dataset_id},
        sort=[("created_at", -1)],
    )

    scatter_list: list[dict[str, Any]] = []
    pareto_list: list[dict[str, Any]] = []

    if latest_run:
        result = latest_run
        status_val = result.get("status", "optimal")
        objective_val = result.get("objective", "maximize_gross_profit")
        rec_config = result.get("recommended_configuration")
        proj_outcomes = result.get("projected_outcomes")
        constraints_list = result.get("constraint_status", []) or []
        slack_list = result.get("slack", []) or []
        candidates_list = result.get("feasible_candidates", []) or []
        scatter_list = result.get("feasible_solutions", []) or []
        pareto_list = result.get("pareto_frontier", []) or []
        results_rows = result.get("results", []) or []
        summary_val = result.get("summary", {}) or {}
        tradeoffs_val = result.get("tradeoffs", []) or []
    else:
        # Generate initial optimal solution
        solve_res = await solve_optimization(
            db=db,
            auth=auth,
            objective="maximize_gross_profit",
        )
        status_val = solve_res.get("status", "optimal")
        objective_val = solve_res.get("objective", "maximize_gross_profit")
        rec_config = solve_res.get("recommendedConfiguration")
        proj_outcomes = solve_res.get("projectedOutcomes")
        constraints_list = solve_res.get("constraintStatus", [])
        slack_list = solve_res.get("slack", [])
        candidates_list = solve_res.get("feasibleCandidates", [])
        scatter_list = solve_res.get("feasibleSolutions", [])
        pareto_list = solve_res.get("paretoFrontier", [])
        results_rows = solve_res.get("results", [])
        summary_val = solve_res.get("summary", {})
        tradeoffs_val = solve_res.get("tradeoffs", [])

    # Baseline "current" levers come from the same engine calibration as solve(),
    # not from mock optimized values (1.65 / 1050 / 108).
    optimizer = DeterministicGridSearchOptimizer.from_dataframe(
        df=df,
        currency=business.currency or "INR",
        data_quality_score=quality,
    )
    current_mktg = optimizer.base_mktg
    current_inv = optimizer.base_inv
    current_price = optimizer.base_price
    # Use real monetary price for display when available; otherwise fall back to grid-scale
    real_price = optimizer.real_price_baseline if optimizer.real_price_baseline > 0 else optimizer.base_price

    opt_mktg = current_mktg
    opt_inv = current_inv
    opt_price = real_price   # real monetary price for display
    if rec_config:
        if rec_config.get("marketingBudgetNum") is not None:
            opt_mktg = rec_config["marketingBudgetNum"] / 10_000_000.0
        if rec_config.get("workingInventoryNum") is not None:
            opt_inv = float(rec_config["workingInventoryNum"])
        # Use the real monetary optimised price if available; grid-value fallback otherwise
        if rec_config.get("unitPriceNum") is not None:
            opt_price = float(rec_config["unitPriceNum"])

    decision_vars = [
        {
            "key": "marketingBudget",
            "label": "Marketing Budget",
            "unit": "₹ Cr",
            "min": 1.0,
            "max": 2.5,
            "step": 0.15,
            "currentValue": current_mktg,
            "optimizedValue": opt_mktg,
            "description": "Total discretionary digital acquisition and brand spend across channels.",
        },
        {
            "key": "workingInventory",
            "label": "Working Inventory",
            "unit": "units",
            "min": 600.0,
            "max": 1500.0,
            "step": 100.0,
            "currentValue": current_inv,
            "optimizedValue": opt_inv,
            "description": "Base active inventory held in fulfillment centers.",
        },
        {
            "key": "unitPrice",
            "label": "Unit Price",
            "unit": "₹",
            "min": 95.0,
            "max": 120.0,
            "step": 2.5,
            "currentValue": real_price,
            "optimizedValue": opt_price,
            "realPriceBaseline": optimizer.real_price_baseline,
            "priceSource": "DATA_DERIVED" if optimizer.real_price_baseline > 0 else "MODEL_ASSUMPTION",
            "description": "Average retail unit sales price. "
                + (
                    f"Dataset baseline: {format_currency_value(optimizer.real_price_baseline, business.currency or 'INR')}/unit. "
                    "Grid range 95–120 represents ±5%–+20% relative price changes."
                    if optimizer.real_price_baseline > 0
                    else "Price displayed in internal model-scale units (100 = baseline). Upload a dataset with 'quantity' or 'unit_price' columns to see real monetary price."
                ),
        },
    ]

    slack_by_id = {s.get("constraintId"): s for s in slack_list or []}
    hard_constraints = []
    for c in constraints_list or []:
        slack_item = slack_by_id.get(c.get("id"), {})
        rule = c.get("rule") or ""
        operator = c.get("operator")
        if not operator:
            operator = "lte" if ("≤" in rule or "<=" in rule) else "gte"
        hard_constraints.append({
            **c,
            "operator": operator,
            "slackValue": slack_item.get("slackValue", 0),
            "slackDisplay": slack_item.get("slackDisplay", ""),
            "slackPercent": slack_item.get("slackPercent", 0),
        })

    history = await list_optimization_history(db, auth)

    # Do not present a discrete Pareto frontier unless the stored feasible
    # set is complete (older runs truncated to 15 ranked candidates).
    feasible_count = int(summary_val.get("feasibleConfigurations") or 0)
    if pareto_list and feasible_count and len(candidates_list) < feasible_count:
        pareto_list = []

    return {
        "objective": objective_val,
        "status": status_val,
        "objectives": get_supported_objectives(),
        "decisionVariables": decision_vars,
        "hardConstraints": hard_constraints,
        "results": results_rows,
        "recommendation": rec_config,
        "recommendedConfiguration": rec_config,
        "projectedOutcomes": proj_outcomes,
        "slack": slack_list,
        "feasibleCandidates": candidates_list,
        "feasibleSolutions": scatter_list,
        "paretoFrontier": pareto_list,
        "summary": summary_val,
        "sensitivity": [],
        "tradeoffs": tradeoffs_val,
        "history": history,
    }


async def list_optimization_history(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[dict[str, Any]]:
    """Returns past optimization runs for the authenticated organization."""
    cursor = db[OPTIMIZATIONS_COLLECTION].find(
        {"organization_id": auth.org_id}
    ).sort("created_at", -1).limit(20)

    history = []
    async for doc in cursor:
        run = OptimizerRunDocument.from_mongo(doc)
        history.append({
            "id": run.id,
            "timestamp": run.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "objective": run.objective,
            "status": run.status,
            "result": (
                run.recommended_configuration.get("improvementVsCurrent", "Feasible solution found")
                if run.recommended_configuration
                else "Infeasible constraints"
            ),
        })
    return history
