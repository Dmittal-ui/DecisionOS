"""
DecisionOS — Opportunity API Schemas

Pydantic schemas for Opportunity endpoints conforming to
docs/API_CONTRACT.md and frontend types/opportunity.ts.
Provides dual camelCase / snake_case access for seamless frontend compatibility.
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class OpportunityImpactSchema(BaseModel):
    """Estimated financial and timeline impact."""
    model_config = ConfigDict(populate_by_name=True)

    projectedRevenue: float = Field(0.0, description="Projected top-line revenue improvement")
    costReduction: float = Field(0.0, description="Projected operational cost savings")
    netValue: float = Field(0.0, description="Total net economic value")
    confidenceScore: float = Field(0.0, description="0 to 100 confidence score")
    timeToRealizationDays: int = Field(14, description="Days to realize value")
    netValueFormatted: str = Field("₹0", description="Formatted currency string")
    timeHorizon: str = Field("14 days", description="Action timeframe")
    riskLevel: str = Field("medium", description="Execution risk level: low | medium | high")


class OpportunitySignalSchema(BaseModel):
    """Telemetry signal that contributed to anomaly detection."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    metric: str
    value: str
    direction: str = "negative"  # positive | negative | neutral
    group: str = "negative"      # positive | negative | monitoring
    description: Optional[str] = None
    observedValue: Optional[float] = None
    baselineValue: Optional[float] = None
    changePercent: Optional[float] = None


class OpportunityResponse(BaseModel):
    """
    Complete opportunity response payload.
    Contains all prompt-specified fields and API contract fields.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique opportunity identifier (MongoDB ID)")
    opportunityId: str = Field(..., description="Alias for id")
    code: str = Field(..., description="Human-readable code, e.g. OPP-9021")
    organizationId: str = Field(..., description="Tenant organization ID")
    businessId: str = Field(..., description="Business workspace ID")
    title: str = Field(..., description="Executive title")
    summary: str = Field(..., description="Analytical summary")
    category: str = Field(..., description="pricing_optimization | inventory_rebalance | operational_efficiency | revenue | etc.")
    priority: str = Field(..., description="critical | high | medium | low")
    urgency: str = Field(..., description="critical | high | medium | low")
    status: str = Field(..., description="detected | in_investigation | decision_ready | executed | dismissed")
    confidence: float = Field(..., description="0 to 100 confidence score")
    impact: OpportunityImpactSchema
    signals: list[OpportunitySignalSchema] = Field(default_factory=list)
    affectedSegments: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    detectedAt: str = Field(..., description="ISO 8601 detection timestamp")
    updatedAt: str = Field(..., description="ISO 8601 update timestamp")


class OpportunityListResponse(BaseModel):
    """List of detected decision opportunities."""
    total: int
    items: list[OpportunityResponse]
