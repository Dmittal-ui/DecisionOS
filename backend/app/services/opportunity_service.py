"""
DecisionOS — Opportunity Service

Manages the lifecycle of continuous decision opportunities:
- On-demand / continuous radar scanning across enterprise business datasets.
- Persistence and multi-tenant organization isolation in MongoDB.
- Auto-generation of corresponding investigation workspaces.
- Filtered, searched, and sorted retrieval conforming to docs/API_CONTRACT.md.
"""

import logging
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.investigation_builder import build_investigation_for_opportunity
from app.engine.opportunity_detector import detect_opportunities
from app.models.business import BusinessDocument
from app.models.dataset import DatasetDocument
from app.models.investigation import InvestigationDocument
from app.models.opportunity import OpportunityDocument
from app.schemas.auth import AuthContext
from app.services.business_service import get_or_create_default_business
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

OPPORTUNITIES_COLLECTION = "opportunities"
INVESTIGATIONS_COLLECTION = "investigations"
BUSINESSES_COLLECTION = "businesses"


async def scan_and_detect_opportunities(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    business_id: Optional[str] = None,
) -> list[OpportunityDocument]:
    """
    Executes a deterministic radar scan across the authenticated organization's
    normalized business data.

    Saves detected opportunities and initializes corresponding investigation workspaces.
    """
    # 1. Resolve business
    if business_id:
        biz_doc = await db[BUSINESSES_COLLECTION].find_one({
            "_id": business_id,
            "organization_id": auth.org_id,
        })
        if not biz_doc:
            raise ValueError(f"Business '{business_id}' not found for your organization.")
        business = BusinessDocument.from_mongo(biz_doc)
    else:
        business = await get_or_create_default_business(db, auth)

    # 2. Load active dataset & cleaned DataFrame
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    if df is None or df.empty:
        logger.info("No active dataset rows for organization %s. Scan returns 0 opportunities.", auth.org_id)
        return []

    # 3. Detect opportunities deterministically
    quality = dataset.data_quality_score if dataset else 100.0
    detected_opps = detect_opportunities(
        df=df,
        business_id=business.id,
        organization_id=auth.org_id,
        currency=business.currency or "INR",
        data_quality_score=quality,
    )

    # Stamp dataset_id on every detected opportunity before persisting
    for opp in detected_opps:
        opp.dataset_id = dataset.id if dataset else ""

    persisted_opps: list[OpportunityDocument] = []

    # 4. Delete stale opportunities for this org+business+dataset before inserting fresh ones.
    #    This ensures opportunities for this specific dataset are refreshed while preserving history.
    #    Organization isolation is enforced: we scope the delete to org_id + business_id + dataset_id.
    await db[OPPORTUNITIES_COLLECTION].delete_many({
        "organization_id": auth.org_id,
        "business_id": business.id,
        "dataset_id": dataset.id if dataset else "",
    })
    # Also remove any stale investigations linked to this org+business+dataset
    await db[INVESTIGATIONS_COLLECTION].delete_many({
        "organization_id": auth.org_id,
        "business_id": business.id,
        "dataset_id": dataset.id if dataset else "",
    })

    # 5. Insert all freshly detected opportunities + investigations
    for opp in detected_opps:
        # Insert the freshly detected opportunity
        await db[OPPORTUNITIES_COLLECTION].insert_one(opp.to_mongo())

        # Build & insert the corresponding Investigation Workspace
        inv_doc = build_investigation_for_opportunity(opp, df)
        inv_mongo = inv_doc.to_mongo()
        inv_mongo["dataset_id"] = dataset.id if dataset else ""
        inv_mongo["datasetId"] = dataset.id if dataset else ""
        await db[INVESTIGATIONS_COLLECTION].insert_one(inv_mongo)

        persisted_opps.append(opp)

    logger.info("Scan completed for org %s: %d opportunities detected.", auth.org_id, len(persisted_opps))
    return persisted_opps


async def list_opportunities(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "impact",
    sort_dir: Optional[str] = "desc",
    page: int = 1,
    limit: int = 50,
) -> tuple[list[OpportunityDocument], int]:
    """
    Lists opportunities with strict multi-tenant organization isolation,
    filtering, searching, and sorting.
    """
    # If no active dataset exists (e.g. after reset), return empty list.
    _ds, _ = await _get_active_dataset_and_dataframe(db, auth)
    if not _ds:
        return [], 0

    _dataset_id = _ds.id
    count_for_dataset = await db[OPPORTUNITIES_COLLECTION].count_documents({
        "organization_id": auth.org_id,
        "dataset_id": _dataset_id,
    })
    if count_for_dataset == 0:
        await scan_and_detect_opportunities(db, auth)

    # Scope query strictly to current active dataset
    query: dict[str, Any] = {"organization_id": auth.org_id, "dataset_id": _dataset_id}


    if status:
        query["status"] = status

    effective_urgency = urgency or priority
    if effective_urgency:
        query["$or"] = [
            {"priority": effective_urgency},
            {"urgency": effective_urgency},
        ]

    if category:
        query["category"] = category

    if search:
        query["$and"] = query.get("$and", [])
        regex_pattern = {"$regex": search, "$options": "i"}
        query["$and"].append({
            "$or": [
                {"title": regex_pattern},
                {"code": regex_pattern},
                {"summary": regex_pattern},
                {"tags": regex_pattern},
            ]
        })

    total = await db[OPPORTUNITIES_COLLECTION].count_documents(query)

    # Sorting
    sort_field = "impact.net_value"
    if sort_by in ("confidence", "confidenceScore"):
        sort_field = "confidence"
    elif sort_by in ("urgency", "priority"):
        sort_field = "urgency"
    elif sort_by in ("detectedAt", "detected_at"):
        sort_field = "detected_at"

    mongo_sort_dir = -1 if (sort_dir or "desc").lower() == "desc" else 1

    skip = max(0, (page - 1) * limit)
    cursor = db[OPPORTUNITIES_COLLECTION].find(query).sort(sort_field, mongo_sort_dir).skip(skip).limit(limit)

    results: list[OpportunityDocument] = []
    async for doc in cursor:
        results.append(OpportunityDocument.from_mongo(doc))

    return results, total


async def get_opportunity_by_id(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    id_or_code: str,
) -> Optional[OpportunityDocument]:
    """
    Retrieves a single opportunity by UUID or code with strict organization isolation.
    """
    doc = await db[OPPORTUNITIES_COLLECTION].find_one({
        "organization_id": auth.org_id,
        "$or": [
            {"_id": id_or_code},
            {"opportunityId": id_or_code},
            {"opportunity_id": id_or_code},
            {"code": id_or_code},
        ],
    })
    if not doc:
        count = await db[OPPORTUNITIES_COLLECTION].count_documents({"organization_id": auth.org_id})
        if count == 0:
            await scan_and_detect_opportunities(db, auth)
            doc = await db[OPPORTUNITIES_COLLECTION].find_one({
                "organization_id": auth.org_id,
                "$or": [
                    {"_id": id_or_code},
                    {"opportunityId": id_or_code},
                    {"opportunity_id": id_or_code},
                    {"code": id_or_code},
                ],
            })
    if not doc:
        return None
    return OpportunityDocument.from_mongo(doc)
