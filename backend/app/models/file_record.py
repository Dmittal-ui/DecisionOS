"""
DecisionOS — File Record MongoDB Document Model

Stores metadata and lifecycle status for uploaded business data files.
Each file belongs strictly to an organization and a business workspace.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field


class FileDocument(BaseModel):
    """
    Represents a File Metadata document stored in the 'files' MongoDB collection.

    Fields:
        id (str):                   UUID string used as MongoDB _id (fileId).
        organization_id (str):      FK -> organizations._id (Root tenant isolation).
        business_id (str):          FK -> businesses._id.
        filename (str):             Original sanitized file name (e.g. "sales_q3.csv").
        file_type (str):            File format: "csv" | "xlsx" | "json".
        size (int):                 File size in bytes.
        upload_date (datetime):     UTC timestamp of file upload.
        processing_status (str):    "uploaded" | "processing" | "processed" | "failed".
        storage_path (str):         Filesystem storage path.
        row_count (Optional[int]):  Number of parsed rows.
        column_count (Optional[int]): Number of parsed columns.
        columns (list[str]):        Parsed column/field names.
        summary (Optional[dict]):   Statistical or schema metadata summary.
        error_message (Optional[str]): Error details if processing failed.
    """

    id: str = Field(..., description="UUID string - used as MongoDB _id")
    organization_id: str
    business_id: str
    filename: str
    file_type: str
    size: int
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_status: str = "uploaded"
    storage_path: str = ""
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    columns: list[str] = Field(default_factory=list)
    summary: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None

    @property
    def fileId(self) -> str:
        return self.id

    @property
    def file_id(self) -> str:
        return self.id

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def fileType(self) -> str:
        return self.file_type

    @property
    def uploadDate(self) -> datetime:
        return self.upload_date

    @property
    def processingStatus(self) -> str:
        return self.processing_status

    def to_mongo(self) -> dict:
        """Converts to MongoDB document format (maps id -> _id, includes aliases)."""
        return {
            "_id": self.id,
            "fileId": self.id,
            "file_id": self.id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "filename": self.filename,
            "file_type": self.file_type,
            "fileType": self.file_type,
            "size": self.size,
            "upload_date": self.upload_date,
            "uploadDate": self.upload_date,
            "processing_status": self.processing_status,
            "processingStatus": self.processing_status,
            "storage_path": self.storage_path,
            "row_count": self.row_count,
            "column_count": self.column_count,
            "columns": self.columns,
            "summary": self.summary,
            "error_message": self.error_message,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "FileDocument":
        """Constructs a FileDocument from a raw MongoDB document."""
        return cls(
            id=str(doc.get("_id") or doc.get("fileId") or doc.get("file_id")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            filename=doc.get("filename", ""),
            file_type=doc.get("file_type") or doc.get("fileType", "csv"),
            size=doc.get("size", 0),
            upload_date=doc.get("upload_date") or doc.get("uploadDate") or datetime.now(timezone.utc),
            processing_status=doc.get("processing_status") or doc.get("processingStatus", "uploaded"),
            storage_path=doc.get("storage_path", ""),
            row_count=doc.get("row_count"),
            column_count=doc.get("column_count"),
            columns=doc.get("columns", []),
            summary=doc.get("summary"),
            error_message=doc.get("error_message"),
        )
