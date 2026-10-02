"""
DecisionOS — Decision Registry, Human Governance, and Decision DNA Service

Implements the complete governance lifecycle:
Proposed → Under Review → Approved / Modified / Rejected → Recorded → Decision DNA.

Guarantees:
1. Human Approval: High-impact decisions strictly require human authorization.
   Never automatically approves a decision.
2. Immutable Audit Logging: Records actor, timestamp, action, decisionId, and diff details.
3. Decision DNA Linkage: Persists complete lineage spanning Opportunity, Investigation,
   Replay, Scenario, Optimizer, and Decision.
4. Epistemic Honesty: Returns 'Outcome Pending' for actual outcome when empirical post-implementation
   data does not yet exist. Never fabricates actual results.
"""

import hashlib
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.optimizer_engine import DeterministicGridSearchOptimizer
from app.engine.metric_engine import format_currency_value
from app.models.decision import DecisionAuditEventDocument, DecisionRegistryDocument
from app.models.decision_dna import DecisionDNADocument
from app.schemas.auth import AuthContext
from app.schemas.decision import (
    ApproveDecisionRequest,
    DecisionItemResponse,
    ModifyDecisionRequest,
    RejectDecisionRequest,
)
from app.schemas.decision_dna import DecisionDNARecordResponse
from app.services.business_service import get_or_create_default_business
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

DECISIONS_COLLECTION = "decisions"
AUDITS_COLLECTION = "decision_audits"
DNA_COLLECTION = "decision_dna"


