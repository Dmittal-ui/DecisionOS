"""
DecisionOS — File Ingestion & Management Service

Handles:
- Validation of file extensions and MIME types (CSV, XLSX, JSON)
- Structural parsing and metadata extraction (rows, columns, schemas)
- Organization-partitioned disk storage
- Metadata persistence in MongoDB
- Tenant-isolated retrieval and deletion
"""

import csv
import io
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Tuple

import openpyxl
from fastapi import UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import require_org_access
from app.config import get_settings
from app.models.file_record import FileDocument
from app.schemas.auth import AuthContext
from app.schemas.file_record import FileMetadataResponse
from app.services.business_service import get_or_create_default_business

logger = logging.getLogger(__name__)

FILES_COLLECTION = "files"
SUPPORTED_EXTENSIONS = {".csv": "csv", ".xlsx": "xlsx", ".json": "json"}


def _sanitize_filename(filename: str) -> str:
    """Sanitizes filename to prevent directory traversal or unsafe filesystem characters."""
    base = os.path.basename(filename)
    return re.sub(r"[^a-zA-Z0-9_.-]", "_", base)


def _build_file_response(doc: FileDocument) -> FileMetadataResponse:
    """Constructs the standard FileMetadataResponse."""
    return FileMetadataResponse(
        fileId=doc.id,
        id=doc.id,
        organizationId=doc.organization_id,
        organization_id=doc.organization_id,
        businessId=doc.business_id,
        business_id=doc.business_id,
        filename=doc.filename,
        fileType=doc.file_type,
        file_type=doc.file_type,
        size=doc.size,
        uploadDate=doc.upload_date,
        upload_date=doc.upload_date,
        processingStatus=doc.processing_status,
        processing_status=doc.processing_status,
        rowCount=doc.row_count,
        row_count=doc.row_count,
        columnCount=doc.column_count,
        column_count=doc.column_count,
        columns=doc.columns,
        summary=doc.summary,
        error_message=doc.error_message,
    )


def validate_and_parse_content(
    content: bytes,
    file_type: str,
) -> Tuple[int, int, list[str], dict[str, Any]]:
    """
    Parses and validates the file structure for CSV, XLSX, or JSON.

    Returns:
        (row_count, column_count, columns, summary_dict)

    Raises:
        ValueError if file structure is malformed or unreadable.
    """
    if file_type == "csv":
        # Attempt decode
        text = None
        for enc in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            raise ValueError("CSV encoding not supported. Please upload UTF-8 encoded CSV.")

        # Parse CSV
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return (0, 0, [], {"format": "csv", "empty": True})

        columns = [c.strip() for c in rows[0]]
        row_count = len(rows) - 1  # Excluding header
        column_count = len(columns)
        summary = {
            "format": "csv",
            "sample_columns": columns[:10],
            "total_rows": max(0, row_count),
        }
        return (max(0, row_count), column_count, columns, summary)

    elif file_type == "xlsx":
        try:
            wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
            sheet_names = wb.sheetnames
            if not sheet_names:
                raise ValueError("XLSX workbook contains no sheets.")

            sheet = wb.active
            columns = []
            row_count = 0

            # Read rows generator
            for i, row in enumerate(sheet.iter_rows(values_only=True)):
                if i == 0:
                    columns = [str(cell).strip() for cell in row if cell is not None]
                else:
                    if any(cell is not None for cell in row):
                        row_count += 1

            column_count = len(columns)
            summary = {
                "format": "xlsx",
                "sheets": sheet_names,
                "active_sheet": sheet.title,
                "sample_columns": columns[:10],
                "total_rows": row_count,
            }
            return (row_count, column_count, columns, summary)
        except Exception as exc:
            raise ValueError(f"Corrupted or invalid XLSX workbook: {exc}")

    elif file_type == "json":
        try:
            text = content.decode("utf-8")
            data = json.loads(text)
        except Exception as exc:
            raise ValueError(f"Invalid JSON file format: {exc}")

        if isinstance(data, list):
            row_count = len(data)
            columns = list(data[0].keys()) if row_count > 0 and isinstance(data[0], dict) else []
            column_count = len(columns)
            summary = {
                "format": "json",
                "root_type": "array",
                "sample_columns": columns[:10],
                "total_rows": row_count,
            }
        elif isinstance(data, dict):
            # Check for standard data envelopes (e.g. {"data": [...]} or dictionary of records)
            if "data" in data and isinstance(data["data"], list):
                row_count = len(data["data"])
                columns = list(data["data"][0].keys()) if row_count > 0 and isinstance(data["data"][0], dict) else []
            else:
                row_count = len(data)
                columns = list(data.keys())[:20]
            column_count = len(columns)
            summary = {
                "format": "json",
                "root_type": "object",
                "top_keys": list(data.keys())[:10],
                "total_rows": row_count,
            }
        else:
            raise ValueError("JSON file root must be an array of objects or a key-value object.")

        return (row_count, column_count, columns, summary)

    else:
        raise ValueError(f"Unsupported file type: {file_type}")


