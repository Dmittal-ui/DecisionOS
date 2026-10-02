"""
DecisionOS — Price & OPEX Regression Test Suite

Verifies:
A. Real Price Baseline is derived correctly from dataset.
B. Price percentages apply to real price baseline (P * ratio).
C. No fake ₹100 price displayed when dataset contains real prices.
D. Missing OPEX is explicitly set to 0.0 / UNAVAILABLE with disclosure.
E. Real OPEX column is DATA_DERIVED from dataset.
F. Scenario Engine and Optimizer Engine share identical price & OPEX semantics.
"""

import pandas as pd
import pytest

from app.engine.optimizer_engine import DeterministicGridSearchOptimizer
from app.engine.scenario_engine import run_scenario_simulation
from app.models.scenario import ScenarioVariablesModel


def test_a_real_price_baseline_derivation():
    """A. Given a dataset with known transaction prices, real_price_baseline must be DATA_DERIVED."""
    # Dataset with 10 units sold for ₹26,130 total → ₹2,613 / unit average
    df = pd.DataFrame({
        "revenue": [26_130.0],
        "quantity": [10.0],
        "cost": [16_000.0],
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    assert opt.real_price_baseline == 2613.0

    # Test via unit_price fallback column
    df_unit = pd.DataFrame({
        "revenue": [26_130.0],
        "unit_price": [2613.0],
        "cost": [16_000.0],
    })
    opt_unit = DeterministicGridSearchOptimizer.from_dataframe(df=df_unit)
    assert opt_unit.real_price_baseline == 2613.0


def test_b_price_percentage_scaling():
    """B. If baseline price is P and grid price is +5% (105), display price = P * 1.05."""
    p_base = 2613.0
    df = pd.DataFrame({
        "revenue": [261_300.0],
        "quantity": [100.0],
        "cost": [160_000.0],
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    res = opt.solve(
        objective="maximize_gross_profit",
        allowed_ranges={
            "marketingBudget": {"min": 1.4, "max": 1.4, "step": 0.1},
            "workingInventory": {"min": 1000.0, "max": 1000.0, "step": 100.0},
            "unitPrice": {"min": 105.0, "max": 105.0, "step": 1.0},  # +5%
        }
    )
    rec = res["recommendedConfiguration"]
    expected_display_price = round(p_base * 1.05, 2)  # ₹2743.65
    assert rec["unitPriceNum"] == expected_display_price
    assert rec["unitPriceGridValue"] == 105.0
    assert "2,744" in rec["unitPrice"] or "2,743" in rec["unitPrice"]


def test_c_no_fake_100_display():
    """C. Verify optimizer response does NOT expose internal 100 normalized price as actual price."""
    df = pd.DataFrame({
        "revenue": [500_000.0],
        "quantity": [100.0],  # ₹5,000 per unit real price
        "cost": [300_000.0],
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    res = opt.solve(
        objective="maximize_gross_profit",
        allowed_ranges={
            "marketingBudget": {"min": 1.4, "max": 1.4, "step": 0.1},
            "workingInventory": {"min": 1000.0, "max": 1000.0, "step": 100.0},
            "unitPrice": {"min": 100.0, "max": 100.0, "step": 1.0},
        }
    )
    rec = res["recommendedConfiguration"]
    assert rec["unitPriceNum"] == 5000.0
    assert rec["realPriceBaseline"] == 5000.0
    assert rec["unitPrice"] != "₹100" and rec["unitPrice"] != "100"


def test_d_missing_opex_behavior():
    """D. Given a dataset with no OPEX column, base_opex == 0.0 and opex_source == UNAVAILABLE with disclosure."""
    df = pd.DataFrame({
        "revenue": [100_000.0],
        "cost": [60_000.0],
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    assert opt.base_opex == 0.0
    assert opt.opex_source == "UNAVAILABLE"

    # Scenario Engine check
    levers = ScenarioVariablesModel(marketing_budget=1.4, working_inventory=1000.0, unit_price=100.0)
    scen_res = run_scenario_simulation(levers=levers, df=df)
    assert scen_res.opexSource == "UNAVAILABLE"
    assert "unavailable" in scen_res.opexDisclosure.lower()


def test_e_real_opex_behavior():
    """E. Given a dataset with an OPEX column, opex_source is DATA_DERIVED/DATASET and value comes from dataset."""
    df = pd.DataFrame({
        "revenue": [10_000_000.0],  # 1 Cr
        "cost": [6_000_000.0],
        "operating_expense": [500_000.0],  # 0.05 Cr
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    assert abs(opt.base_opex - 0.05) < 1e-6
    assert opt.opex_source == "DATASET"

    levers = ScenarioVariablesModel(marketing_budget=1.4, working_inventory=1000.0, unit_price=100.0)
    scen_res = run_scenario_simulation(levers=levers, df=df)
    assert scen_res.opexSource == "DATA_DERIVED"
    assert scen_res.realPriceBaseline == 0.0  # no quantity/unit_price column


def test_f_scenario_optimizer_consistency():
    """F. The same dataset and price percentage produce consistent price baseline and OPEX semantics in both engines."""
    df = pd.DataFrame({
        "revenue": [500_000.0],
        "quantity": [200.0],  # ₹2,500 / unit
        "cost": [300_000.0],
        "operating_expense": [25_000.0],
    })
    opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
    levers = ScenarioVariablesModel(marketing_budget=1.4, working_inventory=1000.0, unit_price=105.0)
    scen_res = run_scenario_simulation(levers=levers, df=df)

    assert opt.real_price_baseline == scen_res.realPriceBaseline == 2500.0
    assert opt.opex_source == "DATASET"
    assert scen_res.opexSource == "DATA_DERIVED"
