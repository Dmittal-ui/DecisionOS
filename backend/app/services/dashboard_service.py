"""
DecisionOS — Dashboard & Metric Engine Service

Extracts and computes grounded commercial metrics and executive summaries
for the authenticated user's organization business workspace.
Conforms strictly to docs/API_CONTRACT.md and frontend types.
Never fabricates missing data.
"""

import logging
from typing import Any, Optional

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.metric_engine import MetricEngine
from app.engine.normalizer import detect_and_map_columns, validate_and_clean_dataframe
from app.models.dataset import DatasetDocument
from app.models.digital_twin import DigitalTwinDocument
from app.schemas.auth import AuthContext
from app.schemas.dashboard import (
    BusinessHealthResponse,
    DashboardMetricsResponse,
    DashboardSummaryResponse,
    ExecutiveMetricsResponse,
    KPIMetricResponse,
    MetricItemResponse,
    PerformanceDataPointResponse,
)
from app.services.business_service import get_or_create_default_business
from app.services.twin_service import _load_dataframe_from_file

logger = logging.getLogger(__name__)

BUSINESSES_COLLECTION = "businesses"
DATASETS_COLLECTION = "datasets"
DIGITAL_TWINS_COLLECTION = "digital_twins"
FILES_COLLECTION = "files"


