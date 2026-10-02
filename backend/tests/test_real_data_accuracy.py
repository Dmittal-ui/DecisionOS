"""
DecisionOS — Real-Data Accuracy Regression Tests

Regression tests for every confirmed bug fixed in the real-data accuracy audit:

BUG-1  Scenario total_allocated_capital used /10000 instead of /10_000_000.
       inv × base_unit_cost is in raw rupees; dividing by 10 000 000 converts
       to Crore so the result is compatible with mktg_budget (also in Crore).

BUG-2  Scenario revenue/GP displayed as "₹0.0 Cr" for small-revenue datasets
       because fmt_func used :.1f (1-decimal) precision.  Now uses
       format_currency_value() which picks the right scale (L, Cr, ₹).

PB-2   Digital Twin inventory used .sum() across all rows (snapshot inflation).
       Must use .iloc[-1] so the metric reflects the latest stock level.

BUG-3  Investigation Case 1 (CAC/revenue) had three evidence items with
       hardcoded statistics (8.2 %, 14.5 %, 3.1 %) presented as observed data.
       Now derived from opportunity signals or marked unavailable.

BUG-4  Investigation Case 2 (pricing_optimization) had ev_cogs_increase with
       hardcoded "+14.2 %" value presented as a dataset observation.
       Now marked unavailable with an explanatory note.

Each test is self-contained and uses in-memory DataFrames / mongomock so it
never touches the real MongoDB Atlas instance.
"""

import io
import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.digital_twin_builder import build_digital_twin_from_dataframe
from app.engine.investigation_builder import build_investigation_for_opportunity
from app.engine.scenario_engine import run_scenario_simulation
from app.engine.metric_engine import format_currency_value
from app.main import app
from app.models.opportunity import (
    OpportunityDocument,
    OpportunityImpactModel,
    OpportunitySignalModel,
)
from app.models.scenario import ScenarioVariablesModel


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _small_revenue_df() -> pd.DataFrame:
    """120-row snapshot dataset similar to UrbanCart (revenue in raw rupees)."""
    import numpy as np
    rng = np.random.default_rng(42)
    n = 120
    return pd.DataFrame({
        "order_id":        [f"UC-{i:05d}" for i in range(n)],
        "revenue":         rng.uniform(1_000, 5_000, n).round(2),
        "cost":            rng.uniform(500,  3_000, n).round(2),
        "marketing_spend": rng.uniform(200,  900,   n).round(2),
        "inventory":       rng.integers(400,  1_600, n).astype(float),
    })


def _make_cac_opportunity(with_conv_signal: bool = True) -> OpportunityDocument:
    """Minimal CAC-spike opportunity with real signal values."""
    signals = [
        OpportunitySignalModel(
            id="sig_cac_elevation",
            label="CAC Threshold Breach",
            metric="Customer Acquisition Cost",
            value="₹562",
            direction="negative",
            group="negative",
            observed_value=562.0,
            baseline_value=250.0,
            change_percent=124.8,
        ),
        OpportunitySignalModel(
            id="sig_spend_intensity",
            label="Marketing Spend Ratio Elevation",
            metric="Marketing / Revenue",
            value="28.3%",
            direction="negative",
            group="negative",
            observed_value=28.3,
            baseline_value=18.0,
            change_percent=10.3,
        ),
    ]
    if with_conv_signal:
        signals.append(
            OpportunitySignalModel(
                id="sig_conversion_drop",
                label="Funnel Conversion Rate Deficit",
                metric="Conversion Rate",
                value="1.42%",
                direction="negative",
                group="negative",
                observed_value=1.42,
                baseline_value=2.5,
                change_percent=-1.08,
            )
        )
    return OpportunityDocument(
        id="test-opp-cac",
        code="OPP-TESTCAC",
        organization_id="org-test",
        business_id="biz-test",
        title="Customer Acquisition Cost Spike — Paid Channel Efficiency",
        summary="CAC spiked above baseline.",
        category="revenue",
        priority="high",
        urgency="high",
        status="detected",
        confidence=88.0,
        impact=OpportunityImpactModel(
            projected_revenue=5000.0,
            cost_reduction=3000.0,
            net_value=4000.0,
            confidence_score=88.0,
            net_value_formatted="₹4,000",
        ),
        signals=signals,
    )


