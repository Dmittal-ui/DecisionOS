"""
DecisionOS — File Record API Schemas

Defines API schemas for file metadata, file listing, and deletion responses.
"""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class FileMetadataResponse(BaseModel):
    """
    Metadata representation returned after upload and during file listing.
    Supports both camelCase and snake_case property access.
    """
    fileId: str
    id: str
    organizationId: str
    organization_id: str
    businessId: str
    business_id: str
    filename: str
    fileType: str
    file_type: str
    size: int
    uploadDate: datetime
    upload_date: datetime
    processingStatus: str
    processing_status: str
    rowCount: Optional[int] = None
    row_count: Optional[int] = None
    columnCount: Optional[int] = None
    column_count: Optional[int] = None
    columns: list[str] = Field(default_factory=list)
    summary: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None


class FileListResponse(BaseModel):
    """List envelope for uploaded files."""
    files: list[FileMetadataResponse]
    total: int


class FileDeleteResponse(BaseModel):
    """Response returned upon successful file deletion."""
    fileId: str
    deleted: bool
    message: str