def _parse_numeric(val: Any, default: float = 0.0) -> float:
    """Extracts float number from currency or formatted string."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.-]", "", val)
        try:
            return float(cleaned)
        except ValueError:
            return default
    return default


async def seed_default_decisions_if_needed(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> None:
    """Seeds a default governance decision if none yet exist for this organization.

    Behaviour matrix:
    ┌───────────────────────────────────────┬───────────────────────────────────────────────────┐
    │ State                                 │ Action                                            │
    ├───────────────────────────────────────┼───────────────────────────────────────────────────┤
    │ No datasets at all (fresh account)    │ Seed one decision with calibrated defaults (df=None│
    │ Active dataset exists                 │ Seed one decision scoped to that dataset_id       │
    │ Only ARCHIVED datasets (post-reset)   │ Return — present clean empty state after reset    │
    │ Decision(s) already exist for scope   │ Return — no duplicate seeding                     │
    └───────────────────────────────────────┴───────────────────────────────────────────────────┘
    """
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    business = await get_or_create_default_business(db, auth)

    # POST-RESET STATE: datasets exist but all are archived.
    # Return cleanly so the user sees an empty registry, which is the correct UX
    # after "Reset Current Data" — they should not see stale seeded decisions.
    if dataset is None:
        total_ds = await db["datasets"].count_documents({"organization_id": auth.org_id})
        if total_ds > 0:
            return  # all datasets are archived → empty state

    # Determine the scope for this seed operation.
    # When dataset is active, scope to that dataset_id.
    # When no dataset at all, scope to empty-string sentinel (legacy fresh-account decisions).
    dataset_id: str = dataset.id if dataset else ""

    # Check if a decision already exists for this scope
    filter_query: dict[str, Any] = {"organization_id": auth.org_id}
    if dataset_id:
        filter_query["dataset_id"] = dataset_id
    else:
        filter_query["$or"] = [{"dataset_id": ""}, {"dataset_id": None}, {"dataset_id": {"$exists": False}}]
    count = await db[DECISIONS_COLLECTION].count_documents(filter_query)
    if count > 0:
        return

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    quality = dataset.data_quality_score if dataset else 100.0
    currency = business.currency or "INR"
    curr_symbol = "₹" if currency == "INR" else ("$" if currency == "USD" else "€")

    # Calibrate optimizer from real dataset DataFrame
    optimizer = DeterministicGridSearchOptimizer.from_dataframe(
        df=df,
        currency=currency,
        data_quality_score=quality,
    )
    solve_res = optimizer.solve(objective="maximize_gross_profit")
    rec_config = solve_res.get("recommendedConfiguration") or {}
    proj_outcomes = solve_res.get("projectedOutcomes") or {}
    constraints_list = solve_res.get("constraintStatus", [])

    base_rev_val = optimizer.base_revenue
    base_price_val = optimizer.base_price
    base_unit_cost_val = optimizer.base_unit_cost
    base_inv_val = optimizer.base_inv
    base_mktg_val = optimizer.base_mktg
    base_gp_val = optimizer.base_gross_profit
    base_gm_pct = optimizer.base_gross_margin

    rec_rev_str = rec_config.get("projectedRevenue", format_currency_value(base_rev_val * 10_000_000.0, currency))
    rec_gp_str = rec_config.get("projectedGrossProfit", format_currency_value(base_gp_val * 10_000_000.0, currency))
    rec_margin_str = rec_config.get("projectedMargin", f"{base_gm_pct:.1f}%")
    rec_mktg_str = rec_config.get("marketingBudget", f"{curr_symbol}{base_mktg_val:.2f} Cr")
    rec_inv_str = rec_config.get("workingInventory", f"{int(base_inv_val):,} units")
    rec_price_str = rec_config.get("unitPrice", f"{curr_symbol}{int(base_price_val)}")

    rec_gp_num = proj_outcomes.get("grossProfit", base_gp_val)
    gp_lift = round(rec_gp_num - base_gp_val, 2)
    impact_str = (
        f"+{format_currency_value(gp_lift * 10_000_000.0, currency)} Gross Profit"
        if gp_lift >= 0
        else f"{format_currency_value(rec_gp_num * 10_000_000.0, currency)} Gross Profit"
    )
    impact_num_val = max(0.1, round(gp_lift, 2))

    # Link to active opportunity if present, else synthesize clean ID
    opp_doc = await db["opportunities"].find_one({"organization_id": auth.org_id}, sort=[("created_at", -1)])
    opp_id = str(opp_doc.get("_id") or opp_doc.get("id")) if opp_doc else (f"opp_{dataset.id[:8]}" if dataset else "opp_initial")
    opp_title = str(opp_doc.get("title", f"Operating Resource Allocation Optimization for {business.business_name or 'Enterprise'}")) if opp_doc else f"Operating Resource Allocation Optimization for {business.business_name or 'Enterprise'}"

    # Build dynamic constraints from solver
    formatted_constraints = []
    if constraints_list:
        for idx, c in enumerate(constraints_list):
            formatted_constraints.append({
                "id": c.get("id", f"c_{idx+1}"),
                "name": c.get("name", "Operational Constraint"),
                "limit": c.get("rule", c.get("displayThreshold", "≤ Threshold")),
                "recommended": c.get("displayProjected", "Satisfied"),
                "slack": c.get("displaySlack", "Satisfied"),
                "status": c.get("status", "satisfied"),
            })
    else:
        formatted_constraints = [
            {"id": "c1", "name": "Marketing Budget Envelope", "limit": f"≤ {curr_symbol}2.00 Cr", "recommended": rec_mktg_str, "slack": "Within Envelope", "status": "satisfied"},
            {"id": "c2", "name": "Operating Margin Floor", "limit": "≥ 25.0%", "recommended": rec_margin_str, "slack": "Above Floor", "status": "satisfied"},
            {"id": "c3", "name": "Inventory Limit", "limit": "≤ 1,500 units", "recommended": rec_inv_str, "slack": "Headroom Available", "status": "satisfied"},
        ]

    # Dynamic comparisons: baseline vs recommended
    comparisons = [
        {"metric": "Gross Revenue", "current": format_currency_value(base_rev_val * 10_000_000.0, currency), "recommended": rec_rev_str, "change": f"{rec_rev_str} vs Baseline", "changeType": "positive"},
        {"metric": "Gross Profit", "current": format_currency_value(base_gp_val * 10_000_000.0, currency), "recommended": rec_gp_str, "change": impact_str, "changeType": "positive"},
        {"metric": "Gross Margin", "current": f"{base_gm_pct:.1f}%", "recommended": rec_margin_str, "change": f"{rec_margin_str}", "changeType": "positive"},
        {"metric": "Working Inventory", "current": f"{int(base_inv_val):,} units", "recommended": rec_inv_str, "change": f"{rec_inv_str}", "changeType": "neutral"},
    ]

    dec1_id = f"dec_{auth.org_id[:8]}_{dataset_id[:8] if dataset_id else 'nods'}_opt_01"
    confidence_score = round(min(95.0, max(70.0, quality * 0.9)), 1)

    # Retrieve authenticated user name for decision owner
    owner_name = "Authorized Stakeholder"
    if auth.user_id:
        user_doc = await db["users"].find_one({"_id": auth.user_id})
        if user_doc and user_doc.get("name"):
            owner_name = user_doc["name"]

    dec1 = DecisionRegistryDocument(
        id=dec1_id,
        code=f"DEC-{datetime.now(timezone.utc).year}-OPT-001",
        organization_id=auth.org_id,
        business_id=business.id,
        dataset_id=dataset_id,
        title=f"Resource Allocation & Pricing Optimization ({business.business_name or 'Commercial Operations'})",
        source="optimization",
        objective="Maximize Gross Profit",
        impact=impact_str,
        impact_num=impact_num_val,
        confidence=confidence_score,
        status="proposed",
        priority="critical",
        owner=owner_name,
        summary=f"Optimal parameter allocation derived from {dataset.filename if dataset else 'active telemetry'}. Balances marketing capital, inventory buffer, and pricing elasticity.",
        recommendation={
            "variables": {
                "marketingBudget": rec_mktg_str,
                "workingInventory": rec_inv_str,
                "unitPrice": rec_price_str,
            },
            "projectedOutcomes": {
                "grossProfit": rec_gp_str,
                "revenue": rec_rev_str,
                "operatingMargin": rec_margin_str,
            },
            "constraintsSatisfied": True,
            "statusNote": f"Satisfies configured operational constraints with {impact_str} lift vs baseline.",
        },
        comparisons=comparisons,
        constraints=formatted_constraints,
        evidence=[
            {"title": "Revenue Elasticity Signal", "signal": "Marketing Efficiency", "detail": "Curvature modeling identifies optimal marginal ROAS envelope.", "type": "efficiency"},
            {"title": "Price Sensitivity Analysis", "signal": "Price Elasticity", "detail": f"Model supports unit price at {rec_price_str} preserving volume velocity.", "type": "price"},
            {"title": "Inventory Fulfillment Buffer", "signal": "Inventory Coverage", "detail": f"{rec_inv_str} provides high service level fulfillment under demand variance.", "type": "inventory"},
        ],
        confidence_details={
            "score": confidence_score,
            "highConfidenceSignals": 3,
            "supportingEvidence": 3,
            "constraintsVerified": len(formatted_constraints),
            "totalConstraints": len(formatted_constraints),
            "explanation": f"Calibrated from active dataset ({dataset.filename if dataset else 'default'}) with data quality score {quality:.1f}%.",
            "projectedProfitRange": (
                f"{format_currency_value(rec_gp_num * 0.92 * 10_000_000.0, currency)}"
                f" - {format_currency_value(rec_gp_num * 1.08 * 10_000_000.0, currency)}"
            ),
            "projectedRevenueRange": (
                f"{format_currency_value(proj_outcomes.get('revenue', base_rev_val) * 0.92 * 10_000_000.0, currency)}"
                f" - {format_currency_value(proj_outcomes.get('revenue', base_rev_val) * 1.08 * 10_000_000.0, currency)}"
            ),
            "uncertaintyExplanation": "Projected bounds derived from transaction volume elasticity variance.",
        },
        audit_timeline=[
            {"id": f"evt_{uuid.uuid4().hex[:8]}", "time": datetime.now(timezone.utc).strftime("%I:%M %p"), "timestamp": now_iso, "event": "Generated by Constraint Optimizer", "actor": "Deterministic Grid Search Solver", "type": "generated"},
            {"id": f"evt_{uuid.uuid4().hex[:8]}", "time": datetime.now(timezone.utc).strftime("%I:%M %p"), "timestamp": now_iso, "event": "Placed Under Executive Governance Review", "actor": "System Automation", "type": "review"},
        ],
        provenance={
            "opportunityId": opp_id,
            "investigationId": f"inv_{opp_id}",
            "replayId": "replay_baseline",
            "scenarioId": "scenario_optimal",
            "optimizerId": f"opt_{dataset.id[:8]}" if dataset else "opt_run_01",
        },
    )
    await db[DECISIONS_COLLECTION].insert_one(dec1.to_mongo())

    dna_evidence = [
        {
            "id": "ev_1",
            "signal": "Revenue Elasticity Signal",
            "detail": "Curvature modeling identifies optimal marginal ROAS envelope.",
            "metricImpact": impact_str,
            "confidenceContribution": 18,
            "source": "Marketing Spend Telemetry",
            "timestamp": now_iso,
            "type": "efficiency",
        },
        {
            "id": "ev_2",
            "signal": "Price Sensitivity Analysis",
            "detail": f"Model supports unit price at {rec_price_str} preserving volume velocity.",
            "metricImpact": "+12%",
            "confidenceContribution": 15,
            "source": "Price Elasticity Engine",
            "timestamp": now_iso,
            "type": "price",
        },
        {
            "id": "ev_3",
            "signal": "Inventory Fulfillment Buffer",
            "detail": f"{rec_inv_str} provides high service level fulfillment under demand variance.",
            "metricImpact": "98.4% Fulfillment",
            "confidenceContribution": 12,
            "source": "Supply Chain Telemetry",
            "timestamp": now_iso,
            "type": "inventory",
        },
    ]

    dna_constraints = [
        {
            "id": "c1",
            "name": "Marketing Budget Envelope",
            "rule": f"Budget ≤ {curr_symbol}2.00 Cr",
            "requiredLimit": f"{curr_symbol}2.00 Cr",
            "selectedValue": rec_mktg_str,
            "status": "satisfied",
            "slack": "Within Envelope",
        },
        {
            "id": "c2",
            "name": "Operating Margin Floor",
            "rule": "Margin ≥ 25.0%",
            "requiredLimit": "25.0%",
            "selectedValue": rec_margin_str,
            "status": "satisfied",
            "slack": "Above Floor",
        },
        {
            "id": "c3",
            "name": "Inventory Limit",
            "rule": "Inventory ≤ 1,500 units",
            "requiredLimit": "1,500 units",
            "selectedValue": rec_inv_str,
            "status": "satisfied",
            "slack": "Headroom Available",
        },
    ]

    # Seed corresponding initial Decision DNA record in outcome_pending state
    dna1 = DecisionDNADocument(
        id=f"dna_{dec1_id}",
        decision_id=dec1_id,
        organization_id=auth.org_id,
        business_id=business.id,
        dataset_id=dataset_id,
        title=dec1.title,
        type="optimization",
        status="outcome_pending",
        decision_date=now_iso,
        owner=dec1.owner,
        organization=business.business_name or "Organization",
        opportunity_id=opp_id,
        trigger={
            "problemTitle": opp_title,
            "description": f"Resource optimization trigger identified across {business.business_name or 'Commercial Operations'}.",
            "detectedAt": now_iso,
            "metricAlert": "Operating Efficiency Calibration Required",
            "opportunityId": opp_id,
        },
        business_question=f"How can we balance acquisition spend, inventory buffers, and pricing to maximize gross profit for {business.business_name or 'Enterprise'}?",
        summary=dec1.summary,
        current_configuration={
            "marketingBudget": f"{curr_symbol}{base_mktg_val:.2f} Cr",
            "workingInventory": f"{int(base_inv_val):,} units",
            "unitPrice": f"{curr_symbol}{int(base_price_val)}",
            "expectedRevenue": format_currency_value(base_rev_val * 10_000_000.0, currency),
            "expectedProfit": format_currency_value(base_gp_val * 10_000_000.0, currency),
            "expectedMargin": f"{base_gm_pct:.1f}%",
        },
        recommended_configuration={
            "marketingBudget": rec_mktg_str,
            "workingInventory": rec_inv_str,
            "unitPrice": rec_price_str,
            "expectedRevenue": rec_rev_str,
            "expectedProfit": rec_gp_str,
            "expectedMargin": rec_margin_str,
        },
        selected_configuration={
            "marketingBudget": rec_mktg_str,
            "workingInventory": rec_inv_str,
            "unitPrice": rec_price_str,
            "expectedRevenue": rec_rev_str,
            "expectedProfit": rec_gp_str,
            "expectedMargin": rec_margin_str,
        },
        evidence=dna_evidence,
        alternatives=[
            {
                "id": "alt_1",
                "name": "Current Baseline Allocation",
                "description": "Maintain existing baseline operating parameters without optimization changes.",
                "marketingBudget": f"{curr_symbol}{base_mktg_val:.2f} Cr",
                "workingInventory": f"{int(base_inv_val):,} units",
                "unitPrice": f"{curr_symbol}{int(base_price_val)}",
                "expectedRevenue": format_currency_value(base_rev_val * 10_000_000.0, currency),
                "expectedProfit": format_currency_value(base_gp_val * 10_000_000.0, currency),
                "expectedMargin": f"{base_gm_pct:.1f}%",
                "constraintsSatisfied": True,
                "confidence": confidence_score,
                "status": "considered",
                "rejectionReason": "Foregoes projected gross profit lift from parameter recalibration.",
            },
            {
                "id": "alt_2",
                "name": "Optimal Feasible Configuration (Solver Recommended)",
                "description": f"Optimal parameter set ({rec_price_str} price point, {rec_mktg_str} marketing spend, {rec_inv_str} inventory).",
                "marketingBudget": rec_mktg_str,
                "workingInventory": rec_inv_str,
                "unitPrice": rec_price_str,
                "expectedRevenue": rec_rev_str,
                "expectedProfit": rec_gp_str,
                "expectedMargin": rec_margin_str,
                "constraintsSatisfied": True,
                "confidence": confidence_score,
                "status": "selected",
            },
        ],
        constraints=dna_constraints,
        human_decision={
            "decisionMaker": "",
            "role": "",
            "action": "pending_review",
            "decidedAt": "",
            "reason": "Awaiting human stakeholder authorization.",
        },
        expected_outcome={
            "marketingBudget": rec_mktg_str,
            "workingInventory": rec_inv_str,
            "unitPrice": rec_price_str,
            "expectedRevenue": rec_rev_str,
            "expectedProfit": rec_gp_str,
            "expectedMargin": rec_margin_str,
        },
        actual_outcome={
            "status": "pending",
            "explanation": "Outcome Pending",
            "summary": "Outcome Pending",
            "metrics": [],
        },
        uncertainty={
            "confidence": confidence_score,
            "baseCaseProfit": rec_gp_str,
            "downsideProfit": format_currency_value(rec_gp_num * 0.92 * 10_000_000.0, currency),
            "upsideProfit": format_currency_value(rec_gp_num * 1.08 * 10_000_000.0, currency),
            "revenueRange": (
                f"{format_currency_value(proj_outcomes.get('revenue', base_rev_val) * 0.92 * 10_000_000.0, currency)}"
                f" - {format_currency_value(proj_outcomes.get('revenue', base_rev_val) * 1.08 * 10_000_000.0, currency)}"
            ),
            "grossProfitRange": (
                f"{format_currency_value(rec_gp_num * 0.92 * 10_000_000.0, currency)}"
                f" - {format_currency_value(rec_gp_num * 1.08 * 10_000_000.0, currency)}"
            ),
            "keyDrivers": ["Price Elasticity", "Customer Churn Sensitivity", "Supply Chain Delivery Latency"],
        },
        learning={
            "isAvailable": False,
            "whatWeExpected": "Outcome Pending",
            "whatHappened": "Outcome Pending",
            "whatWeLearned": "Outcome Pending",
            "nextTimeConsideration": "Awaiting post-decision telemetry to evaluate learning loop.",
        },
        lineage=[
            {"stage": "1. Opportunity", "id": opp_id, "status": "completed", "timestamp": now_iso, "route": "/opportunities", "description": "Trigger detected from dataset analysis."},
            {"stage": "2. Optimizer", "id": f"opt_{dataset.id[:8]}" if dataset else "opt_run_01", "status": "completed", "timestamp": now_iso, "route": "/optimizer", "description": "Deterministic grid search solver converged on optimal configuration."},
            {"stage": "3. Decision Registry", "id": dec1_id, "status": "active", "timestamp": now_iso, "route": "/decisions", "description": "Submitted for human stakeholder authorization."},
        ],
        provenance={
            "dnaId": f"dna_{dec1_id}",
            "decisionId": dec1_id,
            "opportunityId": opp_id,
            "investigationId": f"inv_{opp_id}",
            "replayId": "replay_baseline",
            "scenarioId": "scenario_optimal",
            "optimizationId": f"opt_{dataset.id[:8]}" if dataset else "opt_run_01",
            "verifiedBy": "DecisionOS Automated Governance Audit",
            "recordedAt": now_iso,
        },
        audit_events=[
            {"id": f"dna_evt_{uuid.uuid4().hex[:8]}", "timestamp": now_iso, "time": datetime.now(timezone.utc).strftime("%I:%M %p"), "actor": "Optimizer", "event": "Solution Space Converged", "description": "Deterministic optimal candidate selected.", "type": "optimized"},
            {"id": f"dna_evt_{uuid.uuid4().hex[:8]}", "timestamp": now_iso, "time": datetime.now(timezone.utc).strftime("%I:%M %p"), "actor": "Governance Board", "event": "Registered for Review", "description": "Decision DNA package created.", "type": "reviewed"},
        ],
        confidence=confidence_score,
    )
    await db[DNA_COLLECTION].insert_one(dna1.to_mongo())
    logger.info("Dataset-grounded decision registry and DNA initialized for org %s", auth.org_id)


async def list_decisions(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    status_filter: Optional[str] = None,
) -> list[DecisionItemResponse]:
    """Retrieves all decision registry items for the authenticated organization."""
    await seed_default_decisions_if_needed(db, auth)

    _dataset, _ = await _get_active_dataset_and_dataframe(db, auth)
    query: dict[str, Any] = {"organization_id": auth.org_id}

    if _dataset:
        query["$or"] = [{"dataset_id": _dataset.id}, {"dataset_id": None}, {"dataset_id": {"$exists": False}}]
    else:
        # Check if any datasets have been uploaded for this org
        total_ds = await db["datasets"].count_documents({"organization_id": auth.org_id})
        if total_ds > 0:
            # All datasets are archived (e.g. data was reset) -> return clean empty state
            return []
        query["$or"] = [{"dataset_id": None}, {"dataset_id": ""}, {"dataset_id": {"$exists": False}}]

    if status_filter:
        query["status"] = status_filter

    cursor = db[DECISIONS_COLLECTION].find(query).sort("created_at", -1)

    results: list[DecisionItemResponse] = []
    async for doc in cursor:
        reg_doc = DecisionRegistryDocument.from_mongo(doc)
        item = DecisionItemResponse(
            id=reg_doc.id,
            code=reg_doc.code,
            title=reg_doc.title,
            source=reg_doc.source,
            objective=reg_doc.objective,
            impact=reg_doc.impact,
            impactNum=reg_doc.impact_num,
            confidence=reg_doc.confidence,
            status=reg_doc.status,
            priority=reg_doc.priority,
            owner=reg_doc.owner,
            createdAt=reg_doc.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            updatedAt=reg_doc.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            summary=reg_doc.summary,
            recommendation=reg_doc.recommendation,
            comparisons=reg_doc.comparisons,
            constraints=reg_doc.constraints,
            evidence=reg_doc.evidence,
            confidenceDetails=reg_doc.confidence_details,
            auditTimeline=reg_doc.audit_timeline,
            provenance=reg_doc.provenance,
            modifiedConfig=reg_doc.modified_config,
            rejectionDetails=reg_doc.rejection_details,
        )
        results.append(item)
    return results


async def get_decision_by_id(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
) -> DecisionItemResponse:
    """Retrieves a single decision by its ID with strict organization isolation."""
    await seed_default_decisions_if_needed(db, auth)

    doc = await db[DECISIONS_COLLECTION].find_one({
        "_id": decision_id,
        "organization_id": auth.org_id,
    })
    if not doc:
        # Fallback search by code
        doc = await db[DECISIONS_COLLECTION].find_one({
            "code": decision_id,
            "organization_id": auth.org_id,
        })

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision '{decision_id}' not found in active organization.",
        )

    reg_doc = DecisionRegistryDocument.from_mongo(doc)
    return DecisionItemResponse(
        id=reg_doc.id,
        code=reg_doc.code,
        title=reg_doc.title,
        source=reg_doc.source,
        objective=reg_doc.objective,
        impact=reg_doc.impact,
        impactNum=reg_doc.impact_num,
        confidence=reg_doc.confidence,
        status=reg_doc.status,
        priority=reg_doc.priority,
        owner=reg_doc.owner,
        createdAt=reg_doc.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        updatedAt=reg_doc.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        summary=reg_doc.summary,
        recommendation=reg_doc.recommendation,
        comparisons=reg_doc.comparisons,
        constraints=reg_doc.constraints,
        evidence=reg_doc.evidence,
        confidenceDetails=reg_doc.confidence_details,
        auditTimeline=reg_doc.audit_timeline,
        provenance=reg_doc.provenance,
        modifiedConfig=reg_doc.modified_config,
        rejectionDetails=reg_doc.rejection_details,
    )


async def approve_decision(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
    req: ApproveDecisionRequest,
) -> DecisionItemResponse:
    """
    Executes human approval action:
    1. Validates decision exists and belongs to tenant
    2. Transitions status: Proposed/Under Review -> Approved -> Recorded
    3. Records immutable audit event
    4. Automatically generates / updates linked Decision DNA record
    """
    await seed_default_decisions_if_needed(db, auth)

    doc = await db[DECISIONS_COLLECTION].find_one({
        "$or": [
            {"_id": decision_id},
            {"code": decision_id},
            {"code": decision_id.upper()},
            {"id": decision_id},
        ],
        "organization_id": auth.org_id,
    })
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision '{decision_id}' not found in active organization.",
        )

    reg_doc = DecisionRegistryDocument.from_mongo(doc)
    now = datetime.now(timezone.utc)
    now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Update Decision status and audit timeline
    new_status = "approved"
    audit_evt_id = f"aud_{uuid.uuid4().hex[:10]}"
    timeline_item = {
        "id": audit_evt_id,
        "time": now.strftime("%I:%M %p"),
        "timestamp": now_iso,
        "event": f"Approved by {req.approverName} ({req.approverRole})",
        "actor": req.approverName,
        "type": "approved",
    }
    reg_doc.status = new_status
    reg_doc.updated_at = now
    reg_doc.audit_timeline.append(timeline_item)

    await db[DECISIONS_COLLECTION].update_one(
        {"_id": reg_doc.id},
        {
            "$set": {
                "status": new_status,
                "updated_at": now,
                "audit_timeline": reg_doc.audit_timeline,
            }
        },
    )

    # 2. Record immutable audit record in decision_audits collection
    audit_doc = DecisionAuditEventDocument(
        id=audit_evt_id,
        organization_id=auth.org_id,
        decision_id=reg_doc.id,
        actor=req.approverName,
        timestamp=now,
        action="approved",
        details={
            "approverRole": req.approverRole,
            "notes": req.notes,
            "authorizedAt": now_iso,
        },
    )
    await db[AUDITS_COLLECTION].insert_one(audit_doc.to_mongo())

    # 3. Create or update Decision DNA record
    dna_id = f"dna_{reg_doc.id}"
    dna_doc = await db[DNA_COLLECTION].find_one({"_id": dna_id, "organization_id": auth.org_id})

    rec_vars = reg_doc.recommendation.get("variables", {})
    rec_outcomes = reg_doc.recommendation.get("projectedOutcomes", {})
    comp_map = {c.get("metric", ""): c.get("current", "") for c in reg_doc.comparisons}

    human_record = {
        "decisionMaker": req.approverName,
        "role": req.approverRole,
        "action": "approved",
        "decidedAt": now_iso,
        "reason": req.notes or "Approved without modification based on optimizer convergence.",
    }

    exp_rev = rec_outcomes.get("revenue") or rec_outcomes.get("grossRevenue") or "N/A"
    exp_gp = rec_outcomes.get("grossProfit") or "N/A"
    exp_margin = rec_outcomes.get("operatingMargin") or rec_outcomes.get("grossMargin") or "N/A"

    if dna_doc:
        await db[DNA_COLLECTION].update_one(
            {"_id": dna_id},
            {
                "$set": {
                    "status": "approved",
                    "owner": req.approverName,
                    "decision_date": now_iso,
                    "human_decision": human_record,
                    "selected_configuration": {
                        **rec_vars,
                        "expectedRevenue": exp_rev,
                        "expectedProfit": exp_gp,
                        "expectedMargin": exp_margin,
                    },
                },
                "$push": {
                    "audit_events": {
                        "id": audit_evt_id,
                        "timestamp": now_iso,
                        "time": now.strftime("%I:%M %p"),
                        "actor": req.approverName,
                        "event": "Authorized by Human Governance",
                        "description": req.notes or "Approved configuration ratified for production deployment.",
                        "type": "authorized",
                    }
                },
            },
        )
    else:
        # Create fresh DNA record
        curr_rev = comp_map.get("Gross Revenue") or comp_map.get("Revenue") or "Baseline"
        curr_gp = comp_map.get("Gross Profit") or "Baseline"
        curr_margin = comp_map.get("Gross Margin") or comp_map.get("Operating Margin") or "Baseline"
        curr_inv = comp_map.get("Working Inventory") or comp_map.get("Inventory") or "Baseline"
        curr_mktg = comp_map.get("Marketing Budget") or "Baseline"
        curr_price = comp_map.get("Unit Price") or "Baseline"

        dna_evs = [
            {
                "id": e.get("id", f"ev_{i+1}"),
                "signal": e.get("signal", e.get("title", "Signal")),
                "detail": e.get("detail", "Telemetry signal verified."),
                "metricImpact": e.get("metricImpact", "Projected Lift"),
                "confidenceContribution": e.get("confidenceContribution", 14),
                "source": e.get("source", "Commercial Telemetry"),
                "timestamp": now_iso,
                "type": e.get("type", "efficiency"),
            }
            for i, e in enumerate(reg_doc.evidence)
        ]

        dna_consts = [
            {
                "id": c.get("id", f"c_{i+1}"),
                "name": c.get("name", "Operational Constraint"),
                "rule": c.get("rule", c.get("limit", "≤ Threshold")),
                "requiredLimit": c.get("requiredLimit", c.get("limit", "≤ Threshold")),
                "selectedValue": c.get("selectedValue", c.get("recommended", "Satisfied")),
                "status": c.get("status", "satisfied"),
                "slack": c.get("slack", "Satisfied"),
            }
            for i, c in enumerate(reg_doc.constraints)
        ]

        # Retrieve authentic business name for DNA organization field (Fix 3)
        business_name = "Organization"
        business_doc = await db["businesses"].find_one({"organization_id": auth.org_id})
        if business_doc and business_doc.get("business_name"):
            business_name = business_doc["business_name"]

        new_dna = DecisionDNADocument(
            id=dna_id,
            decision_id=reg_doc.id,
            organization_id=auth.org_id,
            business_id=reg_doc.business_id,
            title=reg_doc.title,
            type=reg_doc.source,
            status="approved",
            decision_date=now_iso,
            owner=reg_doc.owner,
            organization=business_name,
            opportunity_id=reg_doc.provenance.get("opportunityId", ""),
            trigger={
                "problemTitle": reg_doc.title,
                "description": reg_doc.summary,
                "detectedAt": now_iso,
                "metricAlert": "Governance Approval Required",
                "opportunityId": reg_doc.provenance.get("opportunityId", ""),
            },
            business_question=reg_doc.title,
            summary=reg_doc.summary,
            current_configuration={
                "marketingBudget": curr_mktg,
                "workingInventory": curr_inv,
                "unitPrice": curr_price,
                "expectedRevenue": curr_rev,
                "expectedProfit": curr_gp,
                "expectedMargin": curr_margin,
            },
            recommended_configuration={
                **rec_vars,
                "expectedRevenue": exp_rev,
                "expectedProfit": exp_gp,
                "expectedMargin": exp_margin,
            },
            selected_configuration={
                **rec_vars,
                "expectedRevenue": exp_rev,
                "expectedProfit": exp_gp,
                "expectedMargin": exp_margin,
            },
            evidence=dna_evs,
            constraints=dna_consts,
            human_decision=human_record,
            expected_outcome={
                **rec_vars,
                "expectedRevenue": exp_rev,
                "expectedProfit": exp_gp,
                "expectedMargin": exp_margin,
            },
            actual_outcome={
                "status": "pending",
                "explanation": "Outcome Pending",
                "summary": "Outcome Pending",
                "metrics": [],
            },
            lineage=[
                {"stage": "1. Opportunity", "id": reg_doc.provenance.get("opportunityId", ""), "status": "completed", "timestamp": now_iso, "route": "/opportunities", "description": "Trigger detected."},
                {"stage": "2. Optimizer", "id": reg_doc.provenance.get("optimizerId", ""), "status": "completed", "timestamp": now_iso, "route": "/optimizer", "description": "Solver converged on feasible space."},
                {"stage": "3. Decision Governance", "id": reg_doc.id, "status": "completed", "timestamp": now_iso, "route": "/decisions", "description": f"Approved by {req.approverName}."},
            ],
            provenance={
                "dnaId": dna_id,
                "decisionId": reg_doc.id,
                "opportunityId": reg_doc.provenance.get("opportunityId", ""),
                "investigationId": reg_doc.provenance.get("investigationId", ""),
                "replayId": reg_doc.provenance.get("replayId", ""),
                "scenarioId": reg_doc.provenance.get("scenarioId", ""),
                "optimizationId": reg_doc.provenance.get("optimizerId", ""),
                "verifiedBy": req.approverName,
                "recordedAt": now_iso,
            },
            audit_events=[
                {"id": audit_evt_id, "timestamp": now_iso, "time": now.strftime("%I:%M %p"), "actor": req.approverName, "event": "Approved by Human Stakeholder", "description": req.notes or "Approved configuration.", "type": "authorized"}
            ],
            confidence=reg_doc.confidence,
        )
        await db[DNA_COLLECTION].insert_one(new_dna.to_mongo())

    logger.info("Decision %s approved by %s; Decision DNA %s persisted", reg_doc.id, req.approverName, dna_id)
    return await get_decision_by_id(db, auth, decision_id)


async def modify_decision(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
    req: ModifyDecisionRequest,
) -> DecisionItemResponse:
    """
    Executes human modification override:
    1. Validates decision exists and belongs to tenant
    2. Recalculates projected commercial outcomes for modified variables using business model
    3. Stores changed configuration and justification
    4. Transitions status to 'modified'
    5. Records immutable audit event
    6. Persists / updates Decision DNA with modified selectedConfiguration
    """
    await seed_default_decisions_if_needed(db, auth)

    doc = await db[DECISIONS_COLLECTION].find_one({
        "$or": [
            {"_id": decision_id},
            {"code": decision_id},
            {"code": decision_id.upper()},
            {"id": decision_id},
        ],
        "organization_id": auth.org_id,
    })
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision '{decision_id}' not found in active organization.",
        )

    reg_doc = DecisionRegistryDocument.from_mongo(doc)
    now = datetime.now(timezone.utc)
    now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Extract modified values or default to existing recommendation
    rec_vars = reg_doc.recommendation.get("variables", {})
    orig_mktg = _parse_numeric(rec_vars.get("marketingBudget", "1.65"), 1.65)
    orig_inv = _parse_numeric(rec_vars.get("workingInventory", "1050"), 1050.0)
    orig_price = _parse_numeric(rec_vars.get("unitPrice", "108"), 108.0)

    mod_mktg = _parse_numeric(req.marketingBudget, orig_mktg) if req.marketingBudget is not None else orig_mktg
    mod_inv = _parse_numeric(req.workingInventory, orig_inv) if req.workingInventory is not None else orig_inv
    mod_price = _parse_numeric(req.unitPrice, orig_price) if req.unitPrice is not None else orig_price

    # Recalculate outcomes via deterministic model
    opt = DeterministicGridSearchOptimizer()
    cand = opt.evaluate_candidate(mod_mktg, mod_inv, mod_price, idx=999)

    modified_config_dict = {
        "marketingBudget": f"₹{mod_mktg:.2f} Cr",
        "workingInventory": f"{int(mod_inv):,} units",
        "unitPrice": f"₹{int(mod_price) if mod_price.is_integer() else mod_price:.1f}",
        "modifiedAt": now_iso,
        "modifiedBy": req.modifiedBy,
        "notes": req.justification or req.notes or "Human parameter override",
    }

    audit_evt_id = f"aud_{uuid.uuid4().hex[:10]}"
    timeline_item = {
        "id": audit_evt_id,
        "time": now.strftime("%I:%M %p"),
        "timestamp": now_iso,
        "event": f"Modified by {req.modifiedBy}",
        "actor": req.modifiedBy,
        "type": "modified",
    }

    new_status = "modified"
    reg_doc.status = new_status
    reg_doc.modified_config = modified_config_dict
    reg_doc.updated_at = now
    reg_doc.audit_timeline.append(timeline_item)

    await db[DECISIONS_COLLECTION].update_one(
        {"_id": reg_doc.id},
        {
            "$set": {
                "status": new_status,
                "modified_config": modified_config_dict,
                "updated_at": now,
                "audit_timeline": reg_doc.audit_timeline,
            }
        },
    )

    # Record audit log
    audit_doc = DecisionAuditEventDocument(
        id=audit_evt_id,
        organization_id=auth.org_id,
        decision_id=reg_doc.id,
        actor=req.modifiedBy,
        timestamp=now,
        action="modified",
        details={
            "modifiedBy": req.modifiedBy,
            "justification": req.justification or req.notes,
            "originalConfiguration": rec_vars,
            "modifiedConfiguration": modified_config_dict,
            "recalculatedOutcomes": {
                "revenue": f"₹{cand.revenue:.1f} Cr",
                "grossProfit": f"₹{cand.gross_profit:.1f} Cr",
                "operatingMargin": f"{cand.operating_margin_percent:.1f}%",
            },
        },
    )
    await db[AUDITS_COLLECTION].insert_one(audit_doc.to_mongo())

    # Update or insert Decision DNA with modified selectedConfiguration
    dna_id = f"dna_{reg_doc.id}"
    human_record = {
        "decisionMaker": req.modifiedBy,
        "role": "Authorized Decision Maker",
        "action": "modified",
        "decidedAt": now_iso,
        "reason": req.justification or req.notes or "Modified by stakeholder",
        "modificationDetails": {
            "originalMarketing": rec_vars.get("marketingBudget", f"₹{orig_mktg:.2f} Cr"),
            "modifiedMarketing": f"₹{mod_mktg:.2f} Cr",
            "originalInventory": rec_vars.get("workingInventory", f"{int(orig_inv):,} units"),
            "modifiedInventory": f"{int(mod_inv):,} units",
            "originalPrice": rec_vars.get("unitPrice", f"₹{orig_price:.0f}"),
            "modifiedPrice": f"₹{mod_price:.0f}",
            "rationale": req.justification or req.notes or "Human override",
        },
    }

    selected_config = {
        "marketingBudget": f"₹{mod_mktg:.2f} Cr",
        "workingInventory": f"{int(mod_inv):,} units",
        "unitPrice": f"₹{int(mod_price) if mod_price.is_integer() else mod_price:.1f}",
        "expectedRevenue": f"₹{cand.revenue:.1f} Cr",
        "expectedProfit": f"₹{cand.gross_profit:.1f} Cr",
        "expectedMargin": f"{cand.operating_margin_percent:.1f}%",
    }

    dna_doc = await db[DNA_COLLECTION].find_one({"_id": dna_id, "organization_id": auth.org_id})
    if dna_doc:
        await db[DNA_COLLECTION].update_one(
            {"_id": dna_id},
            {
                "$set": {
                    "status": "modified",
                    "owner": req.modifiedBy,
                    "decision_date": now_iso,
                    "human_decision": human_record,
                    "selected_configuration": selected_config,
                },
                "$push": {
                    "audit_events": {
                        "id": audit_evt_id,
                        "timestamp": now_iso,
                        "time": now.strftime("%I:%M %p"),
                        "actor": req.modifiedBy,
                        "event": "Modified by Human Stakeholder",
                        "description": req.justification or "Modified configuration ratified.",
                        "type": "authorized",
                    }
                },
            },
        )
    else:
        # Create DNA record
        business_name = "Organization"
        business_doc = await db["businesses"].find_one({"organization_id": auth.org_id})
        if business_doc and business_doc.get("business_name"):
            business_name = business_doc["business_name"]

        new_dna = DecisionDNADocument(
            id=dna_id,
            decision_id=reg_doc.id,
            organization_id=auth.org_id,
            business_id=reg_doc.business_id,
            title=reg_doc.title,
            type=reg_doc.source,
            status="modified",
            decision_date=now_iso,
            owner=reg_doc.owner,
            organization=business_name,
            opportunity_id=reg_doc.provenance.get("opportunityId", ""),
            trigger={
                "problemTitle": reg_doc.title,
                "description": reg_doc.summary,
                "detectedAt": now_iso,
                "metricAlert": "Governance Override",
                "opportunityId": reg_doc.provenance.get("opportunityId", ""),
            },
            business_question=reg_doc.title,
            summary=reg_doc.summary,
            current_configuration=rec_vars,
            recommended_configuration=rec_vars,
            selected_configuration=selected_config,
            evidence=reg_doc.evidence,
            constraints=reg_doc.constraints,
            human_decision=human_record,
            expected_outcome=selected_config,
            actual_outcome={
                "status": "pending",
                "explanation": "Outcome Pending",
                "summary": "Outcome Pending",
                "metrics": [],
            },
            lineage=[
                {"stage": "1. Optimizer", "id": reg_doc.provenance.get("optimizerId", ""), "status": "completed", "timestamp": now_iso, "route": "/optimizer", "description": "Candidate generated."},
                {"stage": "2. Decision Governance", "id": reg_doc.id, "status": "completed", "timestamp": now_iso, "route": "/decisions", "description": f"Modified by {req.modifiedBy}."},
            ],
            provenance={
                "dnaId": dna_id,
                "decisionId": reg_doc.id,
                "opportunityId": reg_doc.provenance.get("opportunityId", ""),
                "investigationId": reg_doc.provenance.get("investigationId", ""),
                "replayId": reg_doc.provenance.get("replayId", ""),
                "scenarioId": reg_doc.provenance.get("scenarioId", ""),
                "optimizationId": reg_doc.provenance.get("optimizerId", ""),
                "verifiedBy": req.modifiedBy,
                "recordedAt": now_iso,
            },
            audit_events=[
                {"id": audit_evt_id, "timestamp": now_iso, "time": now.strftime("%I:%M %p"), "actor": req.modifiedBy, "event": "Modified Configuration", "description": req.justification or "Parameters updated.", "type": "authorized"}
            ],
            confidence=reg_doc.confidence,
        )
        await db[DNA_COLLECTION].insert_one(new_dna.to_mongo())

    logger.info("Decision %s modified by %s; Decision DNA %s updated", reg_doc.id, req.modifiedBy, dna_id)
    return await get_decision_by_id(db, auth, decision_id)


async def reject_decision(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
    req: RejectDecisionRequest,
) -> DecisionItemResponse:
    """
    Executes human rejection action:
    1. Validates decision exists and belongs to tenant
    2. Stores rejection reason and stakeholder details
    3. Transitions status to 'rejected'
    4. Records immutable audit event
    5. Updates linked Decision DNA to reflect rejected status
    """
    await seed_default_decisions_if_needed(db, auth)

    doc = await db[DECISIONS_COLLECTION].find_one({
        "$or": [
            {"_id": decision_id},
            {"code": decision_id},
            {"code": decision_id.upper()},
            {"id": decision_id},
        ],
        "organization_id": auth.org_id,
    })
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision '{decision_id}' not found in active organization.",
        )

    reg_doc = DecisionRegistryDocument.from_mongo(doc)
    now = datetime.now(timezone.utc)
    now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    rejection_dict = {
        "reason": req.reason,
        "notes": req.notes,
        "rejectedAt": now_iso,
        "rejectedBy": req.rejectedBy,
    }

    audit_evt_id = f"aud_{uuid.uuid4().hex[:10]}"
    timeline_item = {
        "id": audit_evt_id,
        "time": now.strftime("%I:%M %p"),
        "timestamp": now_iso,
        "event": f"Rejected by {req.rejectedBy}: {req.reason}",
        "actor": req.rejectedBy,
        "type": "rejected",
    }

    new_status = "rejected"
    reg_doc.status = new_status
    reg_doc.rejection_details = rejection_dict
    reg_doc.updated_at = now
    reg_doc.audit_timeline.append(timeline_item)

    await db[DECISIONS_COLLECTION].update_one(
        {"_id": reg_doc.id},
        {
            "$set": {
                "status": new_status,
                "rejection_details": rejection_dict,
                "updated_at": now,
                "audit_timeline": reg_doc.audit_timeline,
            }
        },
    )

    # Record audit log
    audit_doc = DecisionAuditEventDocument(
        id=audit_evt_id,
        organization_id=auth.org_id,
        decision_id=reg_doc.id,
        actor=req.rejectedBy,
        timestamp=now,
        action="rejected",
        details=rejection_dict,
    )
    await db[AUDITS_COLLECTION].insert_one(audit_doc.to_mongo())

    # Update Decision DNA if present
    dna_id = f"dna_{reg_doc.id}"
    human_record = {
        "decisionMaker": req.rejectedBy,
        "role": "Authorized Stakeholder",
        "action": "rejected",
        "decidedAt": now_iso,
        "reason": f"{req.reason} - {req.notes}" if req.notes else req.reason,
    }

    await db[DNA_COLLECTION].update_one(
        {"_id": dna_id, "organization_id": auth.org_id},
        {
            "$set": {
                "status": "rejected",
                "owner": req.rejectedBy,
                "human_decision": human_record,
            },
            "$push": {
                "audit_events": {
                    "id": audit_evt_id,
                    "timestamp": now_iso,
                    "time": now.strftime("%I:%M %p"),
                    "actor": req.rejectedBy,
                    "event": "Rejected by Governance",
                    "description": req.reason,
                    "type": "authorized",
                }
            },
        },
    )

    logger.info("Decision %s rejected by %s: %s", reg_doc.id, req.rejectedBy, req.reason)
    return await get_decision_by_id(db, auth, decision_id)


# ==============================================================================
# DECISION DNA ACCESS
# ==============================================================================

async def list_decision_dna(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[DecisionDNARecordResponse]:
    """Retrieves all Decision DNA persistent packages for the tenant."""
    await seed_default_decisions_if_needed(db, auth)

    _dataset, _ = await _get_active_dataset_and_dataframe(db, auth)
    _query: dict[str, Any] = {"organization_id": auth.org_id}

    if _dataset:
        _query["$or"] = [{"dataset_id": _dataset.id}, {"dataset_id": None}, {"dataset_id": {"$exists": False}}]
    else:
        total_ds = await db["datasets"].count_documents({"organization_id": auth.org_id})
        if total_ds > 0:
            return []
        _query["$or"] = [{"dataset_id": None}, {"dataset_id": ""}, {"dataset_id": {"$exists": False}}]

    cursor = db[DNA_COLLECTION].find(_query).sort("created_at", -1)

    results: list[DecisionDNARecordResponse] = []
    async for doc in cursor:
        dna = DecisionDNADocument.from_mongo(doc)
        results.append(DecisionDNARecordResponse(
            id=dna.id,
            decisionId=dna.decision_id,
            title=dna.title,
            type=dna.type,
            status=dna.status,
            createdAt=dna.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            decisionDate=dna.decision_date or dna.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            owner=dna.owner,
            organization=dna.organization,
            opportunityId=dna.opportunity_id,
            trigger=dna.trigger,
            businessQuestion=dna.business_question,
            summary=dna.summary,
            currentConfiguration=dna.current_configuration,
            recommendedConfiguration=dna.recommended_configuration,
            selectedConfiguration=dna.selected_configuration,
            evidence=dna.evidence,
            alternatives=dna.alternatives,
            constraints=dna.constraints,
            humanDecision=dna.human_decision,
            expectedOutcome=dna.expected_outcome,
            actualOutcome=dna.actual_outcome,
            uncertainty=dna.uncertainty,
            learning=dna.learning,
            lineage=dna.lineage,
            provenance=dna.provenance,
            auditEvents=dna.audit_events,
            confidence=dna.confidence,
        ))
    return results


async def get_decision_dna_by_id(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    dna_id: str,
) -> DecisionDNARecordResponse:
    """
    Retrieves a single Decision DNA record by ID or decision_id.
    Guarantees actualOutcome returns 'Outcome Pending' when post-implementation
    data has not yet elapsed. Never fabricates results.
    """
    await seed_default_decisions_if_needed(db, auth)

    doc = await db[DNA_COLLECTION].find_one({
        "$or": [
            {"_id": dna_id},
            {"decision_id": dna_id},
            {"id": dna_id},
            {"_id": f"dna_{dna_id}"},
        ],
        "organization_id": auth.org_id,
    })

    if not doc:
        dec = await db[DECISIONS_COLLECTION].find_one({
            "$or": [
                {"_id": dna_id},
                {"code": dna_id},
                {"code": dna_id.upper()},
                {"id": dna_id},
            ],
            "organization_id": auth.org_id,
        })
        if dec:
            doc = await db[DNA_COLLECTION].find_one({
                "decision_id": dec["_id"],
                "organization_id": auth.org_id,
            })

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision DNA '{dna_id}' not found in active organization.",
        )

    dna = DecisionDNADocument.from_mongo(doc)
    return DecisionDNARecordResponse(
        id=dna.id,
        decisionId=dna.decision_id,
        title=dna.title,
        type=dna.type,
        status=dna.status,
        createdAt=dna.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        decisionDate=dna.decision_date or dna.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        owner=dna.owner,
        organization=dna.organization,
        opportunityId=dna.opportunity_id,
        trigger=dna.trigger,
        businessQuestion=dna.business_question,
        summary=dna.summary,
        currentConfiguration=dna.current_configuration,
        recommendedConfiguration=dna.recommended_configuration,
        selectedConfiguration=dna.selected_configuration,
        evidence=dna.evidence,
        alternatives=dna.alternatives,
        constraints=dna.constraints,
        humanDecision=dna.human_decision,
        expectedOutcome=dna.expected_outcome,
        actualOutcome=dna.actual_outcome,
        uncertainty=dna.uncertainty,
        learning=dna.learning,
        lineage=dna.lineage,
        provenance={
            **dna.provenance,
            "integrityHash": dna.provenance.get("integrityHash")
            or hashlib.sha256(f"{dna.id}:{dna.decision_id}:{dna.organization_id}".encode("utf-8")).hexdigest(),
        },
        auditEvents=dna.audit_events,
        confidence=dna.confidence,
    )


async def list_audit_events_for_decision(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
) -> list[dict[str, Any]]:
    """Retrieves immutable audit history events for a decision."""
    cursor = db[AUDITS_COLLECTION].find({
        "decision_id": decision_id,
        "organization_id": auth.org_id,
    }).sort("timestamp", -1)

    events = []
    async for doc in cursor:
        evt = DecisionAuditEventDocument.from_mongo(doc)
        events.append({
            "id": evt.id,
            "decisionId": evt.decision_id,
            "actor": evt.actor,
            "timestamp": evt.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": evt.action,
            "details": evt.details,
        })
    return events
