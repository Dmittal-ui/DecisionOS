"""
DecisionOS — Investigation Service

Retrieves and manages detailed investigation workspaces:
- Competing hypotheses with Bayesian confidence weights.
- Empirical factual evidence items observed from real telemetry.
- Decision trees and chronological progression timelines.
- Enforces strict multi-tenant organization isolation.

Architecture note:
  Investigations are ALWAYS rebuilt from the current opportunity and active
  dataset on every request, then upserted into MongoDB.  This guarantees that
  the builder — not a cached document — is always the source of truth.
  Stale documents from a previous engine version can never be served.
"""

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.investigation_builder import build_investigation_for_opportunity
from app.models.investigation import InvestigationDocument
from app.models.opportunity import OpportunityDocument
from app.schemas.auth import AuthContext
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

INVESTIGATIONS_COLLECTION = "investigations"
OPPORTUNITIES_COLLECTION = "opportunities"


async def get_investigation_by_id_or_code(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    id_or_code: str,
) -> Optional[InvestigationDocument]:
    """
    Returns the investigation workspace for a given investigationId, opportunityId,
    or opportunityCode, scoped strictly to the authenticated user's organization.

    The investigation is ALWAYS rebuilt from the current opportunity and active
    dataset so that engine updates (e.g. new builder logic, fixed calculations)
    are reflected immediately without requiring a manual database cleanup.
    The rebuilt document is upserted into MongoDB for audit-trail purposes.
    """
    # ── 1. Resolve the parent opportunity ────────────────────────────────────
    # Accept investigation IDs, opportunity IDs, and opportunity codes.
    opp_doc = await db[OPPORTUNITIES_COLLECTION].find_one({
        "organization_id": auth.org_id,
        "$or": [
            {"_id": id_or_code},
            {"opportunityId": id_or_code},
            {"opportunity_id": id_or_code},
            {"code": id_or_code},
        ],
    })

    # If not found by opportunity fields, check whether id_or_code is an
    # investigation ID — then resolve the parent opportunity from it.
    if not opp_doc:
        inv_stub = await db[INVESTIGATIONS_COLLECTION].find_one({
            "organization_id": auth.org_id,
            "$or": [
                {"_id": id_or_code},
                {"investigationId": id_or_code},
                {"investigation_id": id_or_code},
            ],
        })
        if inv_stub:
            opp_id = inv_stub.get("opportunity_id") or inv_stub.get("opportunityId")
            if opp_id:
                opp_doc = await db[OPPORTUNITIES_COLLECTION].find_one({
                    "organization_id": auth.org_id,
                    "$or": [
                        {"_id": opp_id},
                        {"opportunityId": opp_id},
                        {"opportunity_id": opp_id},
                    ],
                })

    # If still no opportunity found, attempt an initial scan (cold-start).
    if not opp_doc:
        _, _active_df = await _get_active_dataset_and_dataframe(db, auth)
        count = await db[OPPORTUNITIES_COLLECTION].count_documents(
            {"organization_id": auth.org_id}
        )
        if count == 0:
            from app.services.opportunity_service import scan_and_detect_opportunities
            await scan_and_detect_opportunities(db, auth)
            opp_doc = await db[OPPORTUNITIES_COLLECTION].find_one({
                "organization_id": auth.org_id,
                "$or": [
                    {"_id": id_or_code},
                    {"opportunityId": id_or_code},
                    {"opportunity_id": id_or_code},
                    {"code": id_or_code},
                ],
            })

    if not opp_doc:
        return None

    # ── 2. Rebuild investigation from current builder + current dataset ───────
    # This is always done — even if a cached document already exists in MongoDB.
    # This prevents stale persisted content (built by a previous engine version)
    # from ever being returned to the caller.
    opp = OpportunityDocument.from_mongo(opp_doc)
    _, df = await _get_active_dataset_and_dataframe(db, auth)
    inv = build_investigation_for_opportunity(opp, df)

    # ── 3. Upsert: replace any existing investigation for this opportunity ─────
    # Match on opportunity_id OR opportunity_code so both old and new records
    # (which may use different field names) are replaced.
    await db[INVESTIGATIONS_COLLECTION].replace_one(
        {
            "organization_id": auth.org_id,
            "$or": [
                {"opportunity_id": opp.id},
                {"opportunityId": opp.id},
                {"opportunity_code": opp.code},
                {"opportunityCode": opp.code},
            ],
        },
        inv.to_mongo(),
        upsert=True,
    )

    logger.debug(
        "Investigation rebuilt and upserted for opportunity %s (org %s).",
        opp.code,
        auth.org_id,
    )
    return inv