def _make_margin_opportunity() -> OpportunityDocument:
    """Minimal pricing_optimization opportunity."""
    return OpportunityDocument(
        id="test-opp-margin",
        code="OPP-TESTMARGIN",
        organization_id="org-test",
        business_id="biz-test",
        title="Gross Margin Compression & Price Elasticity Recovery",
        summary="Gross margin compressed.",
        category="pricing_optimization",
        priority="high",
        urgency="high",
        status="detected",
        confidence=85.0,
        impact=OpportunityImpactModel(
            projected_revenue=2000.0,
            cost_reduction=1000.0,
            net_value=1500.0,
            confidence_score=85.0,
            net_value_formatted="₹1,500",
        ),
        signals=[
            OpportunitySignalModel(
                id="sig_margin_compression",
                label="Gross Margin Compression",
                metric="Gross Margin",
                value="28.4%",
                direction="negative",
                group="negative",
                observed_value=28.4,
                baseline_value=40.0,
                change_percent=-11.6,
            )
        ],
    )


# ─────────────────────────────────────────────────────────────────────────────
# BUG-1  Scenario total_allocated_capital unit conversion
# ─────────────────────────────────────────────────────────────────────────────

class TestScenarioCapitalUnitConversion:
    """
    Verifies that total_allocated_capital is computed in Crore:
        capital_Cr = mktg_Cr + (inv_units × cost_per_unit) / 10_000_000
    and that the working-capital constraint is evaluated correctly.
    """

    def test_capital_stays_below_cap_for_small_dataset(self):
        """
        With UrbanCart-scale data (base_unit_cost ≈ ₹57/unit), 1 300 inventory
        units contribute 1300 × 57 / 10_000_000 ≈ 0.0074 Cr — negligible.
        The capital figure must be close to mktg_budget alone, not orders of
        magnitude larger.
        """
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=1.85,
            working_inventory=1300.0,
            unit_price=102.0,
        )
        result = run_scenario_simulation(levers, df=df, preset_id="preset_growth")

        # Find the working-capital constraint
        cap_constraint = next(
            c for c in result.constraints if c.id == "const_working_capital"
        )

        # Extract the numeric value from the displayed string "₹X.XX Cr"
        projected_str = cap_constraint.projectedValue          # e.g. "₹1.86 Cr"
        projected_val = float(projected_str.replace("₹", "").replace(" Cr", ""))

        # Old bug: inv_capital = 1300 × ~57 / 10000 ≈ 7.4 → total ≈ 9.3 Cr
        # Correct:  inv_capital = 1300 × ~57 / 10_000_000 ≈ 0.007 → total ≈ 1.86 Cr
        assert projected_val < 5.0, (
            f"total_allocated_capital {projected_val:.2f} Cr is impossibly large "
            f"for a UrbanCart-scale dataset — likely still using /10000 divisor."
        )
        # It must be close to mktg_budget (1.85 Cr) plus a tiny inventory term
        assert abs(projected_val - 1.85) < 0.5, (
            f"total_allocated_capital {projected_val:.2f} Cr deviates too far "
            f"from marketing budget 1.85 Cr; inventory Cr contribution should be < 0.1 Cr."
        )

    def test_capital_constraint_not_breached_for_normal_inputs(self):
        """
        With correct unit conversion the capital constraint must be satisfied
        for the baseline preset (mktg=1.40, inv=1000) against a small dataset.
        Old bug: /10000 made capital >> 3.5 Cr cap, always showing 'breached'.
        """
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=1.40,
            working_inventory=1000.0,
            unit_price=100.0,
        )
        result = run_scenario_simulation(levers, df=df, preset_id="preset_baseline")

        cap_constraint = next(
            c for c in result.constraints if c.id == "const_working_capital"
        )
        assert cap_constraint.status == "within_constraint", (
            f"Working capital constraint incorrectly breached for baseline preset: "
            f"projectedValue={cap_constraint.projectedValue}"
        )

    def test_capital_correctly_breached_for_extreme_spend(self):
        """
        Marketing budget of 4.0 Cr alone exceeds the 3.5 Cr cap; the
        constraint must be flagged as breached.
        """
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=4.0,
            working_inventory=1000.0,
            unit_price=100.0,
        )
        result = run_scenario_simulation(levers, df=df, preset_id="preset_growth")

        cap_constraint = next(
            c for c in result.constraints if c.id == "const_working_capital"
        )
        assert cap_constraint.status == "breached", (
            "Expected working-capital constraint breached at 4.0 Cr marketing budget."
        )


