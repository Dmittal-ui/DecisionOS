"""
DecisionOS — Dashboard API Schemas

Defines API representations for the real business metrics and executive dashboard.
Conforms strictly to docs/API_CONTRACT.md and frontend types.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


class MetricItemResponse(BaseModel):
    """Grounded metric item representation."""
    name: str
    value: Optional[float] = None
    formattedValue: str
    unit: str  # currency | count | percentage | ratio
    available: bool
    confidence: float
    trend: str = "flat"  # up | down | flat
    changePercentage: Optional[float] = None
    reason: Optional[str] = None
    sampleSize: int = 0


class DashboardMetricsResponse(BaseModel):
    """
    GET /api/dashboard/metrics

    Returns all 10 core deterministic business metrics:
    - Revenue
    - Gross Profit
    - Gross Margin
    - Operating Margin
    - Orders
    - Average Order Value (AOV)
    - Inventory Value
    - Marketing Spend
    - Conversion Rate
    - CAC
    """
    businessId: str
    businessName: str
    organizationId: str
    currency: str
    dataQualityScore: float
    metrics: dict[str, MetricItemResponse]


class KPIMetricResponse(BaseModel):
    """Executive KPI card representation matching frontend types."""
    id: str
    label: str
    value: str
    numericValue: Optional[float] = None
    trend: str = "flat"
    status: str = "neutral"
    unit: str = ""
    timeframe: str = "30d"
    available: bool = True
    reason: Optional[str] = None


class PerformanceDataPointResponse(BaseModel):
    """Daily/weekly telemetry coordinate."""
    date: str
    revenue: float
    grossProfit: float
    ordersCount: int


class BusinessHealthResponse(BaseModel):
    """Operational health indices."""
    compositeScore: float
    overallScore: float
    status: str = "healthy"  # healthy | warning | critical
    revenueEfficiency: float
    supplyChainResilience: float
    pricingLeverage: float


class ExecutiveMetricsResponse(BaseModel):
    """High-level executive KPIs matching API_CONTRACT.md section 2."""
    activeOpportunitiesCount: int = 0
    unrealizedValueTotal: float = 0.0
    realizedValueYTD: float = 0.0
    systemConfidenceAvg: float = 100.0
    criticalAlertsCount: int = 0


class DashboardSummaryResponse(BaseModel):
    """
    GET /api/dashboard and GET /api/v1/dashboard/summary

    Grounded Executive Dashboard populated from real authenticated business data.
    """
    timeframe: str = "30d"
    businessId: str
    businessName: str
    organizationId: str
    currency: str
    hasData: bool = True
    executiveMetrics: ExecutiveMetricsResponse
    kpis: dict[str, KPIMetricResponse]
    businessHealthIndex: BusinessHealthResponse
    performanceSeries: dict[str, list[PerformanceDataPointResponse]]
    channels: dict[str, Any] = Field(default_factory=dict)
    recentDecisions: list[dict[str, Any]] = Field(default_factory=list)
