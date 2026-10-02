"""
DecisionOS — Business Workspace & File Upload Routes

Endpoints:
- POST   /api/business                  Create business workspace
- GET    /api/business                  Get business workspace for authenticated org
- PUT    /api/business                  Update business workspace
- POST   /api/business/files            Upload CSV/XLSX/JSON file
- GET    /api/business/files            List uploaded files for authenticated org
- DELETE /api/business/files/{fileId}   Delete file by ID (org-isolated)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.business import (
    BusinessResponse,
    CreateBusinessRequest,
    UpdateBusinessRequest,
)
from app.schemas.common import ApiResponse
from app.schemas.file_record import FileDeleteResponse, FileMetadataResponse
from app.services import business_service, file_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/business", tags=["Business Workspace & Files"])


# ─────────────────────────────────────────────────────────────────────────────
# Business Workspace Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ApiResponse[BusinessResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create business workspace",
    description="Initializes the business workspace for the authenticated organization.",
)
async def create_business(
    request: CreateBusinessRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[BusinessResponse]:
    try:
        data = await business_service.create_business(db, auth, request)
        return ApiResponse(
            success=True,
            data=data,
            message=f"Business workspace '{data.businessName}' created successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": str(exc),
            },
        )


@router.get(
    "",
    response_model=ApiResponse[BusinessResponse],
    summary="Get business workspace",
    description="Retrieves the business workspace belonging to the authenticated organization.",
)
async def get_business(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[BusinessResponse]:
    try:
        data = await business_service.get_business(db, auth)
        return ApiResponse(
            success=True,
            data=data,
            message="Business workspace retrieved successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": str(exc),
            },
        )


@router.put(
    "",
    response_model=ApiResponse[BusinessResponse],
    summary="Update business workspace",
    description="Updates settings and profile for the authenticated organization's business workspace.",
)
async def update_business(
    request: UpdateBusinessRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[BusinessResponse]:
    data = await business_service.update_business(db, auth, request)
    return ApiResponse(
        success=True,
        data=data,
        message="Business workspace updated successfully.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# File Ingestion & Management Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/files",
    response_model=ApiResponse[FileMetadataResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload business data file",
    description=(
        "Uploads and validates a CSV, Excel (.xlsx), or JSON data file. "
        "Extracts structural metadata (rows, columns, headers) and persists to tenant-isolated storage."
    ),
)
async def upload_file(
    file: UploadFile = File(...),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[FileMetadataResponse]:
    try:
        data = await file_service.upload_file(db, auth, file)
        return ApiResponse(
            success=True,
            data=data,
            message=f"File '{data.filename}' uploaded and parsed successfully ({data.rowCount or 0} rows).",
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
    "/files",
    response_model=ApiResponse[list[FileMetadataResponse]],
    summary="List uploaded files",
    description="Returns all uploaded data files for the authenticated user's organization.",
)
async def list_files(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[list[FileMetadataResponse]]:
    files = await file_service.list_files(db, auth)
    return ApiResponse(
        success=True,
        data=files,
        message=f"Retrieved {len(files)} uploaded files.",
    )


@router.delete(
    "/files/{fileId}",
    response_model=ApiResponse[FileDeleteResponse],
    summary="Delete uploaded file",
    description="Deletes an uploaded file by ID. Strictly validates organization ownership.",
)
async def delete_file(
    fileId: str,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[FileDeleteResponse]:
    try:
        await file_service.delete_file(db, auth, fileId)
        return ApiResponse(
            success=True,
            data=FileDeleteResponse(
                fileId=fileId,
                deleted=True,
                message=f"File '{fileId}' deleted successfully.",
            ),
            message="File deleted successfully.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": str(exc),
            },
        )