async def _get_active_dataset_and_dataframe(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> tuple[Optional[DatasetDocument], Optional[pd.DataFrame]]:
    """Retrieves the active normalized dataset and loads its cleaned DataFrame."""
    doc = await db[DATASETS_COLLECTION].find_one(
        {"organization_id": auth.org_id, "status": "ACTIVE"},
        sort=[("created_at", -1)],
    )
    if not doc:
        return None, None

    dataset = DatasetDocument.from_mongo(doc)

    file_doc = await db[FILES_COLLECTION].find_one({"_id": dataset.file_id})
    if not file_doc:
        return dataset, None

    storage_path = file_doc.get("storage_path", "")
    file_type = file_doc.get("file_type", "csv")

    try:
        raw_df = _load_dataframe_from_file(storage_path, file_type)
        mapped_df, mapped_cols, _ = detect_and_map_columns(raw_df)
        cleaned_df, _ = validate_and_clean_dataframe(mapped_df, mapped_cols)
        return dataset, cleaned_df
    except Exception as exc:
        logger.warning("Could not reload source dataframe for dataset %s: %s", dataset.id, exc)
        return dataset, None


async def get_dashboard_metrics(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> DashboardMetricsResponse:
    """
    Computes and returns the 10 grounded commercial metrics for the authenticated business:
    1. Revenue
    2. Gross Profit
    3. Gross Margin
    4. Operating Margin
    5. Orders
    6. Average Order Value (AOV)
    7. Inventory Value
    8. Marketing Spend
    9. Conversion Rate
    10. CAC
    """
    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)

    if df is None or df.empty:
        # No dataset has been normalized yet
        empty_metrics = {
            key: MetricItemResponse(
                name=label,
                value=None,
                formattedValue="N/A",
                unit=unit,
                available=False,
                confidence=0.0,
                reason="No business dataset has been uploaded or normalized yet.",
            )
            for key, label, unit in [
                ("revenue", "Revenue", "currency"),
                ("grossProfit", "Gross Profit", "currency"),
                ("grossMargin", "Gross Margin", "percentage"),
                ("operatingMargin", "Operating Margin", "percentage"),
                ("orders", "Orders", "count"),
                ("averageOrderValue", "Average Order Value", "currency"),
                ("inventoryValue", "Inventory Value", "currency"),
                ("marketingSpend", "Marketing Spend", "currency"),
                ("conversionRate", "Conversion Rate", "percentage"),
                ("cac", "CAC", "currency"),
            ]
        }
        return DashboardMetricsResponse(
            businessId=business.id,
            businessName=business.business_name,
            organizationId=auth.org_id,
            currency=business.currency,
            dataQualityScore=0.0,
            metrics=empty_metrics,
        )

    quality_score = dataset.data_quality_score if dataset else 100.0
    engine = MetricEngine(df, currency=business.currency, data_quality_score=quality_score)

    calc_map = {
        "revenue": engine.calculate_revenue(),
        "grossProfit": engine.calculate_gross_profit(),
        "grossMargin": engine.calculate_gross_margin(),
        "operatingMargin": engine.calculate_operating_margin(),
        "orders": engine.calculate_orders(),
        "averageOrderValue": engine.calculate_aov(),
        "inventoryValue": engine.calculate_inventory_value(),
        "marketingSpend": engine.calculate_marketing_spend(),
        "conversionRate": engine.calculate_conversion_rate(),
        "cac": engine.calculate_cac(),
    }

    metrics_resp = {
        k: MetricItemResponse(
            name=m.name,
            value=m.value,
            formattedValue=m.formatted_value,
            unit=m.unit,
            available=m.available,
            confidence=m.confidence,
            trend=m.trend,
            changePercentage=m.change_percentage,
            reason=m.reason,
            sampleSize=m.sample_size,
        )
        for k, m in calc_map.items()
    }

    return DashboardMetricsResponse(
        businessId=business.id,
        businessName=business.business_name,
        organizationId=auth.org_id,
        currency=business.currency,
        dataQualityScore=quality_score,
        metrics=metrics_resp,
    )


async def get_dashboard_summary(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> DashboardSummaryResponse:
    """
    Constructs the complete Executive Dashboard conforming to docs/API_CONTRACT.md.
    """
    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)

    if df is None or df.empty:
        # Return empty state
        return DashboardSummaryResponse(
            timeframe="30d",
            businessId=business.id,
            businessName=business.business_name,
            organizationId=auth.org_id,
            currency=business.currency,
            hasData=False,
            executiveMetrics=ExecutiveMetricsResponse(
                activeOpportunitiesCount=0,
                unrealizedValueTotal=0.0,
                realizedValueYTD=0.0,
                systemConfidenceAvg=0.0,
                criticalAlertsCount=0,
            ),
            kpis={
                "revenue": KPIMetricResponse(id="kpi-revenue", label="Revenue", value="N/A", available=False, reason="No dataset uploaded"),
                "grossProfit": KPIMetricResponse(id="kpi-gross-profit", label="Gross Profit", value="N/A", available=False, reason="No dataset uploaded"),
                "orders": KPIMetricResponse(id="kpi-orders", label="Orders", value="N/A", available=False, reason="No dataset uploaded"),
                "inventory": KPIMetricResponse(id="kpi-inventory", label="Inventory", value="N/A", available=False, reason="No dataset uploaded"),
                "operatingMargin": KPIMetricResponse(id="kpi-operating-margin", label="Operating Margin", value="N/A", available=False, reason="No dataset uploaded"),
                "businessHealth": KPIMetricResponse(id="kpi-health", label="Business Health", value="0/100", numericValue=0.0, status="neutral", available=False),
            },
            businessHealthIndex=BusinessHealthResponse(
                compositeScore=0.0,
                overallScore=0.0,
                status="neutral",
                revenueEfficiency=0.0,
                supplyChainResilience=0.0,
                pricingLeverage=0.0,
            ),
            performanceSeries={"7D": [], "30D": [], "90D": []},
            channels={},
            recentDecisions=[],
        )

    quality_score = dataset.data_quality_score if dataset else 100.0
    engine = MetricEngine(df, currency=business.currency, data_quality_score=quality_score)

    # Compute calculations
    m_rev = engine.calculate_revenue()
    m_gp = engine.calculate_gross_profit()
    m_ord = engine.calculate_orders()
    m_inv = engine.calculate_inventory_value()
    m_op = engine.calculate_operating_margin()
    health = engine.calculate_business_health_index()
    series = engine.calculate_performance_series()

    perf_points = [PerformanceDataPointResponse(**pt) for pt in series]

    # Multi-channel groupings
    channels: dict[str, Any] = {}
    if "channel" in df.columns:
        for ch_name, group in df.groupby("channel"):
            ch_str = str(ch_name).strip()
            ch_rev = float(group["revenue"].dropna().sum()) if "revenue" in group.columns else 0.0
            ch_orders = int(group["order_id"].dropna().nunique()) if "order_id" in group.columns else len(group)
            channels[ch_str] = {
                "revenue": round(ch_rev, 2),
                "orders": ch_orders,
            }

    kpis = {
        "revenue": KPIMetricResponse(
            id="kpi-revenue",
            label="Net Revenue",
            value=m_rev.formatted_value,
            numericValue=m_rev.value,
            trend=m_rev.trend,
            status="positive" if m_rev.available else "neutral",
            unit="currency",
            available=m_rev.available,
            reason=m_rev.reason,
        ),
        "grossProfit": KPIMetricResponse(
            id="kpi-gross-profit",
            label="Gross Profit",
            value=m_gp.formatted_value,
            numericValue=m_gp.value,
            trend=m_gp.trend,
            status="positive" if m_gp.available else "neutral",
            unit="currency",
            available=m_gp.available,
            reason=m_gp.reason,
        ),
        "orders": KPIMetricResponse(
            id="kpi-orders",
            label="Orders Volume",
            value=m_ord.formatted_value,
            numericValue=m_ord.value,
            trend=m_ord.trend,
            status="positive" if m_ord.available else "neutral",
            unit="count",
            available=m_ord.available,
            reason=m_ord.reason,
        ),
        "inventory": KPIMetricResponse(
            id="kpi-inventory",
            label="Working Inventory",
            value=m_inv.formatted_value,
            numericValue=m_inv.value,
            trend=m_inv.trend,
            status="neutral",
            unit="count",
            available=m_inv.available,
            reason=m_inv.reason,
        ),
        "operatingMargin": KPIMetricResponse(
            id="kpi-operating-margin",
            label="Operating Margin",
            value=m_op.formatted_value,
            numericValue=m_op.value,
            trend=m_op.trend,
            status="positive" if (m_op.value or 0) >= 15.0 else ("warning" if (m_op.value or 0) > 0 else "neutral"),
            unit="percentage",
            available=m_op.available,
            reason=m_op.reason,
        ),
        "businessHealth": KPIMetricResponse(
            id="kpi-health",
            label="Business Health Index",
            value=f"{health['overallScore']}/100",
            numericValue=health['overallScore'],
            trend="up" if health['overallScore'] >= 80 else "flat",
            status=health['status'],
            unit="score",
            available=True,
        ),
    }

    # Executive metrics matching API_CONTRACT.md section 2
    executive = ExecutiveMetricsResponse(
        activeOpportunitiesCount=0,
        unrealizedValueTotal=0.0,
        realizedValueYTD=m_rev.value or 0.0,
        systemConfidenceAvg=quality_score,
        criticalAlertsCount=0,
    )

    return DashboardSummaryResponse(
        timeframe="30d",
        businessId=business.id,
        businessName=business.business_name,
        organizationId=auth.org_id,
        currency=business.currency,
        hasData=True,
        executiveMetrics=executive,
        kpis=kpis,
        businessHealthIndex=BusinessHealthResponse(**health),
        performanceSeries={
            "7D": perf_points[-7:] if len(perf_points) >= 7 else perf_points,
            "30D": perf_points[-30:] if len(perf_points) >= 30 else perf_points,
            "90D": perf_points,
        },
        channels=channels,
        recentDecisions=[],
    )
