"""
DecisionOS — Digital Twin & Dataset Normalization Service

Orchestrates:
1. Reading uploaded file bytes from isolated disk storage
2. Parsing into Pandas DataFrame (CSV, XLSX, JSON)
3. Column header detection & canonical schema mapping
4. Validation & data quality scoring (rejects empty/invalid structures)
5. Grounded Business Digital Twin calculation (revenue, gross profit, orders, etc.)
6. Persistence to 'datasets' and 'digital_twins' MongoDB collections
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import require_org_access
from app.engine.digital_twin_builder import build_digital_twin_from_dataframe
from app.engine.normalizer import detect_and_map_columns, validate_and_clean_dataframe
from app.models.dataset import DatasetDocument
from app.models.digital_twin import DigitalTwinDocument
from app.schemas.auth import AuthContext
from app.schemas.dataset import DatasetResponse
from app.schemas.digital_twin import DigitalTwinResponse, MetricStateResponse
from app.services.business_service import get_or_create_default_business

logger = logging.getLogger(__name__)

DATASETS_COLLECTION = "datasets"
DIGITAL_TWINS_COLLECTION = "digital_twins"
FILES_COLLECTION = "files"


def _build_dataset_response(doc: DatasetDocument) -> DatasetResponse:
    """Helper to serialize DatasetDocument to API response schema."""
    return DatasetResponse(
        id=doc.id,
        datasetId=doc.id,
        dataset_id=doc.id,
        organizationId=doc.organization_id,
        organization_id=doc.organization_id,
        businessId=doc.business_id,
        business_id=doc.business_id,
        fileId=doc.file_id,
        file_id=doc.file_id,
        filename=doc.filename,
        totalRows=doc.total_rows,
        total_rows=doc.total_rows,
        validRows=doc.valid_rows,
        valid_rows=doc.valid_rows,
        invalidRows=doc.invalid_rows,
        invalid_rows=doc.invalid_rows,
        duplicateRows=doc.duplicate_rows,
        duplicate_rows=doc.duplicate_rows,
        columnsMapped=doc.columns_mapped,
        columns_mapped=doc.columns_mapped,
        unmappedColumns=doc.unmapped_columns,
        unmapped_columns=doc.unmapped_columns,
        validationErrors=doc.validation_errors,
        validation_errors=doc.validation_errors,
        validationWarnings=doc.validation_warnings,
        validation_warnings=doc.validation_warnings,
        dataQualityScore=doc.data_quality_score,
        data_quality_score=doc.data_quality_score,
        status=doc.status,
        version=doc.version,
        isCurrent=doc.is_current,
        is_current=doc.is_current,
        archivedAt=doc.archived_at,
        archived_at=doc.archived_at,
        createdAt=doc.created_at,
        created_at=doc.created_at,
    )


def _build_digital_twin_response(doc: DigitalTwinDocument) -> DigitalTwinResponse:
    """Helper to serialize DigitalTwinDocument to API response schema."""
    metrics_resp = {
        name: MetricStateResponse(
            name=m.name,
            value=m.value,
            unit=m.unit,
            available=m.available,
            confidence=m.confidence,
            reason=m.reason,
            sampleSize=m.sample_size,
            sample_size=m.sample_size,
        )
        for name, m in doc.metrics.items()
    }

    return DigitalTwinResponse(
        id=doc.id,
        twinId=doc.id,
        twin_id=doc.id,
        organizationId=doc.organization_id,
        organization_id=doc.organization_id,
        businessId=doc.business_id,
        business_id=doc.business_id,
        datasetId=doc.dataset_id,
        dataset_id=doc.dataset_id,
        businessName=doc.business_name,
        business_name=doc.business_name,
        currency=doc.currency,
        periodStart=doc.period_start,
        period_start=doc.period_start,
        periodEnd=doc.period_end,
        period_end=doc.period_end,
        metrics=metrics_resp,
        channelMetrics=doc.channel_metrics,
        channel_metrics=doc.channel_metrics,
        dataQualityScore=doc.data_quality_score,
        data_quality_score=doc.data_quality_score,
        createdAt=doc.created_at,
        created_at=doc.created_at,
        updatedAt=doc.updated_at,
        updated_at=doc.updated_at,
    )


def _load_dataframe_from_file(storage_path: str, file_type: str) -> pd.DataFrame:
    """Reads disk file into a Pandas DataFrame based on format."""
    if not os.path.exists(storage_path):
        raise ValueError(f"Underlying file storage '{storage_path}' not found.")

    if file_type == "csv":
        # Handle various encodings
        for enc in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                return pd.read_csv(storage_path, encoding=enc)
            except UnicodeDecodeError:
                continue
        return pd.read_csv(storage_path)

    elif file_type == "xlsx":
        return pd.read_excel(storage_path)

    elif file_type == "json":
        with open(storage_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict):
            if "data" in data and isinstance(data["data"], list):
                return pd.DataFrame(data["data"])
            return pd.DataFrame([data])
        else:
            raise ValueError("Unsupported JSON layout for tabular normalization.")

    else:
        raise ValueError(f"Unsupported file format: {file_type}")


async def normalize_file_and_create_twin(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    file_id: str,
) -> Tuple[DatasetResponse, DigitalTwinResponse]:
    """
    Executes the full pipeline for a designated file:
    Parse -> Map Columns -> Validate -> Store Dataset -> Compute Digital Twin.

    Archives any previously active dataset for the organization and creates a new active version.
    """
    file_doc = await db[FILES_COLLECTION].find_one({"_id": file_id})
    if not file_doc:
        raise ValueError(f"File with ID '{file_id}' not found.")

    # Strict isolation check
    require_org_access(auth, str(file_doc["organization_id"]))

    storage_path = file_doc.get("storage_path", "")
    file_type = file_doc.get("file_type", "csv")
    filename = file_doc.get("filename", "")

    # 1. Parse File into DataFrame
    raw_df = _load_dataframe_from_file(storage_path, file_type)

    # 2. Map Columns to Canonical Schema
    mapped_df, columns_mapped, unmapped_columns = detect_and_map_columns(raw_df)

    # 3. Validate & Clean
    cleaned_df, validation_summary = validate_and_clean_dataframe(mapped_df, columns_mapped)

    # 4. Fetch / Ensure Business Workspace
    business = await get_or_create_default_business(db, auth)

    # 5. Determine version and archive any active datasets for this org
    now = datetime.now(timezone.utc)
    count_existing = await db[DATASETS_COLLECTION].count_documents({"organization_id": auth.org_id})
    new_version = count_existing + 1

    await db[DATASETS_COLLECTION].update_many(
        {"organization_id": auth.org_id, "status": "ACTIVE"},
        {"$set": {"status": "ARCHIVED", "archived_at": now}},
    )

    # 6. Persist Dataset Document
    dataset_id = str(uuid.uuid4())
    dataset = DatasetDocument(
        id=dataset_id,
        organization_id=auth.org_id,
        business_id=business.id,
        file_id=file_id,
        filename=filename,
        total_rows=validation_summary["total_rows"],
        valid_rows=validation_summary["valid_rows"],
        invalid_rows=validation_summary["invalid_rows"],
        duplicate_rows=validation_summary["duplicate_rows"],
        columns_mapped=columns_mapped,
        unmapped_columns=unmapped_columns,
        validation_errors=validation_summary["validation_errors"],
        validation_warnings=validation_summary["validation_warnings"],
        data_quality_score=validation_summary["data_quality_score"],
        status="ACTIVE",
        version=new_version,
        created_at=now,
    )
    await db[DATASETS_COLLECTION].insert_one(dataset.to_mongo())

    # 7. Compute Grounded Digital Twin State
    metrics, channel_metrics, period_start, period_end = build_digital_twin_from_dataframe(
        cleaned_df,
        validation_summary["data_quality_score"],
    )

    # 8. Persist Digital Twin scoped to dataset_id
    twin_id = f"twin_{dataset_id}"
    twin = DigitalTwinDocument(
        id=twin_id,
        organization_id=auth.org_id,
        business_id=business.id,
        dataset_id=dataset_id,
        business_name=business.business_name,
        currency=business.currency,
        period_start=period_start,
        period_end=period_end,
        metrics=metrics,
        channel_metrics=channel_metrics,
        data_quality_score=validation_summary["data_quality_score"],
        created_at=now,
        updated_at=now,
    )

    await db[DIGITAL_TWINS_COLLECTION].replace_one(
        {"organization_id": auth.org_id, "dataset_id": dataset_id},
        twin.to_mongo(),
        upsert=True,
    )

    # 9. Update File Record Processing Status
    await db[FILES_COLLECTION].update_one(
        {"_id": file_id},
        {"$set": {"processing_status": "processed", "processingStatus": "processed"}},
    )

    logger.info(
        "Digital Twin generated successfully: twin=%s org=%s dataset=%s score=%.1f version=%d",
        twin.id, auth.org_id, dataset.id, twin.data_quality_score, new_version,
    )

    return _build_dataset_response(dataset), _build_digital_twin_response(twin)


async def get_digital_twin(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> DigitalTwinResponse:
    """
    Retrieves the current operational Business Digital Twin for the authenticated organization's active dataset.

    Raises:
        ValueError if no active twin exists.
    """
    active_ds = await db[DATASETS_COLLECTION].find_one({"organization_id": auth.org_id, "status": "ACTIVE"})
    if not active_ds:
        raise ValueError(
            "No Business Digital Twin found for your organization. "
            "Please upload and normalize a business dataset to generate the twin."
        )

    doc = await db[DIGITAL_TWINS_COLLECTION].find_one({
        "organization_id": auth.org_id,
        "dataset_id": active_ds["_id"],
    })
    if not doc:
        # Fallback to org level if dataset_id match not yet indexed
        doc = await db[DIGITAL_TWINS_COLLECTION].find_one({"organization_id": auth.org_id})

    if not doc:
        raise ValueError(
            "No Business Digital Twin found for your organization. "
            "Please upload and normalize a business dataset to generate the twin."
        )

    twin = DigitalTwinDocument.from_mongo(doc)
    return _build_digital_twin_response(twin)


async def list_datasets(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[DatasetResponse]:
    """Lists all normalized datasets for the authenticated organization."""
    cursor = db[DATASETS_COLLECTION].find({"organization_id": auth.org_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        dataset = DatasetDocument.from_mongo(doc)
        results.append(_build_dataset_response(dataset))
    return results


async def reset_current_data(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> dict[str, Any]:
    """
    Resets/archives the current active dataset and clears active analysis states for the organization.
    Preserves historical dataset lineage, user accounts, and organizations.
    """
    now = datetime.now(timezone.utc)
    active_docs = await db[DATASETS_COLLECTION].find({
        "organization_id": auth.org_id,
        "status": "ACTIVE",
    }).to_list(None)

    if not active_docs:
        return {
            "reset": True,
            "archivedDatasetId": None,
            "archivedDatasetName": None,
            "message": "No active dataset to reset.",
        }

    archived_id = str(active_docs[0]["_id"])
    archived_name = str(active_docs[0].get("filename", "dataset"))

    # 1. Mark active dataset(s) as ARCHIVED
    await db[DATASETS_COLLECTION].update_many(
        {"organization_id": auth.org_id, "status": "ACTIVE"},
        {"$set": {"status": "ARCHIVED", "archived_at": now}},
    )

    # 2. Remove active opportunities and investigations
    await db["opportunities"].delete_many({"organization_id": auth.org_id})
    await db["investigations"].delete_many({"organization_id": auth.org_id})

    logger.info("Reset current data: org=%s archived dataset=%s", auth.org_id, archived_id)

    return {
        "reset": True,
        "archivedDatasetId": archived_id,
        "archivedDatasetName": archived_name,
        "message": "Current business dataset and active analysis reset successfully. Historical data preserved.",
    }


async def list_history(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[dict[str, Any]]:
    """
    Lists historical and current datasets for the authenticated organization.
    """
    business = await get_or_create_default_business(db, auth)
    cursor = db[DATASETS_COLLECTION].find({"organization_id": auth.org_id}).sort("created_at", -1)
    history_items = []
    async for doc in cursor:
        ds = DatasetDocument.from_mongo(doc)
        twin_count = await db[DIGITAL_TWINS_COLLECTION].count_documents({
            "organization_id": auth.org_id,
            "dataset_id": ds.id,
        })
        opp_count = await db["opportunities"].count_documents({
            "organization_id": auth.org_id,
            "dataset_id": ds.id,
        })
        dec_count = await db["decisions"].count_documents({
            "organization_id": auth.org_id,
            "dataset_id": ds.id,
        })
        history_items.append({
            "id": ds.id,
            "datasetId": ds.id,
            "dataset_id": ds.id,
            "filename": ds.filename,
            "fileId": ds.file_id,
            "file_id": ds.file_id,
            "organizationId": ds.organization_id,
            "organization_id": ds.organization_id,
            "businessName": business.business_name or "Enterprise",
            "business_name": business.business_name or "Enterprise",
            "version": ds.version,
            "status": ds.status,
            "isCurrent": ds.is_current,
            "is_current": ds.is_current,
            "totalRows": ds.total_rows,
            "total_rows": ds.total_rows,
            "validRows": ds.valid_rows,
            "valid_rows": ds.valid_rows,
            "dataQualityScore": ds.data_quality_score,
            "data_quality_score": ds.data_quality_score,
            "createdAt": ds.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "created_at": ds.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "archivedAt": ds.archived_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ds.archived_at else None,
            "archived_at": ds.archived_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ds.archived_at else None,
            "hasTwin": twin_count > 0,
            "has_twin": twin_count > 0,
            "opportunitiesCount": opp_count,
            "opportunities_count": opp_count,
            "decisionsCount": dec_count,
            "decisions_count": dec_count,
        })
    return history_items


async def get_history_detail(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    dataset_id: str,
) -> dict[str, Any]:
    """
    Returns full read-only snapshot for a specific dataset ID.
    Strictly tenant isolated; does NOT recalculate results using current data.
    """
    doc = await db[DATASETS_COLLECTION].find_one({
        "$or": [
            {"_id": dataset_id},
            {"datasetId": dataset_id},
            {"dataset_id": dataset_id},
        ],
        "organization_id": auth.org_id,
    })
    if not doc:
        raise ValueError(f"Dataset with ID '{dataset_id}' not found for your organization.")

    dataset = DatasetDocument.from_mongo(doc)

    # 1. Digital Twin
    twin_doc = await db[DIGITAL_TWINS_COLLECTION].find_one({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    })
    digital_twin = None
    if twin_doc:
        twin_obj = DigitalTwinDocument.from_mongo(twin_doc)
        digital_twin = _build_digital_twin_response(twin_obj).model_dump()

    # 2. Opportunities
    opp_docs = await db["opportunities"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    opportunities = [
        {
            "id": str(o.get("_id")),
            "code": o.get("code", ""),
            "title": o.get("title", ""),
            "category": o.get("category", ""),
            "urgency": o.get("urgency", ""),
            "status": o.get("status", ""),
            "impact": o.get("impact", {}),
            "confidence": o.get("confidence", 0),
            "summary": o.get("summary", ""),
            "dataClassification": "DATA_DERIVED",
        }
        for o in opp_docs
    ]

    # 3. Investigations
    inv_docs = await db["investigations"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    investigations = [
        {
            "id": str(i.get("_id")),
            "opportunityId": i.get("opportunity_id", ""),
            "title": i.get("title", ""),
            "status": i.get("status", ""),
            "hypotheses": i.get("hypotheses", []),
            "evidence": i.get("evidence", []),
            "dataClassification": "DATA_DERIVED",
        }
        for i in inv_docs
    ]

    # 4. Scenarios
    scen_docs = await db["scenarios"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    scenarios = [
        {
            "id": str(s.get("_id")),
            "name": s.get("name", ""),
            "presetId": s.get("preset_id", ""),
            "variables": s.get("variables", {}),
            "projectedRevenue": s.get("projected_revenue"),
            "projectedGrossProfit": s.get("projected_gross_profit"),
            "projectedOperatingMargin": s.get("projected_operating_margin"),
            "dataClassification": "SIMULATION",
        }
        for s in scen_docs
    ]

    # 5. Optimizer Runs
    opt_docs = await db["optimizations"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    optimizer_results = [
        {
            "id": str(op.get("_id")),
            "objective": op.get("objective", ""),
            "status": op.get("status", ""),
            "recommendedConfiguration": op.get("recommended_configuration", {}),
            "projectedOutcomes": op.get("projected_outcomes", {}),
            "summary": op.get("summary", {}),
            "dataClassification": "SIMULATION",
        }
        for op in opt_docs
    ]

    # 6. Decisions
    dec_docs = await db["decisions"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    decisions = [
        {
            "id": str(d.get("_id")),
            "code": d.get("code", ""),
            "title": d.get("title", ""),
            "status": d.get("status", ""),
            "impact": d.get("impact", ""),
            "owner": d.get("owner", ""),
            "recommendation": d.get("recommendation", {}),
            "dataClassification": "GOVERNANCE",
        }
        for d in dec_docs
    ]

    # 7. Decision DNA
    dna_docs = await db["decision_dna"].find({
        "organization_id": auth.org_id,
        "dataset_id": dataset.id,
    }).to_list(100)
    decision_dna = [
        {
            "id": str(dna.get("_id")),
            "decisionId": dna.get("decision_id", ""),
            "title": dna.get("title", ""),
            "status": dna.get("status", ""),
            "owner": dna.get("owner", ""),
            "currentConfiguration": dna.get("current_configuration", {}),
            "recommendedConfiguration": dna.get("recommended_configuration", {}),
            "selectedConfiguration": dna.get("selected_configuration", {}),
            "expectedOutcome": dna.get("expected_outcome", {}),
            "actualOutcome": dna.get("actual_outcome", {}),
            "dataClassification": "IMMUTABLE_LINEAGE",
        }
        for dna in dna_docs
    ]

    disclosures = {
        "observedData": {
            "classification": "DATA_DERIVED",
            "description": f"Computed directly from source file '{dataset.filename}' containing {dataset.valid_rows:,} verified rows.",
            "dataQualityScore": dataset.data_quality_score,
        },
        "modelAssumptions": {
            "classification": "MODEL_ASSUMPTION",
            "description": "Grid boundaries, elasticity models, and minimum margin thresholds applied by Decision Engine calibration.",
        },
        "simulatedValues": {
            "classification": "SIMULATION",
            "description": "Projected outcomes generated via deterministic microeconomic simulations and constraint optimizer.",
        },
    }

    return {
        "dataset": _build_dataset_response(dataset).model_dump(),
        "isCurrent": dataset.is_current,
        "is_current": dataset.is_current,
        "digitalTwin": digital_twin,
        "digital_twin": digital_twin,
        "opportunities": opportunities,
        "investigations": investigations,
        "scenarios": scenarios,
        "optimizerResults": optimizer_results,
        "decisions": decisions,
        "decisionDna": decision_dna,
        "disclosures": disclosures,
    }

