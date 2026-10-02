"""
DecisionOS — Deterministic Constraint-Aware Optimizer Engine

Algorithm: Deterministic Discrete Grid Search Solver.
Pipeline:
    Generate candidates
       ↓
    Evaluate each candidate
       ↓
    Reject constraint violations
       ↓
    Keep feasible candidates
       ↓
    Evaluate objective function
       ↓
    Select recommended feasible configuration

GUARANTEES:
1. Strict Feasibility: NEVER returns an infeasible configuration as the recommendation.
   If constraints are infeasible, explicitly reports 'infeasible' with violated constraints.
2. Scientific Honesty: Truthfully discloses deterministic discrete grid search.
   Does not claim Monte Carlo or continuous Pareto frontier optimization unless actually executed.
"""

import logging
import math
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import pandas as pd

from app.engine.metric_engine import MetricEngine, format_currency_value

logger = logging.getLogger(__name__)


@dataclass
class CandidateConfiguration:
    """An individual candidate configuration evaluated in grid search."""
    id: str
    marketing_budget: float
    working_inventory: float
    unit_price: float
    revenue: float = 0.0
    gross_profit: float = 0.0
    gross_margin_percent: float = 0.0
    operating_income: float = 0.0
    operating_margin_percent: float = 0.0
    realized_orders: float = 0.0
    ending_inventory: float = 0.0
    total_capital: float = 0.0
    annual_churn_percent: float = 3.2
    feasible: bool = True
    violation_reasons: list[str] = field(default_factory=list)
    binding_constraints: list[str] = field(default_factory=list)
    objective_score: float = 0.0
    rank: int = 0


@dataclass
class ConstraintCheckResult:
    """Result of validating an operational constraint against a candidate."""
    id: str
    name: str
    rule: str
    operator: str  # "lte" | "gte"
    threshold_value: float
    projected_value: float
    status: str  # "satisfied" | "violated" | "binding"
    slack_value: float
    slack_percent: float
    display_threshold: str
    display_projected: str
    display_slack: str


