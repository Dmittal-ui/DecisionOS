"""
DecisionOS — Business Digital Twin MongoDB Document Model

Represents the normalized, grounded operational twin of an enterprise business.
Each metric explicitly declares availability, numerical confidence, and fallback reasoning.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field


class MetricState(BaseModel):
    """
    State of an individual commercial metric within the Business Digital Twin.

    If data is missing from uploaded inputs, available is set to False
    and reason describes exactly why it cannot be computed.
    No mock data is silently fabricated.
    """
    name: str
    value: Optional[float] = None
    unit: str = "currency"  # currency | count | percentage | ratio
    available: bool = True
    confidence: float = 100.0  # 0.0 to 100.0
    reason: Optional[str] = None
    sample_size: int = 0


class DigitalTwinDocument(BaseModel):
    """
    Represents the operational Digital Twin document stored in 'digital_twins'.

    Fields:
        id (str):                   UUID string used as MongoDB _id (twinId).
        organization_id (str):      FK -> organizations._id (Root tenant isolation).
        business_id (str):          FK -> businesses._id.
        dataset_id (str):           FK -> datasets._id (Source normalized dataset).
        business_name (str):        Name of the business workspace.
        currency (str):             Operating currency code.
        period_start (datetime):    Earliest detected transaction timestamp.
        period_end (datetime):      Latest detected transaction timestamp.
        metrics (dict):             Map of metric_name -> MetricState.
        channel_metrics (dict):     Breakdown metrics per sales channel.
        data_quality_score (float): Statistical health score of underpinning data.
        created_at (datetime):      UTC creation timestamp.
        updated_at (datetime):      UTC last calculation timestamp.
    """

    id: str = Field(..., description="UUID string - used as MongoDB _id")
    organization_id: str
    business_id: str
    dataset_id: str
    business_name: str = ""
    currency: str = "INR"
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    metrics: dict[str, MetricState] = Field(default_factory=dict)
    channel_metrics: dict[str, Any] = Field(default_factory=dict)
    data_quality_score: float = 100.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def twinId(self) -> str:
        return self.id

    @property
    def twin_id(self) -> str:
        return self.id

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def datasetId(self) -> str:
        return self.dataset_id

    def to_mongo(self) -> dict:
        """Converts DigitalTwinDocument to MongoDB representation."""
        metrics_dict = {
            k: v.model_dump() if isinstance(v, MetricState) else v
            for k, v in self.metrics.items()
        }
        return {
            "_id": self.id,
            "twinId": self.id,
            "twin_id": self.id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "dataset_id": self.dataset_id,
            "datasetId": self.dataset_id,
            "business_name": self.business_name,
            "businessName": self.business_name,
            "currency": self.currency,
            "period_start": self.period_start,
            "periodStart": self.period_start,
            "period_end": self.period_end,
            "periodEnd": self.period_end,
            "metrics": metrics_dict,
            "channel_metrics": self.channel_metrics,
            "channelMetrics": self.channel_metrics,
            "data_quality_score": self.data_quality_score,
            "dataQualityScore": self.data_quality_score,
            "created_at": self.created_at,
            "createdAt": self.created_at,
            "updated_at": self.updated_at,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict) -> "DigitalTwinDocument":
        """Reconstructs DigitalTwinDocument from raw MongoDB document."""
        raw_metrics = doc.get("metrics", {})
        parsed_metrics: dict[str, MetricState] = {}
        for k, v in raw_metrics.items():
            if isinstance(v, dict):
                parsed_metrics[k] = MetricState(**v)
            elif isinstance(v, MetricState):
                parsed_metrics[k] = v

        return cls(
            id=str(doc.get("_id") or doc.get("twinId") or doc.get("twin_id")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            dataset_id=str(doc.get("dataset_id") or doc.get("datasetId")),
            business_name=doc.get("business_name") or doc.get("businessName", ""),
            currency=doc.get("currency", "INR"),
            period_start=doc.get("period_start") or doc.get("periodStart"),
            period_end=doc.get("period_end") or doc.get("periodEnd"),
            metrics=parsed_metrics,
            channel_metrics=doc.get("channel_metrics") or doc.get("channelMetrics", {}),
            data_quality_score=float(doc.get("data_quality_score") or doc.get("dataQualityScore", 100.0)),
            created_at=doc.get("created_at") or doc.get("createdAt") or datetime.now(timezone.utc),
            updated_at=doc.get("updated_at") or doc.get("updatedAt") or datetime.now(timezone.utc),
        )
