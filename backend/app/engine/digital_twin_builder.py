"""
DecisionOS — Business Digital Twin Builder Engine

Constructs the grounded digital twin state from a normalized DataFrame.
Calculates core commercial metrics:
- revenue
- gross_profit
- orders
- inventory
- marketing_spend
- conversion
- CAC
- operating_margin

Ensures missing dimensions are explicitly flagged with available = False and actionable reasons.
Never fabricates missing data.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd

from app.models.digital_twin import MetricState

logger = logging.getLogger(__name__)


def build_digital_twin_from_dataframe(
    df: pd.DataFrame,
    data_quality_score: float = 100.0,
) -> tuple[dict[str, MetricState], dict[str, Any], Optional[datetime], Optional[datetime]]:
    """
    Constructs the operational Digital Twin metrics and channel aggregations.

    Returns:
        (metrics_dict, channel_metrics_dict, period_start, period_end)
    """
    metrics: dict[str, MetricState] = {}

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Period Detection
    # ─────────────────────────────────────────────────────────────────────────
    period_start = None
    period_end = None
    if "date" in df.columns:
        valid_dates = df["date"].dropna()
        if not valid_dates.empty:
            p_start = valid_dates.min()
            p_end = valid_dates.max()
            if hasattr(p_start, "to_pydatetime"):
                period_start = p_start.to_pydatetime()
            elif isinstance(p_start, datetime):
                period_start = p_start
            if hasattr(p_end, "to_pydatetime"):
                period_end = p_end.to_pydatetime()
            elif isinstance(p_end, datetime):
                period_end = p_end

            # Ensure UTC timezone
            if period_start and period_start.tzinfo is None:
                period_start = period_start.replace(tzinfo=timezone.utc)
            if period_end and period_end.tzinfo is None:
                period_end = period_end.replace(tzinfo=timezone.utc)

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Revenue Metric
    # ─────────────────────────────────────────────────────────────────────────
    if "revenue" in df.columns and df["revenue"].dropna().count() > 0:
        rev_val = float(df["revenue"].dropna().sum())
        metrics["revenue"] = MetricState(
            name="revenue",
            value=round(rev_val, 2),
            unit="currency",
            available=True,
            confidence=round(min(98.0, data_quality_score), 1),
            sample_size=int(df["revenue"].dropna().count()),
        )
    else:
        metrics["revenue"] = MetricState(
            name="revenue",
            value=None,
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Revenue or sales data not present in uploaded dataset.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Orders Metric
    # ─────────────────────────────────────────────────────────────────────────
    if "order_id" in df.columns and df["order_id"].dropna().count() > 0:
        order_count = int(df["order_id"].dropna().nunique())
        metrics["orders"] = MetricState(
            name="orders",
            value=float(order_count),
            unit="count",
            available=True,
            confidence=round(min(99.0, data_quality_score), 1),
            sample_size=int(df["order_id"].dropna().count()),
        )
    elif "revenue" in df.columns or "quantity" in df.columns:
        metrics["orders"] = MetricState(
            name="orders",
            value=float(len(df)),
            unit="count",
            available=True,
            confidence=round(min(88.0, data_quality_score), 1),
            reason="Estimated from transaction row count (order_id column not present).",
            sample_size=len(df),
        )
    else:
        metrics["orders"] = MetricState(
            name="orders",
            value=None,
            unit="count",
            available=False,
            confidence=0.0,
            reason="No order identifier or transaction records present.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Gross Profit Metric
    # ─────────────────────────────────────────────────────────────────────────
    if (
        "revenue" in df.columns
        and "cost" in df.columns
        and df["cost"].dropna().count() > 0
        and df["revenue"].dropna().count() > 0
    ):
        rev = df["revenue"].dropna().sum()
        cogs = df["cost"].dropna().sum()
        gp_val = float(rev - cogs)
        metrics["gross_profit"] = MetricState(
            name="gross_profit",
            value=round(gp_val, 2),
            unit="currency",
            available=True,
            confidence=round(min(95.0, data_quality_score), 1),
            sample_size=int(min(df["revenue"].dropna().count(), df["cost"].dropna().count())),
        )
    else:
        reason = "Requires both revenue and cost/COGS columns in the dataset."
        if "revenue" not in df.columns:
            reason = "Revenue column missing; cannot compute gross profit."
        elif "cost" not in df.columns:
            reason = "Cost/COGS column not present in dataset; required to compute gross profit."
        metrics["gross_profit"] = MetricState(
            name="gross_profit",
            value=None,
            unit="currency",
            available=False,
            confidence=0.0,
            reason=reason,
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Inventory Metric
    # ─────────────────────────────────────────────────────────────────────────
    if "inventory" in df.columns and df["inventory"].dropna().count() > 0:
        inv_series = df["inventory"].dropna()
        # Use the most recent (last) non-null value as the current stock-on-hand
        # level.  Each row in a snapshot-style dataset (e.g. one row per day)
        # represents the stock level on that day — summing all rows would give
        # total_rows × avg_level, massively inflating the reported inventory.
        # For a transactional dataset with one inventory column this is also
        # the most recent state.
        inv_val = float(inv_series.iloc[-1])
        metrics["inventory"] = MetricState(
            name="inventory",
            value=round(inv_val, 2),
            unit="count",
            available=True,
            confidence=round(min(92.0, data_quality_score), 1),
            sample_size=int(inv_series.count()),
        )
    else:
        metrics["inventory"] = MetricState(
            name="inventory",
            value=None,
            unit="count",
            available=False,
            confidence=0.0,
            reason="Inventory or stock level data not present in dataset.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Marketing Spend Metric
    # ─────────────────────────────────────────────────────────────────────────
    if "marketing_spend" in df.columns and df["marketing_spend"].dropna().count() > 0:
        mktg_val = float(df["marketing_spend"].dropna().sum())
        metrics["marketing_spend"] = MetricState(
            name="marketing_spend",
            value=round(mktg_val, 2),
            unit="currency",
            available=True,
            confidence=round(min(95.0, data_quality_score), 1),
            sample_size=int(df["marketing_spend"].dropna().count()),
        )
    else:
        metrics["marketing_spend"] = MetricState(
            name="marketing_spend",
            value=None,
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Marketing or ad spend data not present in dataset.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Conversion Rate Metric
    # ─────────────────────────────────────────────────────────────────────────
    # Priority 1: dataset supplies a pre-computed conversion_rate column directly
    if "conversion_rate" in df.columns and df["conversion_rate"].dropna().count() > 0:
        cr_series = pd.to_numeric(df["conversion_rate"], errors="coerce").dropna()
        if not cr_series.empty:
            cr_val = round(float(cr_series.mean()), 4)
            metrics["conversion"] = MetricState(
                name="conversion",
                value=round(cr_val, 2),
                unit="percentage",
                available=True,
                confidence=round(min(89.0, data_quality_score), 1),
                sample_size=int(cr_series.count()),
            )
        else:
            metrics["conversion"] = MetricState(
                name="conversion",
                value=None,
                unit="percentage",
                available=False,
                confidence=0.0,
                reason="conversion_rate column contains no valid numeric entries.",
                sample_size=0,
            )
    # Priority 2: calculate from visitors + orders
    elif "visitors" in df.columns and df["visitors"].dropna().sum() > 0:
        total_visitors = float(df["visitors"].dropna().sum())
        orders_num = metrics["orders"].value or float(len(df))
        conv_rate = (orders_num / total_visitors) * 100.0
        metrics["conversion"] = MetricState(
            name="conversion",
            value=round(conv_rate, 2),
            unit="percentage",
            available=True,
            confidence=round(min(90.0, data_quality_score), 1),
            sample_size=int(total_visitors),
        )
    else:
        metrics["conversion"] = MetricState(
            name="conversion",
            value=None,
            unit="percentage",
            available=False,
            confidence=0.0,
            reason="Neither a conversion_rate column nor a visitors/traffic sessions column was found in the dataset.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 8. CAC (Customer Acquisition Cost) Metric
    # ─────────────────────────────────────────────────────────────────────────
    if (
        metrics["marketing_spend"].available
        and metrics["marketing_spend"].value is not None
        and metrics["marketing_spend"].value > 0
    ):
        mktg_spend = metrics["marketing_spend"].value
        if "customer_id" in df.columns and df["customer_id"].dropna().nunique() > 0:
            customers = float(df["customer_id"].dropna().nunique())
        elif metrics["orders"].available and metrics["orders"].value:
            customers = metrics["orders"].value
        else:
            customers = float(len(df))

        cac_val = mktg_spend / customers if customers > 0 else 0.0
        metrics["cac"] = MetricState(
            name="cac",
            value=round(cac_val, 2),
            unit="currency",
            available=True,
            confidence=round(min(88.0, data_quality_score), 1),
            sample_size=int(customers),
        )
    else:
        metrics["cac"] = MetricState(
            name="cac",
            value=None,
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Marketing spend data not present in dataset to calculate CAC.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 9. Operating Margin Metric
    # ─────────────────────────────────────────────────────────────────────────
    if (
        metrics["gross_profit"].available
        and metrics["revenue"].available
        and metrics["revenue"].value
        and metrics["revenue"].value > 0
    ):
        gp = metrics["gross_profit"].value
        rev = metrics["revenue"].value
        # Only compute operating margin when actual OPEX data exists in the dataset.
        # Defaulting OPEX to zero makes operating margin equal gross margin which is
        # factually wrong — mark it UNAVAILABLE instead.
        if "operating_expense" in df.columns and df["operating_expense"].dropna().count() > 0:
            opex = float(df["operating_expense"].dropna().sum())
            operating_income = gp - opex
            op_margin = (operating_income / rev) * 100.0
            metrics["operating_margin"] = MetricState(
                name="operating_margin",
                value=round(op_margin, 2),
                unit="percentage",
                available=True,
                confidence=round(min(91.0, data_quality_score), 1),
                sample_size=len(df),
            )
        else:
            metrics["operating_margin"] = MetricState(
                name="operating_margin",
                value=None,
                unit="percentage",
                available=False,
                confidence=0.0,
                reason="Operating Margin requires an operating_expense column in the dataset. "
                       "Gross Margin is shown separately. Add 'operating_expense' or 'opex' to your dataset.",
                sample_size=0,
            )
    else:
        metrics["operating_margin"] = MetricState(
            name="operating_margin",
            value=None,
            unit="percentage",
            available=False,
            confidence=0.0,
            reason="Requires revenue and gross profit / COGS data in dataset.",
            sample_size=0,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 10. Multi-Channel Breakdown
    # ─────────────────────────────────────────────────────────────────────────
    channel_metrics: dict[str, Any] = {}
    if "channel" in df.columns:
        channels_grouped = df.groupby("channel")
        for ch_name, group in channels_grouped:
            ch_str = str(ch_name).strip()
            ch_rev = float(group["revenue"].dropna().sum()) if "revenue" in group.columns else 0.0
            ch_qty = float(group["quantity"].dropna().sum()) if "quantity" in group.columns else 0.0
            ch_orders = int(group["order_id"].dropna().nunique()) if "order_id" in group.columns else len(group)
            channel_metrics[ch_str] = {
                "revenue": round(ch_rev, 2),
                "orders": ch_orders,
                "quantity": round(ch_qty, 2),
            }

    return metrics, channel_metrics, period_start, period_end
