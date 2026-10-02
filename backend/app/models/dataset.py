"""
DecisionOS — Dataset MongoDB Document Model

Stores metadata, column mappings, and data quality validation results
for normalized datasets ingested into the Decision Engine.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field


class DatasetDocument(BaseModel):
    """
    Represents an Ingested and Normalized Dataset document stored in 'datasets'.

    Fields:
        id (str):                   UUID string used as MongoDB _id (datasetId).
        organization_id (str):      FK -> organizations._id (Root tenant boundary).
        business_id (str):          FK -> businesses._id.
        file_id (str):              FK -> files._id (Source file).
        filename (str):             Original source filename.
        total_rows (int):           Raw rows read from file.
        valid_rows (int):           Rows passing validation.
        invalid_rows (int):         Rows with schema/data type errors.
        duplicate_rows (int):       Identified duplicate rows.
        columns_mapped (dict):      Mapping of raw header -> canonical name.
        unmapped_columns (list):    Original headers not matching canonical schema.
        validation_errors (list):   List of data validation issue descriptions.
        validation_warnings (list): List of data warnings (e.g. high null count).
        data_quality_score (float): Quality score (0.0 to 100.0).
        created_at (datetime):      UTC timestamp of normalization.
    """

    id: str = Field(..., description="UUID string - used as MongoDB _id")
    organization_id: str
    business_id: str
    file_id: str
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int = 0
    duplicate_rows: int = 0
    columns_mapped: dict[str, str] = Field(default_factory=dict)
    unmapped_columns: list[str] = Field(default_factory=list)
    validation_errors: list[dict[str, Any]] = Field(default_factory=list)
    validation_warnings: list[dict[str, Any]] = Field(default_factory=list)
    data_quality_score: float = 100.0
    status: str = "ACTIVE"
    archived_at: Optional[datetime] = None
    version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def datasetId(self) -> str:
        return self.id

    @property
    def dataset_id(self) -> str:
        return self.id

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def fileId(self) -> str:
        return self.file_id

    @property
    def totalRows(self) -> int:
        return self.total_rows

    @property
    def validRows(self) -> int:
        return self.valid_rows

    @property
    def is_current(self) -> bool:
        return self.status == "ACTIVE"

    @property
    def isCurrent(self) -> bool:
        return self.is_current

    @property
    def archivedAt(self) -> Optional[datetime]:
        return self.archived_at

    def to_mongo(self) -> dict:
        """Maps model to MongoDB document."""
        return {
            "_id": self.id,
            "datasetId": self.id,
            "dataset_id": self.id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "file_id": self.file_id,
            "fileId": self.file_id,
            "filename": self.filename,
            "total_rows": self.total_rows,
            "totalRows": self.total_rows,
            "valid_rows": self.valid_rows,
            "validRows": self.valid_rows,
            "invalid_rows": self.invalid_rows,
            "invalidRows": self.invalid_rows,
            "duplicate_rows": self.duplicate_rows,
            "duplicateRows": self.duplicate_rows,
            "columns_mapped": self.columns_mapped,
            "columnsMapped": self.columns_mapped,
            "unmapped_columns": self.unmapped_columns,
            "unmappedColumns": self.unmapped_columns,
            "validation_errors": self.validation_errors,
            "validationErrors": self.validation_errors,
            "validation_warnings": self.validation_warnings,
            "validationWarnings": self.validation_warnings,
            "data_quality_score": self.data_quality_score,
            "dataQualityScore": self.data_quality_score,
            "status": self.status,
            "archived_at": self.archived_at,
            "archivedAt": self.archived_at,
            "version": self.version,
            "created_at": self.created_at,
            "createdAt": self.created_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "DatasetDocument":
        """Constructs DatasetDocument from MongoDB document."""
        return cls(
            id=str(doc.get("_id") or doc.get("datasetId") or doc.get("dataset_id")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            file_id=str(doc.get("file_id") or doc.get("fileId")),
            filename=doc.get("filename", ""),
            total_rows=doc.get("total_rows") or doc.get("totalRows", 0),
            valid_rows=doc.get("valid_rows") or doc.get("validRows", 0),
            invalid_rows=doc.get("invalid_rows") or doc.get("invalidRows", 0),
            duplicate_rows=doc.get("duplicate_rows") or doc.get("duplicateRows", 0),
            columns_mapped=doc.get("columns_mapped") or doc.get("columnsMapped", {}),
            unmapped_columns=doc.get("unmapped_columns") or doc.get("unmappedColumns", []),
            validation_errors=doc.get("validation_errors") or doc.get("validationErrors", []),
            validation_warnings=doc.get("validation_warnings") or doc.get("validationWarnings", []),
            data_quality_score=float(doc.get("data_quality_score") or doc.get("dataQualityScore", 100.0)),
            status=str(doc.get("status") or "ACTIVE"),
            archived_at=doc.get("archived_at") or doc.get("archivedAt"),
            version=int(doc.get("version") or 1),
            created_at=doc.get("created_at") or doc.get("createdAt") or datetime.now(timezone.utc),
        )

