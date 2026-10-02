"""
DecisionOS — Business Digital Twin & Dataset Normalization Routes

Endpoints:
- POST /api/business/datasets/normalize/{fileId}
  Runs the normalization and validation pipeline on an uploaded file and computes the Digital Twin.
- GET  /api/business/twin
  Retrieves the current grounded Business Digital Twin state.
- GET  /api/business/datasets
  Lists all ingested datasets and validation reports for the organization.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse
from app.schemas.dataset import DatasetResponse
from app.schemas.digital_twin import DigitalTwinResponse
from app.services import twin_service

logger = logging.getLogger(__name__)

from typing import Any, Dict, Optional
from fastapi import Query

router = APIRouter(tags=["Business Digital Twin & Datasets"])


class NormalizationPipelineResult(BaseModel):
    """Result of running normalization and digital twin generation."""
    dataset: DatasetResponse
    digitalTwin: DigitalTwinResponse
    digital_twin: DigitalTwinResponse


@router.post(
    "/api/business/datasets/normalize/{fileId}",
    response_model=ApiResponse[NormalizationPipelineResult],
    status_code=status.HTTP_201_CREATED,
    summary="Normalize dataset & compute Business Digital Twin",
    description=(
        "Executes the ingestion pipeline on an uploaded file: "
        "parses file, maps columns to canonical schema, validates data integrity, "
        "and constructs the grounded Business Digital Twin."
    ),
)
@router.post(
    "/api/business/normalize/{fileId}",
    response_model=ApiResponse[NormalizationPipelineResult],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/api/digital-twin/normalize/{fileId}",
    response_model=ApiResponse[NormalizationPipelineResult],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/api/digital-twin/normalize",
    response_model=ApiResponse[NormalizationPipelineResult],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def normalize_dataset(
    fileId: Optional[str] = None,
    file_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[NormalizationPipelineResult]:
    fid = fileId or file_id
    if not fid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": "fileId path parameter or file_id query parameter is required."},
        )
    try:
        dataset, twin = await twin_service.normalize_file_and_create_twin(db, auth, fid)
        return ApiResponse(
            success=True,
            data=NormalizationPipelineResult(
                dataset=dataset,
                digitalTwin=twin,
                digital_twin=twin,
            ),
            message=f"Dataset normalized successfully ({dataset.validRows} valid rows). Digital Twin updated.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "BAD_REQUEST",
                "message": str(exc),
            },
        )


@router.get(
    "/api/business/twin",
    response_model=ApiResponse[DigitalTwinResponse],
    summary="Get Business Digital Twin",
    description="Retrieves the current operational Business Digital Twin for the authenticated organization.",
)
@router.get(
    "/api/digital-twin",
    response_model=ApiResponse[DigitalTwinResponse],
    include_in_schema=False,
)
async def get_digital_twin(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DigitalTwinResponse]:
    try:
        twin = await twin_service.get_digital_twin(db, auth)
        return ApiResponse(
            success=True,
            data=twin,
            message="Business Digital Twin retrieved successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": str(exc),
            },
        )


@router.get(
    "/api/business/datasets",
    response_model=ApiResponse[list[DatasetResponse]],
    summary="List normalized datasets",
    description="Lists all normalized datasets and data quality validation reports for the organization.",
)
@router.get(
    "/api/datasets",
    response_model=ApiResponse[list[DatasetResponse]],
    include_in_schema=False,
)
async def list_datasets(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[DatasetResponse]]:
    datasets = await twin_service.list_datasets(db, auth)
    return ApiResponse(
        success=True,
        data=datasets,
        message=f"Retrieved {len(datasets)} normalized datasets.",
    )


# ─── Dataset Reset / Start New Analysis ────────────────────────────────────────

@router.post(
    "/api/business/datasets/reset",
    response_model=ApiResponse[dict[str, Any]],
    summary="Reset current business data",
    description="Archives the active dataset and resets operational analysis, allowing a clean upload.",
)
@router.delete(
    "/api/business/datasets/current",
    response_model=ApiResponse[dict[str, Any]],
    summary="Delete / Reset current active dataset",
    include_in_schema=False,
)
@router.delete(
    "/api/datasets/current",
    response_model=ApiResponse[dict[str, Any]],
    include_in_schema=False,
)
@router.post(
    "/api/datasets/reset",
    response_model=ApiResponse[dict[str, Any]],
    include_in_schema=False,
)
async def reset_current_dataset(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[dict[str, Any]]:
    result = await twin_service.reset_current_data(db, auth)
    return ApiResponse(
        success=True,
        data=result,
        message=result.get("message", "Current business data reset successfully."),
    )


# ─── Dataset History Endpoints ─────────────────────────────────────────────────

@router.get(
    "/api/business/history",
    response_model=ApiResponse[list[dict[str, Any]]],
    summary="List dataset analysis history",
    description="Lists historical and active datasets with analysis sessions.",
)
@router.get(
    "/api/datasets/history",
    response_model=ApiResponse[list[dict[str, Any]]],
    include_in_schema=False,
)
async def list_dataset_history(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[dict[str, Any]]]:
    history = await twin_service.list_history(db, auth)
    return ApiResponse(
        success=True,
        data=history,
        message=f"Retrieved {len(history)} historical dataset records.",
    )


@router.get(
    "/api/business/history/{datasetId}",
    response_model=ApiResponse[dict[str, Any]],
    summary="Get historical dataset details",
    description="Returns full read-only snapshot of results from a designated historical dataset.",
)
@router.get(
    "/api/datasets/history/{datasetId}",
    response_model=ApiResponse[dict[str, Any]],
    include_in_schema=False,
)
async def get_dataset_history_detail(
    datasetId: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[dict[str, Any]]:
    try:
        detail = await twin_service.get_history_detail(db, auth, datasetId)
        return ApiResponse(
            success=True,
            data=detail,
            message="Historical dataset details retrieved successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(exc)},
        )


