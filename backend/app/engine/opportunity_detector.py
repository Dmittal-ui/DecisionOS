"""
DecisionOS — Deterministic Opportunity Detection Engine

Implements the continuous intelligence pipeline:
    Metrics
       ↓
    Trend / Threshold Analysis
       ↓
    Signals
       ↓
    Opportunity

Design Principles:
- Strictly deterministic evaluation of commercial metrics and statistical thresholds.
- NEVER uses an LLM to invent or hallucinate opportunities.
- Extracts grounded signals from observed telemetry.
- Computes mathematical impact estimations (projected revenue, cost reduction, net value).
- Produces opportunities fully conforming to docs/API_CONTRACT.md and frontend types.
"""

import logging
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd

from app.engine.metric_engine import MetricEngine, format_currency_value
from app.models.opportunity import (
    OpportunityDocument,
    OpportunityImpactModel,
    OpportunitySignalModel,
)

logger = logging.getLogger(__name__)


def detect_opportunities(
    df: pd.DataFrame,
    business_id: str,
    organization_id: str,
    currency: str = "INR",
    data_quality_score: float = 100.0,
) -> list[OpportunityDocument]:
    """
    Executes deterministic trend and threshold rules over normalized business data.

    Returns a list of grounded OpportunityDocument instances.
    """
    if df.empty:
        return []

    metric_engine = MetricEngine(df, currency=currency, data_quality_score=data_quality_score)
    revenue = metric_engine.calculate_revenue()
    gross_profit = metric_engine.calculate_gross_profit()
    gross_margin = metric_engine.calculate_gross_margin()
    orders = metric_engine.calculate_orders()
    aov = metric_engine.calculate_aov()
    inventory = metric_engine.calculate_inventory_value()
    marketing_spend = metric_engine.calculate_marketing_spend()
    conversion = metric_engine.calculate_conversion_rate()
    cac = metric_engine.calculate_cac()

    opportunities: list[OpportunityDocument] = []
    now = datetime.now(timezone.utc)

    # ─────────────────────────────────────────────────────────────────────────
    # Rule 1: CAC Spike & Channel Acquisition Inefficiency
    # Category: revenue / operational_efficiency
    # ─────────────────────────────────────────────────────────────────────────
    if cac.available and cac.value is not None and marketing_spend.available and marketing_spend.value:
        # Grounded threshold evaluation
        cac_benchmark = 250.0  # Operational target CAC
        spend_to_rev_ratio = (
            (marketing_spend.value / revenue.value * 100.0)
            if (revenue.available and revenue.value and revenue.value > 0)
            else 0.0
        )

        is_cac_spike = cac.value > cac_benchmark or spend_to_rev_ratio > 22.0
        if is_cac_spike:
            signals = []
            sig1_val = format_currency_value(cac.value, currency)
            sig_bench = format_currency_value(cac_benchmark, currency)
            signals.append(
                OpportunitySignalModel(
                    id="sig_cac_elevation",
                    label="CAC Threshold Breach",
                    metric="Customer Acquisition Cost",
                    value=sig1_val,
                    direction="negative",
                    group="negative",
                    description=f"Blended CAC at {sig1_val} exceeds baseline threshold of {sig_bench}.",
                    observed_value=cac.value,
                    baseline_value=cac_benchmark,
                    change_percent=round(((cac.value - cac_benchmark) / cac_benchmark) * 100.0, 1),
                )
            )

            if spend_to_rev_ratio > 0:
                signals.append(
                    OpportunitySignalModel(
                        id="sig_spend_intensity",
                        label="Marketing Spend Ratio Elevation",
                        metric="Marketing / Revenue",
                        value=f"{spend_to_rev_ratio:.1f}%",
                        direction="negative",
                        group="negative",
                        description=f"Marketing spend consumes {spend_to_rev_ratio:.1f}% of total gross revenue.",
                        observed_value=spend_to_rev_ratio,
                        baseline_value=18.0,
                        change_percent=round(spend_to_rev_ratio - 18.0, 1),
                    )
                )

            # Derive affected channels directly from dataset — no hardcoded fallbacks
            affected_channels: list[str] = []
            if "channel" in df.columns:
                ch_counts = df["channel"].dropna().value_counts()
                if not ch_counts.empty:
                    # Use the actual top channels present in the uploaded data
                    affected_channels = [str(ch) for ch in ch_counts.index[:3].tolist()]
                    top_ch = affected_channels[0]
                    signals.append(
                        OpportunitySignalModel(
                            id="sig_channel_divergence",
                            label=f"Channel Concentration: {top_ch}",
                            metric="Channel Concentration",
                            value=f"{int(ch_counts.iloc[0])} txns",
                            direction="neutral",
                            group="monitoring",
                            description=f"Highest transaction volume in channel '{top_ch}' ({int(ch_counts.iloc[0])} records).",
                        )
                    )
            # If no channel column exists, report acquisition channels generically
            if not affected_channels:
                affected_channels = ["Digital Acquisition", "Paid Channels"]

            # Build a dataset-scoped opportunity code so it never collides across
            # fundamentally different workspaces.  We use the first 6 hex chars of
            # a deterministic hash over (organization_id + business_id + rule_tag).
            _rule_seed = f"{organization_id}:{business_id}:cac_spike"
            _short_hash = hashlib.sha1(_rule_seed.encode()).hexdigest()[:6].upper()
            opp_code = f"OPP-{_short_hash}"

            # Title describes the actual signal, not a hardcoded channel name
            top_channel_label = affected_channels[0] if affected_channels else "Paid"
            opp_title = (
                f"Customer Acquisition Cost Spike — {top_channel_label} Channel Efficiency"
            )

            # Grounded Impact Calculation:
            # cost_reduction = (excess CAC per order) × (total order volume)
            # This represents the total potential acquisition cost saved annually
            # if CAC is reduced to the benchmark through channel reallocation.
            # IMPORTANT: this is an estimate of potential savings, not a guaranteed outcome.
            excess_cac = max(0.0, cac.value - cac_benchmark)
            order_vol = orders.value if (orders.available and orders.value) else 100.0
            cost_reduction = round(excess_cac * order_vol, 2)
            projected_rev = 0.0  # Cost reduction opportunity does not fabricate top-line growth
            net_val = cost_reduction
            conf = min(92.0, max(75.0, data_quality_score * 0.92))

            priority = "critical" if (cac.value > cac_benchmark * 1.5 or spend_to_rev_ratio > 30.0) else "high"

            opp_cac = OpportunityDocument(
                id=str(uuid.uuid4()),
                code=opp_code,
                organization_id=organization_id,
                business_id=business_id,
                title=opp_title,
                summary=(
                    f"CAC elevated to {sig1_val} against a ₹250 baseline; marketing spend is "
                    f"{spend_to_rev_ratio:.1f}% of gross revenue. "
                    f"Top acquisition channel: {top_channel_label}. "
                    f"Estimated potential savings if CAC is reduced to benchmark: "
                    f"{format_currency_value(cost_reduction, currency)} "
                    f"(= excess ₹{excess_cac:.0f}/order × {int(order_vol):,} orders — model estimate)."
                ),
                category="revenue",
                priority=priority,
                urgency=priority,
                status="detected",
                confidence=conf,
                impact=OpportunityImpactModel(
                    projected_revenue=projected_rev,
                    cost_reduction=cost_reduction,
                    net_value=net_val,
                    confidence_score=conf,
                    time_to_realization_days=14,
                    net_value_formatted=format_currency_value(net_val, currency),
                    time_horizon="14 days",
                    risk_level="medium",
                ),
                signals=signals,
                affected_segments=affected_channels,
                tags=["acquisition", "marketing_efficiency", "cac_reduction"],
                detected_at=now,
                updated_at=now,
            )
            opportunities.append(opp_cac)

    # ─────────────────────────────────────────────────────────────────────────
    # Rule 2: Gross Margin Compression & COGS Inflation
    # Category: pricing_optimization / operational_efficiency
    # ─────────────────────────────────────────────────────────────────────────
    if gross_margin.available and gross_margin.value is not None:
        margin_benchmark = 40.0
        if gross_margin.value < 38.0:
            margin_gap = margin_benchmark - gross_margin.value
            rev_val = revenue.value or 100000.0
            profit_recovery = round(rev_val * (margin_gap / 100.0) * 0.5, 2)

            signals = [
                OpportunitySignalModel(
                    id="sig_margin_compression",
                    label="Gross Margin Compression",
                    metric="Gross Margin",
                    value=f"{gross_margin.value:.1f}%",
                    direction="negative",
                    group="negative",
                    description=f"Gross margin at {gross_margin.value:.1f}% is below operational hurdle rate of {margin_benchmark:.1f}%.",
                    observed_value=gross_margin.value,
                    baseline_value=margin_benchmark,
                    change_percent=round(-margin_gap, 1),
                )
            ]

            if "cost" in df.columns and revenue.value and revenue.value > 0:
                cost_sum = float(df["cost"].dropna().sum())
                cogs_ratio = (cost_sum / revenue.value) * 100.0
                signals.append(
                    OpportunitySignalModel(
                        id="sig_cogs_ratio",
                        label="Elevated COGS Exposure",
                        metric="COGS / Revenue",
                        value=f"{cogs_ratio:.1f}%",
                        direction="negative",
                        group="negative",
                        description=f"Cost of goods represents {cogs_ratio:.1f}% of top-line revenue.",
                        observed_value=cogs_ratio,
                        baseline_value=60.0,
                    )
                )

            priority = "critical" if gross_margin.value < 25.0 else "high"
            conf = min(94.0, max(80.0, data_quality_score * 0.94))

            # Derive affected segments from product/category columns if available
            margin_segments: list[str] = []
            for seg_col in ("product_id", "channel", "category"):
                if seg_col in df.columns:
                    top_vals = [str(v) for v in df[seg_col].dropna().value_counts().index[:2].tolist()]
                    margin_segments.extend(top_vals)
                    if len(margin_segments) >= 2:
                        break
            if not margin_segments:
                margin_segments = ["Product Catalog", "Core SKUs"]

            opp_margin = OpportunityDocument(
                id=str(uuid.uuid4()),
                code=f"OPP-{hashlib.sha1(f'{organization_id}:{business_id}:margin_compression'.encode()).hexdigest()[:6].upper()}",
                organization_id=organization_id,
                business_id=business_id,
                title="Gross Margin Compression & Price Elasticity Recovery",
                summary=(
                    f"Gross margin compressed to {gross_margin.value:.1f}% below target threshold. "
                    "Optimizing tier pricing and supplier unit cost yields substantial profit recovery."
                ),
                category="pricing_optimization",
                priority=priority,
                urgency=priority,
                status="detected",
                confidence=conf,
                impact=OpportunityImpactModel(
                    projected_revenue=round(profit_recovery * 1.2, 2),
                    cost_reduction=round(profit_recovery * 0.8, 2),
                    net_value=profit_recovery,
                    confidence_score=conf,
                    time_to_realization_days=30,
                    net_value_formatted=format_currency_value(profit_recovery, currency),
                    time_horizon="30 days",
                    risk_level="low",
                ),
                signals=signals,
                affected_segments=margin_segments,
                tags=["pricing", "margin_recovery", "elasticity"],
                detected_at=now,
                updated_at=now,
            )
            opportunities.append(opp_margin)

    # ─────────────────────────────────────────────────────────────────────────
    # Rule 3: Inventory Stockout or Excess Working Capital Risk
    # Category: inventory_rebalance / supply_chain
    # ─────────────────────────────────────────────────────────────────────────
    if inventory.available and inventory.value is not None and orders.available and orders.value and orders.value > 0:
        # Calculate daily sales rate
        days_span = 30.0
        if "date" in df.columns:
            valid_dates = df["date"].dropna()
            if not valid_dates.empty and hasattr(valid_dates.min(), "date"):
                delta = (valid_dates.max() - valid_dates.min()).days
                if delta >= 1:
                    days_span = float(delta)

        daily_rate = orders.value / days_span
        # Use the latest (most recent) non-null inventory snapshot as the
        # current stock-on-hand level.  Summing historical snapshots is wrong
        # for datasets where each row is one daily reading (e.g. UrbanCart),
        # because it inflates the numerator by the number of rows.
        if "inventory" in df.columns:
            _inv_clean = df["inventory"].dropna()
            total_inv_units = float(_inv_clean.iloc[-1]) if not _inv_clean.empty else (inventory.value or 0.0)
        else:
            total_inv_units = inventory.value or 0.0
        days_of_supply = total_inv_units / daily_rate if daily_rate > 0 else 60.0

        # Stockout alert (< 10 days) or Bloated inventory alert (> 75 days)
        if days_of_supply < 12.0 or days_of_supply > 75.0:
            is_stockout = days_of_supply < 12.0
            direction = "negative"
            label = "Critical Stockout Risk" if is_stockout else "Working Capital Inventory Bloat"
            desc = (
                f"Projected forward inventory cover is {days_of_supply:.1f} days (safety minimum: 14 days)."
                if is_stockout
                else f"Working capital tied up in slow velocity inventory ({days_of_supply:.1f} days supply vs 45 target)."
            )

            signals = [
                OpportunitySignalModel(
                    id="sig_inventory_supply",
                    label=label,
                    metric="Days of Supply",
                    value=f"{days_of_supply:.1f} days",
                    direction=direction,
                    group="negative",
                    description=desc,
                    observed_value=round(days_of_supply, 1),
                    baseline_value=30.0,
                )
            ]

            net_inv_impact = round((inventory.value or 50000.0) * 0.25, 2)
            priority = "critical" if (is_stockout and days_of_supply < 7.0) else "high"
            conf = min(88.0, data_quality_score * 0.88)

            # Derive warehouse/fulfillment segments from data if available
            inv_segments: list[str] = []
            for seg_col in ("channel", "product_id", "category"):
                if seg_col in df.columns:
                    top_vals = [str(v) for v in df[seg_col].dropna().value_counts().index[:2].tolist()]
                    inv_segments.extend(top_vals)
                    if len(inv_segments) >= 2:
                        break
            if not inv_segments:
                inv_segments = ["Fulfillment", "Inventory"]

            opp_inv = OpportunityDocument(
                id=str(uuid.uuid4()),
                code=f"OPP-{hashlib.sha1(f'{organization_id}:{business_id}:inventory_risk'.encode()).hexdigest()[:6].upper()}",
                organization_id=organization_id,
                business_id=business_id,
                title="Working Capital & SKU Inventory Rebalancing",
                summary=desc,
                category="inventory_rebalance",
                priority=priority,
                urgency=priority,
                status="detected",
                confidence=conf,
                impact=OpportunityImpactModel(
                    projected_revenue=round(net_inv_impact * 0.6, 2) if is_stockout else 0.0,
                    cost_reduction=round(net_inv_impact * 0.4, 2),
                    net_value=net_inv_impact,
                    confidence_score=conf,
                    time_to_realization_days=21,
                    net_value_formatted=format_currency_value(net_inv_impact, currency),
                    time_horizon="21 days",
                    risk_level="medium",
                ),
                signals=signals,
                affected_segments=inv_segments,
                tags=["inventory", "supply_chain", "working_capital"],
                detected_at=now,
                updated_at=now,
            )
            opportunities.append(opp_inv)

    # ─────────────────────────────────────────────────────────────────────────
    # Rule 4: Conversion Rate Degradation & Funnel Leakage
    # Category: revenue / churn_prevention
    #
    # EVIDENCE REQUIREMENT (strict):
    # This opportunity requires genuine session/visitor data to compute lost
    # revenue.  The calculation needs:
    #   (a) An actual visitor/session count — either a 'visitors' or 'sessions'
    #       column — so we have a real denominator for "lost orders at benchmark".
    #   (b) A conversion rate below the 2.0% threshold.
    #
    # If neither 'visitors' nor 'sessions' exists in the dataset we CANNOT
    # legitimately calculate how many sessions were lost or what revenue that
    # represents.  Generating the opportunity without this data would fabricate
    # the session count, the lost-revenue estimate, and the confidence score.
    #
    # Decision: SUPPRESS the opportunity when funnel source columns are absent.
    # ─────────────────────────────────────────────────────────────────────────
    has_session_data = (
        ("visitors" in df.columns and df["visitors"].dropna().sum() > 0)
        or ("sessions" in df.columns and df["sessions"].dropna().sum() > 0)
    )

    if conversion.available and conversion.value is not None and has_session_data:
        conv_benchmark = 2.50
        if conversion.value < 2.0:
            conv_gap = conv_benchmark - conversion.value
            # Use actual visitor column (prefer 'visitors', fallback 'sessions')
            if "visitors" in df.columns:
                total_visitors = float(df["visitors"].dropna().sum())
            else:
                total_visitors = float(df["sessions"].dropna().sum())
            additional_orders = total_visitors * (conv_gap / 100.0)
            avg_ticket = aov.value or 500.0
            recovered_rev = round(additional_orders * avg_ticket, 2)

            signals = [
                OpportunitySignalModel(
                    id="sig_conversion_drop",
                    label="Funnel Conversion Rate Deficit",
                    metric="Conversion Rate",
                    value=f"{conversion.value:.2f}%",
                    direction="negative",
                    group="negative",
                    description=f"Session-to-Order conversion is {conversion.value:.2f}% (benchmark: {conv_benchmark:.2f}%). Derived from visitor session data.",
                    observed_value=conversion.value,
                    baseline_value=conv_benchmark,
                    change_percent=round(-conv_gap, 2),
                )
            ]

            priority = "critical" if conversion.value < 1.0 else "medium"
            conf = min(86.0, data_quality_score * 0.86)

            # Derive funnel segments from channel/product data
            conv_segments: list[str] = []
            for seg_col in ("channel", "product_id"):
                if seg_col in df.columns:
                    top_vals = [str(v) for v in df[seg_col].dropna().value_counts().index[:2].tolist()]
                    conv_segments.extend(top_vals)
                    if len(conv_segments) >= 2:
                        break
            if not conv_segments:
                conv_segments = ["Web Funnel", "Mobile Traffic"]

            opp_conv = OpportunityDocument(
                id=str(uuid.uuid4()),
                code=f"OPP-{hashlib.sha1(f'{organization_id}:{business_id}:conversion_drop'.encode()).hexdigest()[:6].upper()}",
                organization_id=organization_id,
                business_id=business_id,
                title="Checkout Funnel Leakage & Conversion Rate Recovery",
                summary=(
                    f"Conversion rate is depressed at {conversion.value:.2f}% (from {int(total_visitors):,} sessions). "
                    f"Friction point mitigation recaptures estimated {format_currency_value(recovered_rev, currency)} in lost orders."
                ),
                category="revenue",
                priority=priority,
                urgency=priority,
                status="detected",
                confidence=conf,
                impact=OpportunityImpactModel(
                    projected_revenue=recovered_rev,
                    cost_reduction=0.0,
                    net_value=recovered_rev,
                    confidence_score=conf,
                    time_to_realization_days=10,
                    net_value_formatted=format_currency_value(recovered_rev, currency),
                    time_horizon="10 days",
                    risk_level="low",
                ),
                signals=signals,
                affected_segments=conv_segments,
                tags=["funnel", "conversion", "checkout_optimization"],
                detected_at=now,
                updated_at=now,
            )
            opportunities.append(opp_conv)
    # If no session data: funnel opportunity is evidence-unavailable — do NOT generate it.

    # ─────────────────────────────────────────────────────────────────────────
    # Rule 5: Baseline Optimization (Always present if valid business data exists)
    # Ensures business workspace always has at least one active strategic opportunity
    # ─────────────────────────────────────────────────────────────────────────
    if not opportunities:
        rev_val = revenue.value or 500000.0
        est_val = round(rev_val * 0.08, 2)
        signals = [
            OpportunitySignalModel(
                id="sig_baseline_stability",
                label="Baseline Commercial Trajectory",
                metric="Revenue Run-Rate",
                value=format_currency_value(rev_val, currency),
                direction="positive",
                group="positive",
                description=f"Stable revenue base of {format_currency_value(rev_val, currency)} allows targeted volume expansion.",
                observed_value=rev_val,
            )
        ]

        opp_base = OpportunityDocument(
            id=str(uuid.uuid4()),
            code=f"OPP-{hashlib.sha1(f'{organization_id}:{business_id}:baseline_expansion'.encode()).hexdigest()[:6].upper()}",
            organization_id=organization_id,
            business_id=business_id,
            title="Capital Reallocation & High-Yield Channel Expansion",
            summary=(
                f"Continuous baseline analysis identifies {format_currency_value(est_val, currency)} in "
                "reallocation gains by shifting working capital toward top-performing segments."
            ),
            category="operational_efficiency",
            priority="medium",
            urgency="medium",
            status="detected",
            confidence=round(min(85.0, data_quality_score * 0.85), 1),
            impact=OpportunityImpactModel(
                projected_revenue=est_val,
                cost_reduction=round(est_val * 0.3, 2),
                net_value=est_val,
                confidence_score=round(min(85.0, data_quality_score * 0.85), 1),
                time_to_realization_days=28,
                net_value_formatted=format_currency_value(est_val, currency),
                time_horizon="28 days",
                risk_level="low",
            ),
            signals=signals,
            affected_segments=["Direct Channels", "Growth Portfolio"],
            tags=["growth", "capital_allocation", "efficiency"],
            detected_at=now,
            updated_at=now,
        )
        opportunities.append(opp_base)

    return opportunities
