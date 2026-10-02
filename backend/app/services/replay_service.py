"""
DecisionOS — Decision Replay Service

Manages historical decision records and executes counterfactual replay sessions
with strict multi-tenant organization isolation.
"""

import logging
import uuid
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.replay_engine import (
    generate_default_historical_decisions,
    simulate_counterfactual_replay,
)
from app.models.replay import (
    HistoricalDecisionDocument,
    ReplaySessionDocument,
)
from app.schemas.auth import AuthContext
from app.schemas.replay import (
    CounterfactualBranchSchema,
    HistoricalDecisionResponse,
    ReplayWorkspaceResponse,
)
from app.services.business_service import get_or_create_default_business
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

HISTORICAL_DECISIONS_COLLECTION = "historical_decisions"
REPLAYS_COLLECTION = "replays"


def _map_decision_to_response(dec: HistoricalDecisionDocument) -> HistoricalDecisionResponse:
    return HistoricalDecisionResponse(
        id=dec.id,
        code=dec.code,
        title=dec.title,
        date=dec.date,
        actionTaken=dec.action_taken,
        owner=dec.owner,
        approvers=dec.approvers,
        constraint=dec.constraint,
        reason=dec.reason,
        status=dec.status,
        availableBranches=[
            CounterfactualBranchSchema(
                id=b.id,
                label=b.label,
                description=b.description,
                actionTaken=b.action_taken,
                historicalOutcomeValue=b.historical_outcome_value,
                counterfactualOutcomeValue=b.counterfactual_outcome_value,
                deltaValue=b.delta_value,
                varianceExplanation=b.variance_explanation,
            )
            for b in dec.available_branches
        ],
    )


async def list_historical_decisions(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[HistoricalDecisionResponse]:
    """
    Returns past decisions that have empirical baseline outcome telemetry.
    Initializes grounded defaults if none yet exist for this organization.
    """
    count = await db[HISTORICAL_DECISIONS_COLLECTION].count_documents({"organization_id": auth.org_id})
    if count == 0:
        business = await get_or_create_default_business(db, auth)
        _, df = await _get_active_dataset_and_dataframe(db, auth)
        defaults = generate_default_historical_decisions(business.id, auth.org_id, df, business.currency or "INR")
        for dec in defaults:
            # Use replace_one with upsert=True so this is fully idempotent.
            # insert_one with a hardcoded _id ("hist_dec_1") raises DuplicateKeyError
            # if the document already exists — e.g. from a concurrent request or a
            # prior session — which would propagate as HTTP 500 to the frontend.
            await db[HISTORICAL_DECISIONS_COLLECTION].replace_one(
                {
                    "_id": dec.id,
                    "organization_id": auth.org_id,
                },
                dec.to_mongo(),
                upsert=True,
            )

    cursor = db[HISTORICAL_DECISIONS_COLLECTION].find({"organization_id": auth.org_id})
    decisions = []
    async for doc in cursor:
        decisions.append(_map_decision_to_response(HistoricalDecisionDocument.from_mongo(doc)))

    return decisions


async def get_historical_decision_by_id(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
) -> Optional[HistoricalDecisionDocument]:
    """Retrieves a single historical decision with strict organization isolation."""
    doc = await db[HISTORICAL_DECISIONS_COLLECTION].find_one({
        "organization_id": auth.org_id,
        "$or": [
            {"_id": decision_id},
            {"decisionId": decision_id},
            {"code": decision_id},
        ],
    })

    if not doc:
        # Check if we should initialize defaults first
        all_decs = await list_historical_decisions(db, auth)
        doc = await db[HISTORICAL_DECISIONS_COLLECTION].find_one({
            "organization_id": auth.org_id,
            "$or": [
                {"_id": decision_id},
                {"decisionId": decision_id},
                {"code": decision_id},
            ],
        })
        if not doc:
            return None

    return HistoricalDecisionDocument.from_mongo(doc)


async def get_replay_workspace(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
) -> Optional[ReplayWorkspaceResponse]:
    """Loads actual trajectory vs default counterfactual branch for a past decision."""
    decision = await get_historical_decision_by_id(db, auth, decision_id)
    if not decision:
        return None

    business = await get_or_create_default_business(db, auth)
    _, df = await _get_active_dataset_and_dataframe(db, auth)
    return simulate_counterfactual_replay(decision, branch_id=None, df=df, currency=business.currency or "INR")


async def simulate_replay(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    decision_id: str,
    branch_id: Optional[str] = None,
    counterfactual_config: Optional[dict[str, Any]] = None,
) -> Optional[ReplayWorkspaceResponse]:
    """Simulates a counterfactual branch and persists the replay session."""
    decision = await get_historical_decision_by_id(db, auth, decision_id)
    if not decision:
        return None

    business = await get_or_create_default_business(db, auth)
    _, df = await _get_active_dataset_and_dataframe(db, auth)
    result = simulate_counterfactual_replay(decision, branch_id=branch_id, df=df, currency=business.currency or "INR")

    # Persist session
    session_id = f"replay_{uuid.uuid4().hex[:12]}"
    session_doc = ReplaySessionDocument(
        id=session_id,
        decision_id=decision.id,
        branch_id=result.selectedBranchId,
        organization_id=auth.org_id,
        business_id=decision.business_id,
        is_simulated=True,
        disclaimer=result.disclaimer,
        selected_branch=next((b for b in decision.available_branches if b.id == result.selectedBranchId), decision.available_branches[0]),
        actual_metrics={"revenue": result.metrics[0].actualNum if result.metrics else 0.0},
        counterfactual_metrics={"revenue": result.metrics[0].counterfactualNum if result.metrics else 0.0},
        metrics_comparison=[m.model_dump() for m in result.metrics],
        actual_timeline=[t.model_dump() for t in result.actualTimeline],
        counterfactual_timeline=[t.model_dump() for t in result.counterfactualTimeline],
        insight=result.insight.model_dump(),
        uncertainty=result.uncertainty.model_dump(),
    )
    await db[REPLAYS_COLLECTION].insert_one(session_doc.to_mongo())

    return result
