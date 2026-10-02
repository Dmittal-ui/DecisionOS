"""
DecisionOS — Business Digital Twin API Schemas

Defines API representations for the Business Digital Twin and its metrics.
"""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class MetricStateResponse(BaseModel):
    """API representation of a single grounded operational metric."""
    name: str
    value: Optional[float] = None
    unit: str = "currency"
    available: bool = True
    confidence: float = 100.0
    reason: Optional[str] = None
    sampleSize: int = 0
    sample_size: int = 0


class DigitalTwinResponse(BaseModel):
    """
    Complete state of the Business Digital Twin.
    Supports both camelCase and snake_case properties.
    """
    id: str
    twinId: str
    twin_id: str
    organizationId: str
    organization_id: str
    businessId: str
    business_id: str
    datasetId: str
    dataset_id: str
    businessName: str
    business_name: str
    currency: str
    periodStart: Optional[datetime] = None
    period_start: Optional[datetime] = None
    periodEnd: Optional[datetime] = None
    period_end: Optional[datetime] = None
    metrics: dict[str, MetricStateResponse] = Field(default_factory=dict)
    channelMetrics: dict[str, Any] = Field(default_factory=dict)
    channel_metrics: dict[str, Any] = Field(default_factory=dict)
    dataQualityScore: float = 100.0
    data_quality_score: float = 100.0
    createdAt: datetime
    created_at: datetime
    updatedAt: datetime
    updated_at: datetime