# ─────────────────────────────────────────────────────────────────────────────
# BUG-2  Scenario display precision — no more ₹0.0 Cr for small datasets
# ─────────────────────────────────────────────────────────────────────────────

class TestScenarioDisplayPrecision:
    """
    Verifies that revenue and gross profit are not displayed as '₹0.0 Cr'
    when the actual value is small but non-zero.
    """

    def test_revenue_display_not_zero(self):
        """
        For a UrbanCart-scale dataset projected revenue is ~0.04–0.06 Cr.
        The old :.1f formatter rounded that to '₹0.0 Cr'.
        The new formatter must produce a non-zero, readable string.
        """
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=1.85,
            working_inventory=1300.0,
            unit_price=102.0,
        )
        result = run_scenario_simulation(levers, df=df, preset_id="preset_growth")

        rev_metric = next(m for m in result.metrics if m.key == "gross_revenue")
        sim_value_str = rev_metric.simulatedValue

        # Must not be a trivial zero string
        assert sim_value_str not in ("₹0.0 Cr", "₹0.0", "₹0 Cr"), (
            f"Revenue displayed as zero: '{sim_value_str}'. "
            f"The format_currency_value formatter should choose ₹X L or ₹X for small values."
        )
        # Must contain a digit greater than 0 somewhere
        digits = [ch for ch in sim_value_str if ch.isdigit() and ch != "0"]
        assert digits, f"Revenue display '{sim_value_str}' contains no non-zero digits."

    def test_gross_profit_display_not_zero(self):
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=1.40,
            working_inventory=1000.0,
            unit_price=100.0,
        )
        result = run_scenario_simulation(levers, df=df, preset_id="preset_baseline")

        gp_metric = next(m for m in result.metrics if m.key == "gross_profit")
        assert gp_metric.simulatedValue not in ("₹0.0 Cr", "₹0.0", "₹0 Cr"), (
            f"Gross profit displayed as zero: '{gp_metric.simulatedValue}'."
        )

    def test_different_lever_values_produce_different_display(self):
        """
        Scenario A and Scenario B must display distinguishably different revenue
        values (not both rounded to the same ₹0.0 Cr string).
        """
        df = _small_revenue_df()
        levers_a = ScenarioVariablesModel(
            marketing_budget=1.85, working_inventory=1300.0, unit_price=102.0)
        levers_b = ScenarioVariablesModel(
            marketing_budget=2.00, working_inventory=1300.0, unit_price=105.0)

        result_a = run_scenario_simulation(levers_a, df=df, preset_id="preset_growth")
        result_b = run_scenario_simulation(levers_b, df=df, preset_id="preset_growth")

        rev_a = next(m for m in result_a.metrics if m.key == "gross_revenue")
        rev_b = next(m for m in result_b.metrics if m.key == "gross_revenue")

        # The simulated DISPLAY values must differ (simulatedNum may round to the
        # same 2dp Cr value when both are sub-0.05 Cr, but the display strings
        # use the full-precision lakh formatter which preserves the difference).
        assert rev_a.simulatedValue != rev_b.simulatedValue, (
            "Scenarios A and B with different lever values must produce different "
            "revenue display strings. Got identical: "
            f"A='{rev_a.simulatedValue}' B='{rev_b.simulatedValue}'"
        )

    def test_format_currency_value_round_trip(self):
        """
        format_currency_value(0.0489 Cr × 10_000_000) must not return '₹0.0 Cr'
        or empty.  It should return something like '₹4.89 L'.
        """
        val_rupees = 0.0489 * 10_000_000  # ≈ 489 000 rupees
        formatted = format_currency_value(val_rupees, "INR")
        assert formatted != "N/A"
        assert "0.0" not in formatted or "Cr" not in formatted, (
            f"format_currency_value({val_rupees:.0f}) returned '{formatted}' "
            f"which still looks like a zero Cr value."
        )