class DeterministicGridSearchOptimizer:
    """
    Exhaustive discrete grid search solver evaluating candidate decisions
    over microeconomic commercial models and strict hard constraints.
    """

    def __init__(
        self,
        base_revenue: float = 44.8,
        base_orders: float = 448000.0,
        base_price: float = 100.0,
        base_unit_cost: float = 62.0,
        base_mktg: float = 1.40,
        base_inv: float = 1000.0,
        base_opex: float = 0.0,
        base_churn: float = 3.2,
        currency: str = "INR",
        real_price_baseline: float = 0.0,
        opex_source: str = "UNAVAILABLE",
    ):
        self.base_revenue = base_revenue
        self.base_orders = base_orders
        self.base_price = base_price
        self.real_price_baseline = real_price_baseline   # DATA_DERIVED (₹/unit); 0 = unavailable
        self.base_unit_cost = base_unit_cost
        self.base_mktg = base_mktg
        self.base_inv = base_inv
        self.base_opex = base_opex         # 0.0 when OPEX data is absent (see opex_source)
        self.opex_source = opex_source     # "DATASET" | "MODEL_ASSUMPTION" | "UNAVAILABLE"
        self.base_churn = base_churn
        self.currency = currency
        self.base_gross_profit = round(max(0.0, base_revenue * (1.0 - (base_unit_cost / base_price if base_price > 0 else 0.62))), 4)
        self.base_gross_margin = round((self.base_gross_profit / base_revenue * 100.0), 2) if base_revenue > 0 else 38.0
        self.elasticity = -0.85
        # MODEL_ASSUMPTION: scale_factor is a fixed structural constant that defines the
        # relationship between the optimizer's internal "order-count space" and Crore
        # revenue space.  Identity: rev(base_orders, base_price) = base_revenue requires
        # scale_factor = base_orders / base_revenue = 10,000 (at model defaults).
        # It must NOT be re-derived from a real dataset's raw transaction count because
        # raw order count / Cr revenue yields a wildly different magnitude that makes every
        # revenue value near-zero and triggers the floor.
        self.scale_factor = 10_000.0  # MODEL_ASSUMPTION — structural constant, never calibrated from data
        # turnover_ratio stays data-derived so that working-inventory grid steps produce
        # meaningfully differentiated capacity (and thus differentiated revenue/profit).
        self.turnover_ratio = base_orders / base_inv if base_inv > 0 else 448.0

    @classmethod
    def from_dataframe(
        cls,
        df: Optional[pd.DataFrame] = None,
        currency: str = "INR",
        data_quality_score: float = 100.0,
    ) -> "DeterministicGridSearchOptimizer":
        """
        Calibrates the optimizer's empirical microeconomic baseline using the tenant's DataFrame.
        """
        base_revenue = 44.8
        base_orders = 448000.0
        base_price = 100.0        # MODEL-SCALE anchor — never the real monetary price
        base_unit_cost = 62.0
        base_mktg = 1.40
        base_inv = 1000.0
        base_opex = 0.0           # Default: UNAVAILABLE; 10 % assumption removed
        base_churn = 3.2
        real_price_baseline = 0.0 # 0 = not yet derived from dataset
        opex_source = "UNAVAILABLE"

        if df is not None and not df.empty and "revenue" in df.columns:
            m_engine = MetricEngine(df, currency=currency, data_quality_score=data_quality_score)
            rev_m = m_engine.calculate_revenue()
            if rev_m.available and rev_m.value and rev_m.value > 0:
                # ── Revenue ──────────────────────────────────────────────────
                # MetricEngine.calculate_revenue() always returns raw rupees.
                # 1 Crore = 10,000,000 rupees.
                scale = 10_000_000.0
                base_revenue = rev_m.value / scale   # DATA_DERIVED (Crore)

                # ── Demand baseline (base_orders) ────────────────────────────
                # base_orders must satisfy the model identity:
                #   rev(base_orders, base_price) = base_revenue
                #   → base_orders / scale_factor = base_revenue
                #   → base_orders = base_revenue × scale_factor  (scale_factor = 10,000)
                #
                # Using raw order_id.nunique() (e.g. 120 real transactions) is WRONG
                # because it breaks scale_factor coherence and collapses revenue to ≈ ₹0.
                # MODEL_DERIVED from DATA_DERIVED base_revenue + MODEL_ASSUMPTION scale_factor.
                base_orders = base_revenue * 10_000.0  # MODEL_DERIVED

                # ── base_price is intentionally kept at the model default (100.0) ──
                # The optimizer grid evaluates prices in the range 95–120 (model-scale).
                # Elasticity is computed as (grid_price - base_price) / base_price, so
                # base_price must match the grid's scale.  The margin-ratio calibration
                # below correctly derives base_unit_cost from the dataset's real gross
                # margin without needing the real dataset price.

                # ── Gross margin → unit cost ─────────────────────────────────
                gp_m = m_engine.calculate_gross_profit()
                if gp_m.available and gp_m.value is not None:
                    base_gp = gp_m.value / scale          # DATA_DERIVED (Crore)
                    base_margin_ratio = (base_gp / base_revenue) if base_revenue > 0 else 0.38
                    base_unit_cost = base_price * (1.0 - base_margin_ratio)  # DATA_DERIVED

                # ── Real price baseline (DATA_DERIVED) ───────────────────────
                # Derived as weighted-average price: total_revenue / total_units.
                # This is the real monetary price of the product, used ONLY for
                # displaying human-readable price values to users.  It does NOT
                # replace base_price = 100 inside the elasticity/revenue formulas —
                # the model continues to use the normalised 100-scale grid internally.
                if "quantity" in df.columns and df["quantity"].dropna().sum() > 0:
                    total_units = float(df["quantity"].dropna().sum())
                    total_rev_raw = rev_m.value  # raw rupees
                    real_price_baseline = round(total_rev_raw / total_units, 2)  # DATA_DERIVED ₹/unit
                elif "unit_price" in df.columns and df["unit_price"].dropna().count() > 0:
                    # Fallback: mean of per-row unit_price column if no quantity column
                    real_price_baseline = round(float(df["unit_price"].dropna().mean()), 2)  # DATA_DERIVED ₹/unit
                # else: real_price_baseline stays 0.0 (UNAVAILABLE)

                # ── Marketing spend ──────────────────────────────────────────
                # DATA_DERIVED when marketing_spend column is present in the dataset.
                mktg_m = m_engine.calculate_marketing_spend()
                if mktg_m.available and mktg_m.value and mktg_m.value > 0:
                    base_mktg = mktg_m.value / scale      # DATA_DERIVED (Crore)

                # ── Working inventory (latest snapshot) ──────────────────────
                # Use the most-recent row value, not a cumulative sum — inventory
                # is a snapshot metric (same fix applied in digital_twin_builder).
                # DATA_DERIVED from df directly to avoid calculate_inventory_value()
                # which still uses .sum() internally.
                if "inventory" in df.columns:
                    inv_clean = df["inventory"].dropna()
                    if len(inv_clean) > 0:
                        base_inv = float(inv_clean.iloc[-1])   # DATA_DERIVED (units)

                # ── Operating expense ─────────────────────────────────────────
                # Only use ACTUAL dataset OPEX.  The previous 10 % model assumption
                # has been removed because it silently presented an invented number
                # as if it were the company's real operating cost.
                # When OPEX data is absent, base_opex stays 0.0 and opex_source
                # is set to "UNAVAILABLE" so callers can mark operating_margin
                # as model-assumed rather than data-derived.
                if "operating_expense" in df.columns and df["operating_expense"].dropna().count() > 0:
                    base_opex = float(df["operating_expense"].dropna().sum()) / scale  # DATA_DERIVED (Crore)
                    opex_source = "DATASET"
                else:
                    base_opex = 0.0       # No OPEX data available — do NOT estimate
                    opex_source = "UNAVAILABLE"

        return cls(
            base_revenue=base_revenue,
            base_orders=base_orders,
            base_price=base_price,
            base_unit_cost=base_unit_cost,
            base_mktg=base_mktg,
            base_inv=base_inv,
            base_opex=base_opex,
            base_churn=base_churn,
            currency=currency,
            real_price_baseline=real_price_baseline,
            opex_source=opex_source,
        )

    def evaluate_candidate(self, mktg: float, inv: float, price: float, idx: int) -> CandidateConfiguration:
        """Evaluates commercial projections for a single candidate."""
        # 1. Price Elasticity
        rel_price_change = (price - self.base_price) / self.base_price if self.base_price > 0 else 0.0
        price_multiplier = max(0.2, 1.0 + (self.elasticity * rel_price_change))

        # 2. Marketing Saturation Curve (0.65 power)
        mktg_ratio = max(0.05, mktg / self.base_mktg) if self.base_mktg > 0 else 1.0
        mktg_multiplier = math.pow(mktg_ratio, 0.65)

        # 3. Demand vs Inventory Fulfillment
        gross_demand = self.base_orders * price_multiplier * mktg_multiplier
        capacity = inv * self.turnover_ratio
        realized_orders = min(gross_demand, capacity)
        remaining_inv = max(0.0, inv - (realized_orders / self.turnover_ratio))

        # 4. Financial Calculations
        # No revenue floor — compute honestly.  max(0.1, ...) was removed because it
        # applied a floor to revenue without applying the same floor to cogs, fabricating
        # near-100 % gross margin when actual revenue was near-zero due to scale_factor
        # miscalibration.  After the scale_factor fix, revenue is a real non-zero value.
        # max(0.0, ...) retains the zero-guard without injecting phantom profit.
        rev = round(max(0.0, (realized_orders * price) / (self.scale_factor * self.base_price)), 2)
        cogs = round((realized_orders * self.base_unit_cost) / (self.scale_factor * self.base_price), 2)
        gp = round(max(0.0, rev - cogs), 2)
        gm_pct = round((gp / rev * 100.0), 1) if rev > 0 else 0.0

        op_income = round(gp - mktg - self.base_opex, 2)
        op_margin_pct = round((op_income / rev * 100.0), 1) if rev > 0 else 0.0

        # total_capital: marketing budget is in Crore; inventory cost is
        # base_unit_cost (₹/unit) × units → rupees → divide by 10,000,000 to get Cr.
        # The old divisor of 10,000 produced values ~1000× too large when
        # base_unit_cost is expressed in real rupees per unit.
        total_capital = round(mktg + (inv * self.base_unit_cost / 10_000_000.0), 2)

        # 5. Projected Annual Churn (increases slightly if price rises sharply)
        projected_churn = round(max(1.0, self.base_churn * (1.0 + max(0.0, rel_price_change * 0.6))), 2)

        return CandidateConfiguration(
            id=f"cfg-opt-{idx}",
            marketing_budget=round(mktg, 2),
            working_inventory=round(inv, 1),
            unit_price=round(price, 1),
            revenue=rev,
            gross_profit=gp,
            gross_margin_percent=gm_pct,
            operating_income=op_income,
            operating_margin_percent=op_margin_pct,
            realized_orders=round(realized_orders, 1),
            ending_inventory=round(remaining_inv, 1),
            total_capital=total_capital,
            annual_churn_percent=projected_churn,
        )

    def check_constraints(
        self,
        candidate: CandidateConfiguration,
        hard_constraints: dict[str, Any],
    ) -> list[ConstraintCheckResult]:
        """Validates all hard constraints against a candidate configuration."""
        results: list[ConstraintCheckResult] = []
        is_feasible = True

        # 1. Marketing Budget Cap (lte)
        max_mktg = hard_constraints.get("maxMarketingBudget") or hard_constraints.get("budgetLte") or hard_constraints.get("maxBudget")
        if max_mktg is not None:
            max_mktg = float(max_mktg)
            slack = max_mktg - candidate.marketing_budget
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(f"Marketing Budget ₹{candidate.marketing_budget:.2f} Cr exceeds limit ₹{max_mktg:.2f} Cr")
            elif 0 <= slack <= (max_mktg * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Marketing Budget Cap")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_max_budget",
                name="Marketing Budget Ceiling",
                rule=f"Budget ≤ ₹{max_mktg:.2f} Cr",
                operator="lte",
                threshold_value=max_mktg,
                projected_value=candidate.marketing_budget,
                status=status,
                slack_value=round(abs(slack), 2),
                slack_percent=round(max(0.0, min(100.0, (slack / max_mktg) * 100.0)), 1),
                display_threshold=f"₹{max_mktg:.2f} Cr",
                display_projected=f"₹{candidate.marketing_budget:.2f} Cr",
                display_slack=f"₹{abs(slack):.2f} Cr ({status})",
            ))

        # 2. Minimum Gross Margin Hurdle (gte)
        min_margin = hard_constraints.get("minMarginPercent") or hard_constraints.get("marginGte") or hard_constraints.get("minMargin")
        if min_margin is not None:
            min_margin = float(min_margin)
            slack = candidate.gross_margin_percent - min_margin
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(f"Gross Margin {candidate.gross_margin_percent:.1f}% below minimum {min_margin:.1f}%")
            elif 0 <= slack <= (min_margin * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Minimum Margin Hurdle")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_min_margin",
                name="Gross Margin Floor",
                rule=f"Margin ≥ {min_margin:.1f}%",
                operator="gte",
                threshold_value=min_margin,
                projected_value=candidate.gross_margin_percent,
                status=status,
                slack_value=round(abs(slack), 1),
                slack_percent=round(max(0.0, min(100.0, (slack / min_margin) * 100.0)), 1),
                display_threshold=f"{min_margin:.1f}%",
                display_projected=f"{candidate.gross_margin_percent:.1f}%",
                display_slack=f"{abs(slack):.1f}% pts ({status})",
            ))

        # 3. Working Inventory Floor (gte)
        min_inv = hard_constraints.get("minInventory") or hard_constraints.get("inventoryGte")
        if min_inv is not None:
            min_inv = float(min_inv)
            slack = candidate.working_inventory - min_inv
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(f"Inventory {candidate.working_inventory:.0f} units below safety floor {min_inv:.0f}")
            elif 0 <= slack <= (min_inv * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Inventory Floor")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_min_inventory",
                name="Working Inventory Safety Floor",
                rule=f"Inventory ≥ {min_inv:.0f} units",
                operator="gte",
                threshold_value=min_inv,
                projected_value=candidate.working_inventory,
                status=status,
                slack_value=round(abs(slack), 1),
                slack_percent=round(max(0.0, min(100.0, (slack / min_inv) * 100.0)), 1),
                display_threshold=f"{min_inv:.0f} units",
                display_projected=f"{candidate.working_inventory:.0f} units",
                display_slack=f"{abs(slack):.0f} units ({status})",
            ))

        # 4. Working Inventory Ceiling (lte)
        max_inv = hard_constraints.get("maxInventory") or hard_constraints.get("inventoryLte")
        if max_inv is not None:
            max_inv = float(max_inv)
            slack = max_inv - candidate.working_inventory
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(f"Inventory {candidate.working_inventory:.0f} exceeds max capacity {max_inv:.0f}")
            elif 0 <= slack <= (max_inv * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Inventory Ceiling")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_max_inventory",
                name="Inventory Storage Ceiling",
                rule=f"Inventory ≤ {max_inv:.0f} units",
                operator="lte",
                threshold_value=max_inv,
                projected_value=candidate.working_inventory,
                status=status,
                slack_value=round(abs(slack), 1),
                slack_percent=round(max(0.0, min(100.0, (slack / max_inv) * 100.0)), 1),
                display_threshold=f"{max_inv:.0f} units",
                display_projected=f"{candidate.working_inventory:.0f} units",
                display_slack=f"{abs(slack):.0f} units ({status})",
            ))

        # 5. Working Capital Ceiling (lte)
        max_cap = hard_constraints.get("maxWorkingCapital") or hard_constraints.get("workingCapitalLte")
        if max_cap is not None:
            max_cap = float(max_cap)
            slack = max_cap - candidate.total_capital
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(f"Allocated Capital ₹{candidate.total_capital:.2f} Cr exceeds ceiling ₹{max_cap:.2f} Cr")
            elif 0 <= slack <= (max_cap * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Working Capital Ceiling")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_max_capital",
                name="Working Capital Cap",
                rule=f"Capital ≤ ₹{max_cap:.2f} Cr",
                operator="lte",
                threshold_value=max_cap,
                projected_value=candidate.total_capital,
                status=status,
                slack_value=round(abs(slack), 2),
                slack_percent=round(max(0.0, min(100.0, (slack / max_cap) * 100.0)), 1),
                display_threshold=f"₹{max_cap:.2f} Cr",
                display_projected=f"₹{candidate.total_capital:.2f} Cr",
                display_slack=f"₹{abs(slack):.2f} Cr ({status})",
            ))

        # 6. Annual Churn Ceiling (lte)
        max_churn = (
            hard_constraints.get("maxAnnualChurn")
            or hard_constraints.get("annualChurnLte")
            or hard_constraints.get("maxChurn")
            or hard_constraints.get("churnLte")
            or hard_constraints.get("annualChurn")
        )
        if max_churn is not None:
            max_churn = float(max_churn)
            slack = max_churn - candidate.annual_churn_percent
            if slack < -0.001:
                status = "violated"
                is_feasible = False
                candidate.violation_reasons.append(
                    f"Annual Churn {candidate.annual_churn_percent:.2f}% exceeds ceiling {max_churn:.2f}%"
                )
            elif 0 <= slack <= (max_churn * 0.05):
                status = "binding"
                candidate.binding_constraints.append("Annual Churn Ceiling")
            else:
                status = "satisfied"

            results.append(ConstraintCheckResult(
                id="const_max_churn",
                name="Annual Churn Ceiling",
                rule=f"Annual Churn ≤ {max_churn:.1f}%",
                operator="lte",
                threshold_value=max_churn,
                projected_value=candidate.annual_churn_percent,
                status=status,
                slack_value=round(abs(slack), 2),
                slack_percent=round(max(0.0, min(100.0, (slack / max_churn) * 100.0)), 1) if max_churn > 0 else 0.0,
                display_threshold=f"{max_churn:.1f}%",
                display_projected=f"{candidate.annual_churn_percent:.2f}%",
                display_slack=f"{abs(slack):.2f}% pts ({status})",
            ))

        candidate.feasible = is_feasible
        return results

    @staticmethod
    def minmax_normalize(values: list[float]) -> list[float]:
        """
        Min-max normalize values onto [0, 100].
        If the range is zero (all values equal), every point maps to 0.0.
        """
        if not values:
            return []
        lo = min(values)
        hi = max(values)
        span = hi - lo
        if span <= 1e-12:
            return [0.0 for _ in values]
        return [round((v - lo) / span * 100.0, 4) for v in values]

    @staticmethod
    def non_dominated_mask(gross_profits: list[float], operating_margins: list[float]) -> list[bool]:
        """
        Discrete Pareto mask for two maximization objectives:
        gross profit and operating margin.
        Candidate i is dominated if some j is >= on both metrics and strictly
        greater on at least one.
        """
        n = len(gross_profits)
        mask = [True] * n
        for i in range(n):
            gi = gross_profits[i]
            oi = operating_margins[i]
            for j in range(n):
                if i == j:
                    continue
                gj = gross_profits[j]
                oj = operating_margins[j]
                if (gj >= gi and oj >= oi) and (gj > gi or oj > oi):
                    mask[i] = False
                    break
        return mask

    def _scatter_and_pareto(
        self,
        all_candidates: list[CandidateConfiguration],
        feasible_candidates: list[CandidateConfiguration],
        recommended_id: Optional[str],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """
        Scatter: every evaluated candidate, x = operating margin, y = gross profit,
        min-max normalized across the full evaluated set.
        Pareto: every feasible candidate, typed by discrete non-domination on
        those same two metrics (full feasible set, not a truncated ranking).
        """
        if not all_candidates:
            return [], []

        xs_raw = [c.operating_margin_percent for c in all_candidates]
        ys_raw = [c.gross_profit for c in all_candidates]
        xs = self.minmax_normalize(xs_raw)
        ys = self.minmax_normalize(ys_raw)
        coord_by_id = {
            c.id: {"x": xs[i], "y": ys[i]}
            for i, c in enumerate(all_candidates)
        }

        scatter: list[dict[str, Any]] = []
        for c in all_candidates:
            is_current = (
                abs(c.marketing_budget - self.base_mktg) <= 1e-6
                and abs(c.working_inventory - self.base_inv) <= 0.05
                and abs(c.unit_price - self.base_price) <= 1e-6
            )
            scatter.append({
                "id": c.id,
                "x": coord_by_id[c.id]["x"],
                "y": coord_by_id[c.id]["y"],
                "feasible": c.feasible,
                "isRecommended": c.id == recommended_id,
                "isCurrent": is_current,
                "label": (
                    "Recommended" if c.id == recommended_id
                    else ("Current" if is_current else c.id)
                ),
                "grossProfit": c.gross_profit,
                "operatingMargin": c.operating_margin_percent,
            })

        pareto: list[dict[str, Any]] = []
        if feasible_candidates:
            gps = [c.gross_profit for c in feasible_candidates]
            oms = [c.operating_margin_percent for c in feasible_candidates]
            nd_mask = self.non_dominated_mask(gps, oms)
            for c, is_nd in zip(feasible_candidates, nd_mask):
                is_rec = c.id == recommended_id
                if is_rec:
                    point_type = "recommended"
                elif is_nd:
                    point_type = "pareto_efficient"
                else:
                    point_type = "dominated"
                pareto.append({
                    "id": c.id,
                    "x": coord_by_id[c.id]["x"],
                    "y": coord_by_id[c.id]["y"],
                    "label": "Recommended" if is_rec else c.id,
                    "type": point_type,
                    "onFrontier": is_nd,
                    "grossProfit": c.gross_profit,
                    "operatingMargin": c.operating_margin_percent,
                })

        return scatter, pareto

    def solve(
        self,
        objective: str = "maximize_gross_profit",
        hard_constraints: Optional[dict[str, Any]] = None,
        allowed_ranges: Optional[dict[str, Any] | list[Any]] = None,
        decision_variables: Optional[list[Any]] = None,
    ) -> dict[str, Any]:
        """
        Executes deterministic discrete grid search solver.
        Returns the optimal feasible configuration or flags problem as infeasible.
        """
        start_time = time.perf_counter()
        constraints_dict = hard_constraints or {
            "maxMarketingBudget": 2.0,
            "minInventory": 500,
            "maxInventory": 1500,
            "minMarginPercent": 30.0,
        }

        # 1. Normalize Discrete Grid Ranges
        ranges: dict[str, Any] = {}
        source_ranges = allowed_ranges or decision_variables
        if isinstance(source_ranges, list):
            for item in source_ranges:
                if isinstance(item, dict):
                    k = item.get("key") or item.get("id") or item.get("name")
                    if k:
                        ranges[k] = item
        elif isinstance(source_ranges, dict):
            ranges = source_ranges

        mktg_cfg = ranges.get("marketingBudget") or ranges.get("marketing_budget") or {}
        inv_cfg = ranges.get("workingInventory") or ranges.get("working_inventory") or {}
        price_cfg = ranges.get("unitPrice") or ranges.get("unit_price") or {}

        mktg_min = float(mktg_cfg.get("min", 1.0))
        mktg_max = float(mktg_cfg.get("max", 2.5))
        mktg_step = float(mktg_cfg.get("step", 0.15))

        inv_min = float(inv_cfg.get("min", 600.0))
        inv_max = float(inv_cfg.get("max", 1500.0))
        inv_step = float(inv_cfg.get("step", 100.0))

        price_min = float(price_cfg.get("min", 95.0))
        price_max = float(price_cfg.get("max", 120.0))
        price_step = float(price_cfg.get("step", 2.5))

        # Discretize ranges
        def float_range(start, stop, step):
            curr = start
            if step <= 0:
                yield round(curr, 4)
                return
            while curr <= stop + 1e-9:
                yield round(curr, 4)
                curr += step

        mktg_vals = list(float_range(mktg_min, mktg_max, mktg_step))
        inv_vals = list(float_range(inv_min, inv_max, inv_step))
        price_vals = list(float_range(price_min, price_max, price_step))

        total_evaluated = 0
        candidates: list[CandidateConfiguration] = []
        feasible_candidates: list[CandidateConfiguration] = []
        constraint_results_map: dict[str, list[ConstraintCheckResult]] = {}

        idx = 1
        # Exhaustive deterministic grid search
        for m in mktg_vals:
            for i in inv_vals:
                for p in price_vals:
                    total_evaluated += 1
                    cand = self.evaluate_candidate(m, i, p, idx)
                    c_results = self.check_constraints(cand, constraints_dict)
                    constraint_results_map[cand.id] = c_results

                    # Assign objective score
                    obj_norm = objective.lower().replace(" ", "_")
                    if "gross_profit" in obj_norm or "profit" in obj_norm:
                        cand.objective_score = cand.gross_profit
                    elif "revenue" in obj_norm:
                        cand.objective_score = cand.revenue
                    elif "operating_margin" in obj_norm or "margin" in obj_norm:
                        cand.objective_score = cand.operating_margin_percent
                    elif "inventory" in obj_norm:
                        # Minimize inventory -> higher score for lower inventory
                        cand.objective_score = -cand.working_inventory
                    else:
                        cand.objective_score = cand.gross_profit

                    candidates.append(cand)
                    if cand.feasible:
                        feasible_candidates.append(cand)
                    idx += 1

        solver_duration_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

        # ─────────────────────────────────────────────────────────────────────
        # Infeasible Check: If NO candidates meet all constraints
        # ─────────────────────────────────────────────────────────────────────
        if not feasible_candidates:
            logger.warning("Optimizer converged to INFEASIBLE solution space (0 feasible configurations).")
            sample_constraints = []
            scatter: list[dict[str, Any]] = []
            pareto: list[dict[str, Any]] = []
            if candidates:
                sample_cand = candidates[0]
                sample_constraints = [
                    {
                        "id": cr.id,
                        "name": cr.name,
                        "rule": cr.rule,
                        "status": cr.status,
                        "operator": cr.operator,
                        "thresholdValue": cr.threshold_value,
                        "thresholdDisplay": cr.display_threshold,
                        "projectedValue": cr.projected_value,
                        "projectedDisplay": cr.display_projected,
                    }
                    for cr in constraint_results_map.get(sample_cand.id, [])
                ]
                scatter, pareto = self._scatter_and_pareto(candidates, [], None)

            return {
                "status": "infeasible",
                "objective": objective,
                "message": "No configuration in the allowed search space satisfies all hard constraints simultaneously.",
                "totalConfigurationsEvaluated": total_evaluated,
                "feasibleConfigurations": 0,
                "infeasibleConfigurations": total_evaluated,
                "recommendedConfiguration": None,
                "recommendation": None,
                "projectedOutcomes": None,
                "constraintStatus": sample_constraints,
                "slack": [],
                "feasibleCandidates": [],
                "feasibleSolutions": scatter,
                "paretoFrontier": pareto,
                "solverDurationMs": solver_duration_ms,
                "results": [],
                "sensitivity": [],
                "tradeoffs": [],
                "summary": {
                    "totalConfigurationsEvaluated": total_evaluated,
                    "feasibleConfigurations": 0,
                    "infeasibleConfigurations": total_evaluated,
                    "optimalConfigId": None,
                    "bindingConstraint": "Infeasible Constraint Set",
                    "solverDurationMs": solver_duration_ms,
                    "algorithm": "Deterministic Discrete Grid Search Solver",
                },
                "disclaimer": (
                    "Deterministic discrete grid search completed. All evaluated configurations violated one or more hard constraints. "
                    "Relax the most binding constraints to achieve feasibility."
                ),
            }

        # ─────────────────────────────────────────────────────────────────────
        # Rank Feasible Candidates
        # ─────────────────────────────────────────────────────────────────────
        feasible_candidates.sort(key=lambda c: c.objective_score, reverse=True)
        for rank_num, c in enumerate(feasible_candidates, start=1):
            c.rank = rank_num

        best = feasible_candidates[0]
        best_constraints = constraint_results_map[best.id]

        # Improvement vs baseline
        base_gp = round(self.base_revenue * (1.0 - (self.base_unit_cost / self.base_price)), 2)
        profit_diff = best.gross_profit - base_gp
        profit_pct = (profit_diff / base_gp * 100.0) if base_gp > 0 else 0.0
        improvement_str = f"{'+' if profit_diff >= 0 else ''}{profit_pct:.1f}% profit vs. baseline"

        # Format Recommendation
        # ── Price conversion ──────────────────────────────────────────────────
        # The grid point (e.g. 105) is a model-scale value meaning +5% vs baseline.
        # real_price_baseline holds the DATA_DERIVED monetary price (e.g. ₹2,613).
        # displayed_price = real_price_baseline × (grid_point / base_price)
        # When real_price_baseline is unavailable (0.0), fall back to grid value
        # with a MODEL_ASSUMPTION label.
        def _display_price(grid_pt: float) -> str:
            if self.real_price_baseline > 0:
                real_p = self.real_price_baseline * (grid_pt / self.base_price)
                return format_currency_value(real_p, self.currency)
            return f"₹{int(grid_pt) if float(grid_pt).is_integer() else grid_pt:.1f} (model-scale)"

        def _display_price_pct_change(grid_pt: float) -> str:
            pct = (grid_pt / self.base_price - 1.0) * 100.0
            sign = "+" if pct >= 0 else ""
            return f"{sign}{pct:.1f}% vs baseline"

        opex_disclosure = (
            "Operating Margin uses DATASET operating expense."
            if self.opex_source == "DATASET"
            else "Operating Margin not calculated — operating_expense column absent from dataset. "
                 "Set base_opex=0 is used here; operating margin should be treated as model-assumed."
        )

        recommended_config = {
            "marketingBudget": f"₹{best.marketing_budget:.2f} Cr",
            "marketingBudgetNum": int(best.marketing_budget * 10_000_000),
            "workingInventory": f"{int(best.working_inventory):,} units",
            "workingInventoryNum": int(best.working_inventory),
            # Real monetary price displayed to user
            "unitPrice": _display_price(best.unit_price),
            # Grid-scale value preserved for internal round-trip
            "unitPriceGridValue": best.unit_price,
            "unitPriceNum": (
                round(self.real_price_baseline * (best.unit_price / self.base_price), 2)
                if self.real_price_baseline > 0 else best.unit_price
            ),
            "unitPricePctChange": _display_price_pct_change(best.unit_price),
            "unitPriceSource": "DATA_DERIVED" if self.real_price_baseline > 0 else "MODEL_ASSUMPTION",
            "realPriceBaseline": self.real_price_baseline,
            "projectedGrossProfit": format_currency_value(best.gross_profit * 10_000_000.0, self.currency),
            "projectedRevenue": format_currency_value(best.revenue * 10_000_000.0, self.currency),
            "projectedMargin": f"{best.gross_margin_percent:.1f}%",
            "projectedMarginNum": best.gross_margin_percent,
            "projectedOperatingMargin": f"{best.operating_margin_percent:.1f}%",
            "projectedOrders": best.realized_orders,
            "projectedInventory": best.ending_inventory,
            "improvementVsCurrent": improvement_str,
            "opexSource": self.opex_source,
            "opexDisclosure": opex_disclosure,
        }

        projected_outcomes = {
            "revenue": best.revenue,
            "grossProfit": best.gross_profit,
            "operatingMargin": best.operating_margin_percent,
            "operatingMarginSource": self.opex_source,   # "DATASET" | "UNAVAILABLE"
            "orders": best.realized_orders,
            "inventory": best.ending_inventory,
            "grossMargin": best.gross_margin_percent,
            "annualChurn": best.annual_churn_percent,
            "realPriceBaseline": self.real_price_baseline,
            "opexSource": self.opex_source,
        }

        # Constraint Status & Slack
        constraint_status_list = []
        slack_list = []
        for cr in best_constraints:
            constraint_status_list.append({
                "id": cr.id,
                "name": cr.name,
                "rule": cr.rule,
                "status": cr.status,
                "operator": cr.operator,
                "thresholdValue": cr.threshold_value,
                "thresholdDisplay": cr.display_threshold,
                "projectedValue": cr.projected_value,
                "projectedDisplay": cr.display_projected,
            })
            slack_list.append({
                "constraintId": cr.id,
                "name": cr.name,
                "slackValue": cr.slack_value,
                "slackDisplay": cr.display_slack,
                "slackPercent": cr.slack_percent,
                "isBinding": cr.status == "binding",
            })

        # Top 10 Feasible Result Rows
        result_rows = []
        for c in feasible_candidates[:10]:
            result_rows.append({
                "id": c.id,
                "label": f"Config {c.rank} ({'Optimal' if c.rank == 1 else 'Feasible'})",
                "grossProfit": f"₹{c.gross_profit:.1f} Cr",
                "grossProfitNum": c.gross_profit,
                "revenue": f"₹{c.revenue:.1f} Cr",
                "revenueNum": c.revenue,
                "margin": f"{c.gross_margin_percent:.1f}%",
                "marginNum": c.gross_margin_percent,
                "budget": f"₹{c.marketing_budget:.2f} Cr",
                "budgetNum": c.marketing_budget,
                "status": "recommended" if c.rank == 1 else "feasible",
                "rank": c.rank,
            })

        # All feasible candidates (full set — required for discrete Pareto)
        feasible_summary = [
            {
                "id": c.id,
                "rank": c.rank,
                "marketingBudget": c.marketing_budget,
                "workingInventory": c.working_inventory,
                "unitPrice": c.unit_price,
                "revenue": c.revenue,
                "grossProfit": c.gross_profit,
                "operatingMargin": c.operating_margin_percent,
                "isRecommended": c.rank == 1,
            }
            for c in feasible_candidates
        ]

        scatter, pareto = self._scatter_and_pareto(candidates, feasible_candidates, best.id)

        # Sensitivity is not computed by this deterministic solver.
        sensitivity: list[dict[str, Any]] = []

        # Tradeoffs
        tradeoffs = [
            {
                "title": "Margin vs. Revenue Growth Trade-off",
                "metric1": {"label": "Gross Revenue", "value": f"₹{best.revenue:.1f} Cr", "direction": "positive"},
                "metric2": {"label": "Gross Margin", "value": f"{best.gross_margin_percent:.1f}%", "direction": "positive"},
                "insight": "Optimal configuration balances price lift with sufficient order volume to achieve peak profit.",
            },
            {
                "title": "Working Capital Efficiency Trade-off",
                "metric1": {"label": "Allocated Capital", "value": f"₹{best.total_capital:.2f} Cr", "direction": "positive"},
                "metric2": {"label": "Gross Profit", "value": f"₹{best.gross_profit:.1f} Cr", "direction": "positive"},
                "insight": f"Utilizes capital efficiently leaving buffer against working capital ceilings.",
            },
        ]

        binding_name = best.binding_constraints[0] if best.binding_constraints else "None (Interior Feasible Solution)"

        return {
            "status": "optimal",
            "objective": objective,
            "recommendedConfiguration": recommended_config,
            "projectedOutcomes": projected_outcomes,
            "constraintStatus": constraint_status_list,
            "slack": slack_list,
            "feasibleCandidates": feasible_summary,
            "feasibleSolutions": scatter,
            "paretoFrontier": pareto,
            "results": result_rows,
            "recommendation": recommended_config,
            "summary": {
                "totalConfigurationsEvaluated": total_evaluated,
                "feasibleConfigurations": len(feasible_candidates),
                "infeasibleConfigurations": total_evaluated - len(feasible_candidates),
                "optimalConfigId": best.id,
                "bindingConstraint": binding_name,
                "solverDurationMs": solver_duration_ms,
                "algorithm": "Deterministic Discrete Grid Search Solver",
            },
            "sensitivity": sensitivity,
            "tradeoffs": tradeoffs,
        }
