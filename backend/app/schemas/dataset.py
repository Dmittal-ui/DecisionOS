"""
DecisionOS — Dataset API Schemas

Defines API representations for normalized dataset metadata and validation reports.
"""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    """Normalized Dataset representation returned by the API."""
    id: str
    datasetId: str
    dataset_id: str
    organizationId: str
    organization_id: str
    businessId: str
    business_id: str
    fileId: str
    file_id: str
    filename: str
    totalRows: int
    total_rows: int
    validRows: int
    valid_rows: int
    invalidRows: int
    invalid_rows: int
    duplicateRows: int
    duplicate_rows: int
    columnsMapped: dict[str, str] = Field(default_factory=dict)
    columns_mapped: dict[str, str] = Field(default_factory=dict)
    unmappedColumns: list[str] = Field(default_factory=list)
    unmapped_columns: list[str] = Field(default_factory=list)
    validationErrors: list[dict[str, Any]] = Field(default_factory=list)
    validation_errors: list[dict[str, Any]] = Field(default_factory=list)
    validationWarnings: list[dict[str, Any]] = Field(default_factory=list)
    validation_warnings: list[dict[str, Any]] = Field(default_factory=list)
    dataQualityScore: float
    data_quality_score: float
    status: str = "ACTIVE"
    version: int = 1
    isCurrent: bool = True
    is_current: bool = True
    archivedAt: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    createdAt: datetime
    created_at: datetime


class DatasetHistorySummary(BaseModel):
    """Summary representation for dataset history list in profile."""
    id: str
    datasetId: str
    dataset_id: str
    filename: str
    fileId: str
    file_id: str
    organizationId: str
    organization_id: str
    businessName: str
    business_name: str
    version: int = 1
    status: str = "ACTIVE"
    isCurrent: bool = True
    is_current: bool = True
    totalRows: int
    total_rows: int
    validRows: int
    valid_rows: int
    dataQualityScore: float
    data_quality_score: float
    createdAt: datetime
    created_at: datetime
    archivedAt: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    hasTwin: bool = False
    has_twin: bool = False
    opportunitiesCount: int = 0
    opportunities_count: int = 0
    decisionsCount: int = 0
    decisions_count: int = 0


class DatasetHistoryDetailResponse(BaseModel):
    """Complete historical dataset snapshot with all dependent results."""
    dataset: DatasetResponse
    isCurrent: bool
    is_current: bool
    digitalTwin: Optional[dict[str, Any]] = None
    digital_twin: Optional[dict[str, Any]] = None
    opportunities: list[dict[str, Any]] = Field(default_factory=list)
    investigations: list[dict[str, Any]] = Field(default_factory=list)
    scenarios: list[dict[str, Any]] = Field(default_factory=list)
    optimizerResults: list[dict[str, Any]] = Field(default_factory=list)
    decisions: list[dict[str, Any]] = Field(default_factory=list)
    decisionDna: list[dict[str, Any]] = Field(default_factory=list)
    disclosures: dict[str, Any] = Field(default_factory=dict)


class DatasetResetResponse(BaseModel):
    """Response returned upon resetting active dataset."""
    reset: bool = True
    archivedDatasetId: Optional[str] = None
    archivedDatasetName: Optional[str] = None
    message: str


class DatasetListResponse(BaseModel):
    """List envelope for datasets."""
    datasets: list[DatasetResponse]
    total: int