async def upload_file(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    file: UploadFile,
) -> FileMetadataResponse:
    """
    Receives an uploaded file, validates format and size, parses structure,
    writes to tenant-isolated storage, and saves document in MongoDB.

    Raises:
        ValueError: For invalid file format, oversized file, or corrupted contents.
    """
    settings = get_settings()

    if not file.filename:
        raise ValueError("Filename cannot be empty.")

    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext}'. Only CSV (.csv), Excel (.xlsx), and JSON (.json) files are permitted."
        )

    file_type = SUPPORTED_EXTENSIONS[ext]

    # 2. Read content into memory
    content = await file.read()
    size = len(content)

    if size == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")

    # 3. Validate file size
    if size > settings.max_upload_size_bytes:
        max_mb = settings.max_upload_size_bytes // (1024 * 1024)
        raise ValueError(f"File size ({size} bytes) exceeds maximum allowable limit of {max_mb} MB.")

    # 4. Parse content & validate structure
    try:
        row_count, col_count, columns, summary = validate_and_parse_content(content, file_type)
        processing_status = "processed"
        error_msg = None
    except ValueError as parse_err:
        logger.warning("File validation error for %s: %s", file.filename, parse_err)
        raise ValueError(f"Validation failed: {parse_err}")

    # 5. Link to Organization's Business Workspace
    business = await get_or_create_default_business(db, auth)

    # 6. Save to tenant-isolated disk storage
    file_id = str(uuid.uuid4())
    safe_filename = _sanitize_filename(file.filename)
    org_upload_dir = os.path.join(settings.upload_dir, auth.org_id)
    os.makedirs(org_upload_dir, exist_ok=True)

    storage_filename = f"{file_id}_{safe_filename}"
    storage_path = os.path.join(org_upload_dir, storage_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    # 7. Create MongoDB Document
    now = datetime.now(timezone.utc)
    file_doc = FileDocument(
        id=file_id,
        organization_id=auth.org_id,
        business_id=business.id,
        filename=safe_filename,
        file_type=file_type,
        size=size,
        upload_date=now,
        processing_status=processing_status,
        storage_path=storage_path,
        row_count=row_count,
        column_count=col_count,
        columns=columns,
        summary=summary,
        error_message=error_msg,
    )

    await db[FILES_COLLECTION].insert_one(file_doc.to_mongo())
    logger.info("File uploaded successfully: id=%s org=%s name=%s rows=%d", file_id, auth.org_id, safe_filename, row_count)

    return _build_file_response(file_doc)


async def list_files(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[FileMetadataResponse]:
    """
    Lists all files belonging strictly to the authenticated organization.
    """
    cursor = db[FILES_COLLECTION].find({"organization_id": auth.org_id}).sort("upload_date", -1)
    results = []
    async for doc in cursor:
        file_obj = FileDocument.from_mongo(doc)
        results.append(_build_file_response(file_obj))
    return results


async def delete_file(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    file_id: str,
) -> bool:
    """
    Deletes a file by ID.
    Enforces that the file belongs strictly to the authenticated user's organization.

    Raises:
        ValueError if not found.
        HTTPException(403) if belongs to another organization.
    """
    doc = await db[FILES_COLLECTION].find_one({"_id": file_id})
    if not doc:
        raise ValueError(f"File with ID '{file_id}' not found.")

    # Strict tenant isolation enforcement
    require_org_access(auth, str(doc["organization_id"]))

    # Remove file from disk
    storage_path = doc.get("storage_path")
    if storage_path and os.path.exists(storage_path):
        try:
            os.remove(storage_path)
            logger.info("Deleted physical file from disk: %s", storage_path)
        except OSError as exc:
            logger.warning("Failed to remove file from disk %s: %s", storage_path, exc)

    # Remove document from MongoDB
    await db[FILES_COLLECTION].delete_one({"_id": file_id, "organization_id": auth.org_id})
    logger.info("Deleted file document: id=%s org=%s", file_id, auth.org_id)
    return True