# ─────────────────────────────────────────────────────────────────────────────
# PB-2  Digital Twin inventory latest snapshot, not cumulative sum
# ─────────────────────────────────────────────────────────────────────────────

class TestDigitalTwinInventorySnapshot:
    """
    Verifies that the Digital Twin inventory metric reflects the LATEST
    inventory snapshot rather than the cumulative sum of all rows.
    """

    def test_inventory_uses_latest_row_not_sum(self):
        """
        A dataset with 5 rows, inventory levels [100, 200, 300, 400, 500].
        Sum = 1500; latest value = 500.
        The metric must equal 500.
        """
        df = pd.DataFrame({
            "order_id": [f"ORD-{i}" for i in range(5)],
            "revenue":  [1000.0] * 5,
            "cost":     [600.0]  * 5,
            "inventory": [100.0, 200.0, 300.0, 400.0, 500.0],
        })
        metrics, _, _, _ = build_digital_twin_from_dataframe(df, data_quality_score=100.0)

        assert metrics["inventory"].available is True
        assert metrics["inventory"].value == 500.0, (
            f"Expected inventory=500 (latest snapshot), got {metrics['inventory'].value}. "
            f"Sum of all rows would be 1500 — old bug."
        )

    def test_inventory_does_not_equal_sum(self):
        """
        Explicitly confirm the value is NOT the cumulative sum.
        """
        inventory_values = [80.0, 90.0, 110.0, 95.0, 105.0]
        df = pd.DataFrame({
            "order_id": [f"ORD-{i}" for i in range(5)],
            "revenue":  [500.0] * 5,
            "cost":     [300.0] * 5,
            "inventory": inventory_values,
        })
        metrics, _, _, _ = build_digital_twin_from_dataframe(df, data_quality_score=100.0)

        cumulative_sum = sum(inventory_values)   # 480
        latest_snapshot = inventory_values[-1]   # 105

        assert metrics["inventory"].value != cumulative_sum, (
            f"Inventory must not equal the cumulative sum ({cumulative_sum}). "
            f"Use latest snapshot ({latest_snapshot})."
        )
        assert metrics["inventory"].value == latest_snapshot, (
            f"Expected latest snapshot {latest_snapshot}, got {metrics['inventory'].value}."
        )

    def test_inventory_unavailable_when_column_missing(self):
        """Graceful unavailable state — no fabricated value."""
        df = pd.DataFrame({
            "order_id": ["ORD-1"],
            "revenue":  [1000.0],
            "cost":     [600.0],
        })
        metrics, _, _, _ = build_digital_twin_from_dataframe(df, data_quality_score=100.0)

        assert metrics["inventory"].available is False
        assert metrics["inventory"].value is None

    def test_single_row_inventory(self):
        """Edge case: one row — latest snapshot == that single value."""
        df = pd.DataFrame({
            "order_id": ["ORD-1"],
            "revenue":  [2000.0],
            "cost":     [1200.0],
            "inventory": [750.0],
        })
        metrics, _, _, _ = build_digital_twin_from_dataframe(df, data_quality_score=100.0)
        assert metrics["inventory"].value == 750.0


# ─────────────────────────────────────────────────────────────────────────────
# BUG-3  Investigation Case 1 — no more hardcoded percentages
# ─────────────────────────────────────────────────────────────────────────────

