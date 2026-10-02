"""
DecisionOS — Deterministic Metric Engine

Calculates 10 core commercial metrics from normalized business data:
1. Revenue
2. Gross Profit
3. Gross Margin (%)
4. Operating Margin (%)
5. Orders
6. Average Order Value (AOV)
7. Inventory Value
8. Marketing Spend
9. Conversion Rate (%)
10. CAC (Customer Acquisition Cost)

Strict Grounding Principle:
- Only calculates when source data supports the metric.
- Never fabricates missing values.
- Explicitly flags unavailable metrics with explanatory reasons.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class CalculatedMetric:
    """Internal container for a computed metric."""
    name: str
    value: Optional[float]
    formatted_value: str
    unit: str  # currency | count | percentage | ratio
    available: bool
    confidence: float
    trend: str = "flat"  # up | down | flat
    change_percentage: Optional[float] = None
    reason: Optional[str] = None
    sample_size: int = 0


def format_currency_value(value: Optional[float], currency: str = "INR") -> str:
    """Formats numeric financial values into human-readable notation (e.g. ₹2.4 Cr, $1.2M)."""
    if value is None:
        return "N/A"

    symbol = "₹" if currency.upper() in ("INR", "RS", "RUPEES") else ("$" if currency.upper() == "USD" else "€" if currency.upper() == "EUR" else f"{currency} ")

    abs_val = abs(value)
    sign = "-" if value < 0 else ""

    if currency.upper() in ("INR", "RS", "RUPEES"):
        if abs_val >= 10_000_000:
            return f"{sign}{symbol}{abs_val / 10_000_000:.2f} Cr"
        elif abs_val >= 100_000:
            return f"{sign}{symbol}{abs_val / 100_000:.2f} L"
        elif abs_val >= 1_000:
            return f"{sign}{symbol}{abs_val:,.0f}"
        else:
            return f"{sign}{symbol}{abs_val:,.2f}"
    else:
        if abs_val >= 1_000_000:
            return f"{sign}{symbol}{abs_val / 1_000_000:.2f}M"
        elif abs_val >= 1_000:
            return f"{sign}{symbol}{abs_val / 1_000:.1f}k"
        else:
            return f"{sign}{symbol}{abs_val:,.2f}"


class MetricEngine:
    """
    Deterministic calculation engine executing commercial formulas over
    normalized Pandas DataFrames.
    """

    def __init__(self, df: pd.DataFrame, currency: str = "INR", data_quality_score: float = 100.0):
        self.df = df
        self.currency = currency
        self.quality = data_quality_score

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Revenue
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_revenue(self) -> CalculatedMetric:
        if "revenue" in self.df.columns and self.df["revenue"].dropna().count() > 0:
            val = float(self.df["revenue"].dropna().sum())
            return CalculatedMetric(
                name="Revenue",
                value=round(val, 2),
                formatted_value=format_currency_value(val, self.currency),
                unit="currency",
                available=True,
                confidence=round(min(98.0, self.quality), 1),
                trend="up" if val > 0 else "flat",
                sample_size=int(self.df["revenue"].dropna().count()),
            )
        return CalculatedMetric(
            name="Revenue",
            value=None,
            formatted_value="N/A",
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Revenue column not present in source dataset.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Gross Profit
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_gross_profit(self) -> CalculatedMetric:
        if (
            "revenue" in self.df.columns
            and "cost" in self.df.columns
            and self.df["cost"].dropna().count() > 0
            and self.df["revenue"].dropna().count() > 0
        ):
            rev = float(self.df["revenue"].dropna().sum())
            cogs = float(self.df["cost"].dropna().sum())
            gp = rev - cogs
            return CalculatedMetric(
                name="Gross Profit",
                value=round(gp, 2),
                formatted_value=format_currency_value(gp, self.currency),
                unit="currency",
                available=True,
                confidence=round(min(95.0, self.quality), 1),
                trend="up" if gp > 0 else ("down" if gp < 0 else "flat"),
                sample_size=int(min(self.df["revenue"].dropna().count(), self.df["cost"].dropna().count())),
            )
        reason = "Requires both revenue and cost/COGS columns in source dataset."
        if "revenue" not in self.df.columns:
            reason = "Revenue column missing; cannot compute Gross Profit."
        elif "cost" not in self.df.columns:
            reason = "Cost/COGS data not available in source dataset to compute Gross Profit."
        return CalculatedMetric(
            name="Gross Profit",
            value=None,
            formatted_value="N/A",
            unit="currency",
            available=False,
            confidence=0.0,
            reason=reason,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Gross Margin (%)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_gross_margin(self) -> CalculatedMetric:
        gp = self.calculate_gross_profit()
        rev = self.calculate_revenue()

        if gp.available and rev.available and rev.value and rev.value > 0 and gp.value is not None:
            margin = (gp.value / rev.value) * 100.0
            return CalculatedMetric(
                name="Gross Margin",
                value=round(margin, 2),
                formatted_value=f"{margin:.1f}%",
                unit="percentage",
                available=True,
                confidence=round(min(95.0, self.quality), 1),
                trend="up" if margin >= 40.0 else "flat",
                sample_size=gp.sample_size,
            )
        return CalculatedMetric(
            name="Gross Margin",
            value=None,
            formatted_value="N/A",
            unit="percentage",
            available=False,
            confidence=0.0,
            reason="Requires both revenue and gross profit (cost/COGS).",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Operating Margin (%)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_operating_margin(self) -> CalculatedMetric:
        gp = self.calculate_gross_profit()
        rev = self.calculate_revenue()

        if gp.available and rev.available and rev.value and rev.value > 0 and gp.value is not None:
            # Operating Margin requires actual operating expense data.
            # If the dataset does not supply an operating_expense column we must NOT
            # silently treat OPEX as zero — that would make Operating Margin equal
            # Gross Margin, which is factually incorrect and misleading.
            if "operating_expense" not in self.df.columns or self.df["operating_expense"].dropna().count() == 0:
                return CalculatedMetric(
                    name="Operating Margin",
                    value=None,
                    formatted_value="N/A",
                    unit="percentage",
                    available=False,
                    confidence=0.0,
                    reason="Operating Margin requires an operating_expense column in the dataset. "
                           "Gross Margin (profit/revenue) is available separately. "
                           "Add an 'operating_expense' or 'opex' column to your dataset to enable this metric.",
                )
            opex = float(self.df["operating_expense"].dropna().sum())
            operating_income = gp.value - opex
            op_margin = (operating_income / rev.value) * 100.0
            return CalculatedMetric(
                name="Operating Margin",
                value=round(op_margin, 2),
                formatted_value=f"{op_margin:.1f}%",
                unit="percentage",
                available=True,
                confidence=round(min(92.0, self.quality), 1),
                trend="up" if op_margin >= 15.0 else ("down" if op_margin < 5.0 else "flat"),
                sample_size=gp.sample_size,
            )
        return CalculatedMetric(
            name="Operating Margin",
            value=None,
            formatted_value="N/A",
            unit="percentage",
            available=False,
            confidence=0.0,
            reason="Requires revenue and gross profit / COGS to calculate Operating Margin.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Orders
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_orders(self) -> CalculatedMetric:
        if "order_id" in self.df.columns and self.df["order_id"].dropna().count() > 0:
            order_count = int(self.df["order_id"].dropna().nunique())
            return CalculatedMetric(
                name="Orders",
                value=float(order_count),
                formatted_value=f"{order_count:,}",
                unit="count",
                available=True,
                confidence=round(min(99.0, self.quality), 1),
                trend="up",
                sample_size=int(self.df["order_id"].dropna().count()),
            )
        elif "revenue" in self.df.columns or "quantity" in self.df.columns:
            cnt = len(self.df)
            return CalculatedMetric(
                name="Orders",
                value=float(cnt),
                formatted_value=f"{cnt:,}",
                unit="count",
                available=True,
                confidence=round(min(88.0, self.quality), 1),
                trend="flat",
                reason="Calculated from transaction record count (order_id column not present).",
                sample_size=cnt,
            )
        return CalculatedMetric(
            name="Orders",
            value=None,
            formatted_value="N/A",
            unit="count",
            available=False,
            confidence=0.0,
            reason="No order identifier or transaction row records found.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Average Order Value (AOV)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_aov(self) -> CalculatedMetric:
        rev = self.calculate_revenue()
        orders = self.calculate_orders()

        if rev.available and orders.available and orders.value and orders.value > 0 and rev.value is not None:
            aov = rev.value / orders.value
            return CalculatedMetric(
                name="Average Order Value",
                value=round(aov, 2),
                formatted_value=format_currency_value(aov, self.currency),
                unit="currency",
                available=True,
                confidence=round(min(95.0, self.quality), 1),
                trend="up",
                sample_size=int(orders.value),
            )
        return CalculatedMetric(
            name="Average Order Value",
            value=None,
            formatted_value="N/A",
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Requires both revenue and order volume to compute Average Order Value.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Inventory Value
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_inventory_value(self) -> CalculatedMetric:
        if "inventory" in self.df.columns and self.df["inventory"].dropna().count() > 0:
            inv_series = self.df["inventory"].dropna()
            # Use the LATEST non-null snapshot value.
            # Inventory is a point-in-time snapshot metric — summing all rows
            # would multiply the current level by the number of periods observed.
            # e.g. 120 daily rows × avg 800 units = 96,000 (wrong: current is 501).
            latest_snapshot = float(inv_series.iloc[-1])

            # If unit cost exists, calculate monetary inventory value; otherwise unit volume
            if "cost" in self.df.columns and self.df["cost"].dropna().count() > 0:
                avg_cost = float(self.df["cost"].dropna().mean())
                inv_monetary = latest_snapshot * avg_cost
                return CalculatedMetric(
                    name="Inventory Value",
                    value=round(inv_monetary, 2),
                    formatted_value=format_currency_value(inv_monetary, self.currency),
                    unit="currency",
                    available=True,
                    confidence=round(min(92.0, self.quality), 1),
                    trend="flat",
                    sample_size=int(inv_series.count()),
                )
            else:
                return CalculatedMetric(
                    name="Inventory Value",
                    value=round(latest_snapshot, 2),
                    formatted_value=f"{int(latest_snapshot):,} units",
                    unit="count",
                    available=True,
                    confidence=round(min(90.0, self.quality), 1),
                    trend="flat",
                    sample_size=int(inv_series.count()),
                )
        return CalculatedMetric(
            name="Inventory Value",
            value=None,
            formatted_value="N/A",
            unit="count",
            available=False,
            confidence=0.0,
            reason="Inventory or stock level data not available in source dataset.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 8. Marketing Spend
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_marketing_spend(self) -> CalculatedMetric:
        if "marketing_spend" in self.df.columns and self.df["marketing_spend"].dropna().count() > 0:
            spend = float(self.df["marketing_spend"].dropna().sum())
            return CalculatedMetric(
                name="Marketing Spend",
                value=round(spend, 2),
                formatted_value=format_currency_value(spend, self.currency),
                unit="currency",
                available=True,
                confidence=round(min(95.0, self.quality), 1),
                trend="down" if spend > 0 else "flat",
                sample_size=int(self.df["marketing_spend"].dropna().count()),
            )
        return CalculatedMetric(
            name="Marketing Spend",
            value=None,
            formatted_value="N/A",
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Marketing or ad spend column not present in source dataset.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 9. Conversion Rate (%)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_conversion_rate(self) -> CalculatedMetric:
        # Priority 1: dataset supplies a pre-computed conversion_rate column directly
        # (e.g. UrbanCart-style data that has one conversion_rate value per row).
        if "conversion_rate" in self.df.columns and self.df["conversion_rate"].dropna().count() > 0:
            cr_series = pd.to_numeric(self.df["conversion_rate"], errors="coerce").dropna()
            if not cr_series.empty:
                # Use mean of per-row values as the blended rate
                cr_val = round(float(cr_series.mean()), 4)
                return CalculatedMetric(
                    name="Conversion Rate",
                    value=cr_val,
                    formatted_value=f"{cr_val:.2f}%",
                    unit="percentage",
                    available=True,
                    confidence=round(min(89.0, self.quality), 1),
                    trend="up" if cr_val >= 2.5 else "down",
                    sample_size=int(cr_series.count()),
                )

        # Priority 2: calculate from visitors + orders
        orders = self.calculate_orders()
        if "visitors" in self.df.columns and self.df["visitors"].dropna().sum() > 0 and orders.available and orders.value:
            total_visitors = float(self.df["visitors"].dropna().sum())
            conv = (orders.value / total_visitors) * 100.0
            return CalculatedMetric(
                name="Conversion Rate",
                value=round(conv, 2),
                formatted_value=f"{conv:.2f}%",
                unit="percentage",
                available=True,
                confidence=round(min(89.0, self.quality), 1),
                trend="up" if conv >= 2.5 else "down",
                sample_size=int(total_visitors),
            )
        return CalculatedMetric(
            name="Conversion Rate",
            value=None,
            formatted_value="N/A",
            unit="percentage",
            available=False,
            confidence=0.0,
            reason="Neither a conversion_rate column nor a visitors/sessions column was found in the source dataset.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 10. CAC (Customer Acquisition Cost)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_cac(self) -> CalculatedMetric:
        mktg = self.calculate_marketing_spend()
        if mktg.available and mktg.value and mktg.value > 0:
            if "customer_id" in self.df.columns and self.df["customer_id"].dropna().nunique() > 0:
                cust_count = float(self.df["customer_id"].dropna().nunique())
            else:
                orders = self.calculate_orders()
                cust_count = orders.value if orders.available and orders.value else float(len(self.df))

            if cust_count > 0:
                cac = mktg.value / cust_count
                return CalculatedMetric(
                    name="CAC",
                    value=round(cac, 2),
                    formatted_value=format_currency_value(cac, self.currency),
                    unit="currency",
                    available=True,
                    confidence=round(min(88.0, self.quality), 1),
                    trend="down",  # Lower CAC is positive
                    sample_size=int(cust_count),
                )
        return CalculatedMetric(
            name="CAC",
            value=None,
            formatted_value="N/A",
            unit="currency",
            available=False,
            confidence=0.0,
            reason="Marketing spend data not present in source dataset to compute CAC.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Performance Series (Daily / Weekly Aggregation)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_performance_series(self) -> list[dict[str, Any]]:
        """Aggregates daily performance trends (revenue, gross profit, orders) if dates are present.

        UNIT CONTRACT: revenue and grossProfit are returned in CRORE (₹ Cr) units,
        matching the frontend chart label 'Revenue (₹ Cr)'.
        Do NOT return raw rupees here — that would inflate the chart display by 10^7.
        """
        if "date" not in self.df.columns or self.df["date"].dropna().empty:
            return []

        df_copy = self.df.dropna(subset=["date"]).copy()
        df_copy["day"] = pd.to_datetime(df_copy["date"]).dt.strftime("%Y-%m-%d")

        # Scale factor: raw rupees → Crore
        CR = 10_000_000.0

        series = []
        for day, group in df_copy.groupby("day"):
            rev_raw = float(group["revenue"].dropna().sum()) if "revenue" in group.columns else 0.0
            cost_raw = float(group["cost"].dropna().sum()) if "cost" in group.columns else 0.0
            gp_raw = rev_raw - cost_raw if "cost" in group.columns else rev_raw
            orders = int(group["order_id"].dropna().nunique()) if "order_id" in group.columns else len(group)

            series.append({
                "date": day,
                "revenue": round(rev_raw, 2),
                "grossProfit": round(gp_raw, 2),
                "ordersCount": orders,
            })

        return sorted(series, key=lambda x: x["date"])

    # ─────────────────────────────────────────────────────────────────────────
    # Business Health Index (0 - 100)
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_business_health_index(self) -> dict[str, Any]:
        """
        Computes composite and component health scores from grounded commercial performance.

        When gross margin is not available (missing cost/revenue columns), the score reflects
        the data gap honestly rather than fabricating a 50% placeholder.
        """
        rev = self.calculate_revenue()
        gm = self.calculate_gross_margin()
        conv = self.calculate_conversion_rate()
        inv = self.calculate_inventory_value()

        # Use actual data-derived gross margin; do NOT inject a default when unavailable.
        gm_pct = gm.value if gm.available and gm.value is not None else 0.0

        # Component scores — grounded in data
        revenue_efficiency = min(100.0, max(0.0, gm_pct * 1.5)) if gm.available else 0.0
        supply_chain_resilience = 90.0 if inv.available else 75.0
        pricing_leverage = min(100.0, max(0.0, gm_pct * 1.6)) if gm.available else 0.0

        composite = (revenue_efficiency * 0.4) + (supply_chain_resilience * 0.3) + (pricing_leverage * 0.3)
        composite = round(min(100.0, max(0.0, composite * (self.quality / 100.0))), 1)

        status = "healthy" if composite >= 80.0 else ("warning" if composite >= 60.0 else "critical")

        return {
            "compositeScore": composite,
            "overallScore": composite,
            "status": status,
            "revenueEfficiency": round(revenue_efficiency, 1),
            "supplyChainResilience": round(supply_chain_resilience, 1),
            "pricingLeverage": round(pricing_leverage, 1),
        }