class TestInvestigationCase1NoHardcodedStats:
    """
    Verifies that investigation Case 1 (CAC/revenue) does NOT contain the old
    hardcoded statistics (-8.2 %, +14.5 %, 3.1 %) that were fabricated as if
    they came from the dataset.
    """

    FORBIDDEN_STRINGS = {"-8.2%", "+14.5%", "3.1%", "8.2%", "14.5%"}
    FORBIDDEN_SOURCES = {"Web Analytics Pipeline", "ERP Financial Ledger"}

    def _flatten_evidence_text(self, inv) -> list[str]:
        """Collect all evidence descriptions + values + sources."""
        texts: list[str] = []
        for ev in inv.evidence:
            texts.extend([ev.description, ev.value or "", ev.source or ""])
        return texts

    def test_hardcoded_percentages_absent(self):
        """Old percentages must not appear anywhere in the investigation text."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        all_text = " ".join(self._flatten_evidence_text(inv))
        for forbidden in self.FORBIDDEN_STRINGS:
            assert forbidden not in all_text, (
                f"Hardcoded statistic '{forbidden}' still present in investigation "
                f"evidence. This is a fabricated percentage, not from the dataset."
            )

    def test_hardcoded_sources_absent(self):
        """Fabricated source labels must not appear in evidence."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        all_text = " ".join(self._flatten_evidence_text(inv))
        for src in self.FORBIDDEN_SOURCES:
            assert src not in all_text, (
                f"Fabricated source label '{src}' still present in investigation."
            )

    def test_cac_value_is_data_derived(self):
        """The CAC evidence value must come from the opportunity signal, not a hardcode."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        cac_ev = next((e for e in inv.evidence if e.id == "ev_cac_spike"), None)
        assert cac_ev is not None, "ev_cac_spike evidence item must be present."
        # The opportunity signal value is "₹562" — it must appear in the evidence
        assert "562" in (cac_ev.value or ""), (
            f"CAC evidence value '{cac_ev.value}' does not reflect the real "
            f"signal value '₹562'. It must be data-derived."
        )

    def test_conversion_signal_used_when_present(self):
        """When a conversion signal exists it must feed into ev_conversion_drop."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        conv_ev = next((e for e in inv.evidence if e.id == "ev_conversion_drop"), None)
        assert conv_ev is not None
        # The real signal value was "1.42%"
        assert conv_ev.value != "N/A", (
            "ev_conversion_drop should use the real signal value when present."
        )
        assert "1.42" in (conv_ev.value or "") or "1.42" in (conv_ev.description or ""), (
            f"Expected signal value '1.42%' in conversion evidence, got '{conv_ev.value}'."
        )

    def test_missing_conversion_signal_gives_unavailable(self):
        """When no conversion signal exists, the evidence must be marked unavailable."""
        opp = _make_cac_opportunity(with_conv_signal=False)
        inv = build_investigation_for_opportunity(opp, df=None)

        conv_ev = next((e for e in inv.evidence if e.id == "ev_conversion_drop"), None)
        assert conv_ev is not None
        assert conv_ev.value == "N/A", (
            f"Without a conversion signal the value must be 'N/A', got '{conv_ev.value}'."
        )
        assert "required" in (conv_ev.description or "").lower() or \
               "unavailable" in (conv_ev.description or "").lower() or \
               "not available" in (conv_ev.description or "").lower(), (
            "Unavailable evidence description must explain why."
        )

    def test_spend_signal_used_when_present(self):
        """The spend ratio signal feeds ev_spend_increase."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        spend_ev = next((e for e in inv.evidence if e.id == "ev_spend_increase"), None)
        assert spend_ev is not None
        # Signal value was "28.3%"
        assert spend_ev.value != "N/A", "Spend evidence should use the real signal value."
        assert "28.3" in (spend_ev.value or "") or "28.3" in (spend_ev.description or ""), (
            f"Expected signal value '28.3%' in spend evidence, got '{spend_ev.value}'."
        )


# ─────────────────────────────────────────────────────────────────────────────
# BUG-4  Investigation Case 2 — ev_cogs_increase no longer hardcodes +14.2 %
# ─────────────────────────────────────────────────────────────────────────────

class TestInvestigationCase2NoCOGSFabrication:
    """
    Verifies that investigation Case 2 (pricing_optimization) does NOT present
    "+14.2%" as an observed dataset fact for COGS.
    """

    def test_hardcoded_cogs_percentage_absent(self):
        opp = _make_margin_opportunity()
        inv = build_investigation_for_opportunity(opp, df=None)

        cogs_ev = next((e for e in inv.evidence if e.id == "ev_cogs_increase"), None)
        assert cogs_ev is not None, "ev_cogs_increase must still exist."

        assert cogs_ev.value != "+14.2%", (
            "ev_cogs_increase.value must not contain the hardcoded '+14.2%'. "
            "This percentage was fabricated and not derived from the dataset."
        )
        assert "14.2" not in (cogs_ev.value or ""), (
            f"Hardcoded COGS percentage '14.2' still present in value: '{cogs_ev.value}'."
        )
        assert "14.2" not in (cogs_ev.description or ""), (
            f"Hardcoded COGS percentage '14.2' still present in description."
        )

    def test_cogs_evidence_marked_unavailable(self):
        """COGS increase cannot be computed without vendor data — must say so."""
        opp = _make_margin_opportunity()
        inv = build_investigation_for_opportunity(opp, df=None)

        cogs_ev = next(e for e in inv.evidence if e.id == "ev_cogs_increase")
        desc_lower = (cogs_ev.description or "").lower()
        value_lower = (cogs_ev.value or "").lower()

        unavailable_words = {"unavailable", "not available", "required", "telemetry"}
        assert any(w in desc_lower or w in value_lower for w in unavailable_words), (
            f"ev_cogs_increase must clearly indicate data is unavailable. "
            f"Got description='{cogs_ev.description}', value='{cogs_ev.value}'."
        )

    def test_case2_margin_signal_is_data_derived(self):
        """The gross margin evidence value must come from the real signal."""
        opp = _make_margin_opportunity()
        inv = build_investigation_for_opportunity(opp, df=None)

        margin_ev = next((e for e in inv.evidence if e.id == "ev_margin_drop"), None)
        assert margin_ev is not None, "ev_margin_drop must be present in Case 2."
        # Signal value was "28.4%"
        assert "28.4" in (margin_ev.value or "") or "28.4" in (margin_ev.description or ""), (
            f"ev_margin_drop must reflect the real signal value '28.4%', got '{margin_ev.value}'."
        )


# ─────────────────────────────────────────────────────────────────────────────
# Cross-cutting: no mock data in live calculation paths
# ─────────────────────────────────────────────────────────────────────────────

class TestNoMockDataInLiveCalculations:
    """Verify that live calculation functions never produce mock/demo values."""

    def test_scenario_engine_no_opp9021(self):
        """Scenario engine output must not reference OPP-9021 or demo opportunity."""
        df = _small_revenue_df()
        levers = ScenarioVariablesModel(
            marketing_budget=1.85, working_inventory=1300.0, unit_price=102.0)
        result = run_scenario_simulation(levers, df=df, preset_id="preset_growth")
        result_text = str(result.model_dump())
        assert "OPP-9021" not in result_text
        assert "Alexandra Chen" not in result_text
        assert "Apex Global" not in result_text

    def test_digital_twin_returns_dataset_values_not_defaults(self):
        """
        When a dataset is present, the Digital Twin must use the dataset's
        revenue, not the model default ₹44.8 Cr.
        """
        df = pd.DataFrame({
            "order_id": [f"ORD-{i}" for i in range(10)],
            "revenue":  [3_000.0] * 10,    # total = 30 000 rupees
            "cost":     [1_800.0] * 10,
            "inventory": [500.0] * 10,
        })
        metrics, _, _, _ = build_digital_twin_from_dataframe(df, data_quality_score=100.0)

        assert metrics["revenue"].available is True
        # Must equal 30 000 (raw rupees), not the model default 44 800 000
        assert metrics["revenue"].value == pytest.approx(30_000.0, rel=1e-3), (
            f"Revenue {metrics['revenue'].value} does not match dataset total 30 000."
        )

    def test_investigation_evidence_source_not_demo(self):
        """Evidence sources must be data-engine labels, not demo system labels."""
        opp = _make_cac_opportunity(with_conv_signal=True)
        inv = build_investigation_for_opportunity(opp, df=None)

        forbidden_sources = {
            "Digital Ad Platform Telemetry",
            "Web Analytics Pipeline",
            "ERP Financial Ledger",
            "Logistics Tracking ERP",
            "Warehouse Management System (WMS)",
        }
        for ev in inv.evidence:
            src = ev.source or ""
            assert src not in forbidden_sources, (
                f"Evidence item '{ev.id}' uses a demo source label '{src}'. "
                f"Must use 'DecisionOS Analytics Engine' or 'Unavailable'."
            )


# ==============================================================================
# FIX-3 REGRESSION: Currency precision — no ₹0.0 Cr for sub-Crore values
# ==============================================================================


class TestCurrencyFormatPrecision:
    """
    Guards the format_currency_value fix applied to decision_service.py and
    optimizer_engine.py.  Ensures sub-Crore values are shown in L (lakh) or
    rupee notation, never rounded to '₹0.0 Cr'.
    """

    def test_format_currency_urbancart_revenue(self):
        """
        UrbanCart dataset: revenue.sum() ≈ ₹4,07,082 (0.0408 Cr).
        format_currency_value must NOT return '₹0.0 Cr'.
        """
        raw_rupees = 407_082.44   # actual UrbanCart revenue.sum()
        result = format_currency_value(raw_rupees, "INR")
        assert result != "₹0.0 Cr", (
            f"format_currency_value({raw_rupees}) returned '{result}', "
            "which is the rounded-zero Cr display bug."
        )
        assert result != "N/A"
        # Should be in lakh range: 100_000 ≤ 407_082 < 10_000_000
        assert "L" in result, (
            f"Expected lakh notation for ₹4.07L, got '{result}'"
        )

    def test_format_currency_value_exact_urbancart(self):
        """format_currency_value(407082.44, 'INR') == '₹4.07 L' (2dp lakh notation)."""
        result = format_currency_value(407_082.44, "INR")
        assert result == "₹4.07 L", (
            f"Expected '₹4.07 L', got '{result}'"
        )

    def test_format_currency_sub_lakh(self):
        """Values under ₹1 L should display as plain rupee amount, not '₹0.0 Cr'."""
        result = format_currency_value(48_900.0, "INR")
        assert "Cr" not in result, f"Sub-lakh value displayed as Cr: '{result}'"
        assert result != "N/A"

    def test_format_currency_crore_range(self):
        """Values ≥ ₹1 Cr should still display in Cr notation."""
        result = format_currency_value(44_800_000.0, "INR")   # 44.8 Cr
        assert "Cr" in result, f"Expected Cr notation for 44.8 Cr, got '{result}'"
        assert "0.0" not in result.split("Cr")[0], (
            f"Got zero-rounded Cr value: '{result}'"
        )

    def test_format_currency_zero_is_not_negative(self):
        """format_currency_value(0.0, 'INR') must return a clean zero, not crash."""
        result = format_currency_value(0.0, "INR")
        assert result is not None
        assert result != "N/A"

    def test_optimizer_projected_revenue_not_zero_cr(self):
        """
        DeterministicGridSearchOptimizer calibrated with UrbanCart-scale data
        must not produce '₹0.0 Cr' for projectedRevenue or projectedGrossProfit
        in the recommendedConfiguration.
        """
        import pandas as pd
        from app.engine.optimizer_engine import DeterministicGridSearchOptimizer

        # Simulate UrbanCart-scale dataset (120 rows, low total revenue)
        df = pd.DataFrame({
            "revenue":          [3_392.35] * 120,    # total ≈ ₹4.07 L
            "cost":             [1_928.80] * 120,
            "marketing_spend":  [1_390.00] * 120,
            "inventory":        [501.0]    * 120,
            "order_id":         [f"ORD-{i}" for i in range(120)],
        })

        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df, currency="INR")
        result = opt.solve(
            objective="maximize_gross_profit",
            hard_constraints={
                "maxMarketingBudget": 2.0,
                "minMarginPercent": 30.0,
                "minInventory": 500,
                "maxInventory": 1500,
            },
        )

        if result["status"] == "optimal":
            rec = result["recommendedConfiguration"]
            gp_str = rec.get("projectedGrossProfit", "")
            rev_str = rec.get("projectedRevenue", "")
            assert gp_str not in ("₹0.0 Cr", "₹0.1 Cr"), (
                f"projectedGrossProfit is still showing zero-rounded Cr: '{gp_str}'"
            )
            assert rev_str not in ("₹0.0 Cr", "₹0.1 Cr"), (
                f"projectedRevenue is still showing zero-rounded Cr: '{rev_str}'"
            )
            # Both should contain a digit > 0
            assert any(c.isdigit() and c != "0" for c in gp_str), (
                f"projectedGrossProfit has no non-zero digit: '{gp_str}'"
            )
