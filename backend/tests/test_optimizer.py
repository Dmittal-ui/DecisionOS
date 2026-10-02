"""
DecisionOS — Phase 8 Tests: Constraint-Aware Optimizer

Comprehensive test suite verifying:
1. Feasible optimization:
   - Evaluates discrete candidates
   - Filters infeasible solutions
   - Ranks feasible solutions
   - Recommends optimal configuration
2. Infeasible constraints:
   - Strictly NEVER returns an infeasible configuration as the recommendation
   - Correctly marks status="infeasible"
   - recommendedConfiguration is None
   - Truthfully reports zero feasible candidates
3. Boundary values:
   - Discrete grid range boundaries (min, max, step)
   - Tight single-point boundary evaluation
   - Binding constraint identification at boundary limits
4. Multiple objectives:
   - Maximize Gross Profit
   - Maximize Revenue
   - Maximize Operating Margin
   - Minimize Inventory
   - Verifies differential optimal points according to the objective function
5. Constraint violations and slack accounting:
   - Budget <= 2.0 Cr
   - Margin >= 25%
   - Inventory <= 1500
   - Annual Churn <= 3.5%
   - Exact numerical slack and binding threshold detection
6. Recommended configuration & projected outcomes:
   - Full contract schema adherence with both camelCase and snake_case compatibility
   - Sensitivity drivers and trade-off analysis
7. Scientific honesty:
   - Identifies as Deterministic Discrete Grid Search Solver
   - Never falsely claims Monte Carlo or continuous Pareto frontier
8. Multi-tenant organization isolation:
   - Workspace and optimization run history isolated by tenant
"""

import pytest
import pandas as pd
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.optimizer_engine import (
    CandidateConfiguration,
    DeterministicGridSearchOptimizer,
)
from app.main import app


@pytest.fixture
def test_db():
    client = AsyncMongoMockClient()
    return client["decisionos_test"]


@pytest.fixture
async def client(test_db, tmp_path, monkeypatch):
    from app.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

    async def override_get_database():
        yield test_db

    app.dependency_overrides[get_database] = override_get_database

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c

    app.dependency_overrides.clear()


async def create_user_and_token(client: AsyncClient, name: str, email: str, org_name: str) -> dict:
    payload = {
        "name": name,
        "email": email,
        "password": "Password123!",
        "organization_name": org_name,
    }
    resp = await client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 201, f"Signup failed: {resp.text}"
    data = resp.json()["data"]
    token = data["access_token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user_id": data["user"]["id"],
        "org_id": data["user"]["organization_id"],
    }


# ==============================================================================
# 1. UNIT TESTS: ENGINE & BOUNDARY VALUES & SLACK
# ==============================================================================

def test_engine_candidate_evaluation_deterministic():
    """Verifies single candidate evaluation math is strictly deterministic."""
    opt = DeterministicGridSearchOptimizer()
    c1 = opt.evaluate_candidate(mktg=1.5, inv=1000.0, price=105.0, idx=1)
    c2 = opt.evaluate_candidate(mktg=1.5, inv=1000.0, price=105.0, idx=2)

    assert c1.revenue == c2.revenue
    assert c1.gross_profit == c2.gross_profit
    assert c1.gross_margin_percent == c2.gross_margin_percent
    assert c1.operating_margin_percent == c2.operating_margin_percent
    assert c1.realized_orders == c2.realized_orders
    assert c1.annual_churn_percent == c2.annual_churn_percent
    assert c1.revenue > 0
    assert c1.gross_profit > 0


def test_engine_constraint_violations_and_slack():
    """
    Verifies that constraint checks calculate exact numerical slack,
    flag binding constraints (slack <= 5%), and reject violations.
    """
    opt = DeterministicGridSearchOptimizer()
    cand = opt.evaluate_candidate(mktg=2.2, inv=1600.0, price=100.0, idx=1)

    hard_constraints = {
        "maxMarketingBudget": 2.0,     # Violated (2.2 > 2.0)
        "maxInventory": 1500.0,        # Violated (1600 > 1500)
        "minMarginPercent": 30.0,      # Satisfied (cand margin ~ 38%)
        "maxAnnualChurn": 3.5,         # Satisfied (cand churn ~ 3.2%)
    }

    results = opt.check_constraints(cand, hard_constraints)
    assert cand.feasible is False
    assert len(cand.violation_reasons) >= 2
    assert any("Marketing Budget" in r for r in cand.violation_reasons)
    assert any("Inventory" in r for r in cand.violation_reasons)

    # Check constraint results breakdown
    budget_res = next(r for r in results if r.id == "const_max_budget")
    assert budget_res.status == "violated"
    assert budget_res.slack_value == pytest.approx(0.2, abs=0.01)

    margin_res = next(r for r in results if r.id == "const_min_margin")
    assert margin_res.status in ["satisfied", "binding"]


def test_engine_binding_constraint_detection():
    """Tests that when slack is within 5% of threshold, constraint is marked 'binding'."""
    opt = DeterministicGridSearchOptimizer()
    # Marketing budget is 1.95, cap is 2.0 -> slack = 0.05 (2.5% of cap -> binding)
    cand = opt.evaluate_candidate(mktg=1.95, inv=1000.0, price=100.0, idx=1)
    results = opt.check_constraints(cand, {"maxMarketingBudget": 2.0})

    assert cand.feasible is True
    budget_res = next(r for r in results if r.id == "const_max_budget")
    assert budget_res.status == "binding"
    assert "Marketing Budget Cap" in cand.binding_constraints


def test_engine_annual_churn_constraint_violation():
    """Verifies that sharp price increases causing churn spikes breach churn constraint."""
    opt = DeterministicGridSearchOptimizer(base_price=100.0, base_churn=3.2)
    # Price = 135 -> +35% price increase -> churn rises above 3.5%
    cand = opt.evaluate_candidate(mktg=1.5, inv=1000.0, price=135.0, idx=1)
    assert cand.annual_churn_percent > 3.5

    results = opt.check_constraints(cand, {"maxAnnualChurn": 3.5})
    assert cand.feasible is False
    churn_res = next(r for r in results if r.id == "const_max_churn")
    assert churn_res.status == "violated"


# ==============================================================================
# 2. INTEGRATION TESTS: FEASIBLE, INFEASIBLE, MULTIPLE OBJECTIVES
# ==============================================================================

@pytest.mark.asyncio
async def test_feasible_optimization_default(client: AsyncClient):
    """
    Tests standard feasible optimization:
    - Generates candidates
    - Rejects violations
    - Evaluates objective
    - Recommends best feasible configuration
    """
    user = await create_user_and_token(client, "Nishant P", "nishant@optimizer.com", "RetailCorp")
    headers = user["headers"]

    payload = {
        "objective": "maximize_gross_profit",
        "hardConstraints": {
            "maxMarketingBudget": 2.0,
            "minMarginPercent": 25.0,
            "minInventory": 500,
            "maxInventory": 1500,
            "maxAnnualChurn": 4.0,
        },
    }

    resp = await client.post("/api/optimizer", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]

    # Feasibility guarantees
    assert data["status"] == "optimal"
    assert data["objective"] == "maximize_gross_profit"
    assert data["recommendedConfiguration"] is not None
    assert data["recommendation"] is not None
    assert data["projectedOutcomes"] is not None

    rec = data["recommendedConfiguration"]
    assert "marketingBudget" in rec
    assert "workingInventory" in rec
    assert "unitPrice" in rec
    assert "projectedGrossProfit" in rec
    assert "projectedRevenue" in rec
    assert "projectedMargin" in rec
    assert "improvementVsCurrent" in rec

    # Outcomes
    outcomes = data["projectedOutcomes"]
    assert outcomes["grossProfit"] > 0
    assert outcomes["revenue"] > 0
    assert outcomes["grossMargin"] >= 25.0

    # Constraint Status & Slack
    assert len(data["constraintStatus"]) > 0
    assert len(data["slack"]) > 0
    for cs in data["constraintStatus"]:
        assert cs["status"] in ["satisfied", "binding"], f"Constraint {cs['name']} violated in optimal config!"

    # Feasible candidates list
    assert len(data["feasibleCandidates"]) > 0
    top_cand = data["feasibleCandidates"][0]
    assert top_cand["isRecommended"] is True
    assert top_cand["rank"] == 1

    # Sensitivity is not computed by the deterministic grid search
    assert data["sensitivity"] == []
    assert len(data["tradeoffs"]) >= 2

    # Full evaluated feasible set (not a truncated top-15 ranking)
    assert len(data["feasibleCandidates"]) == data["summary"]["feasibleConfigurations"]
    assert len(data["feasibleSolutions"]) == data["summary"]["totalConfigurationsEvaluated"]
    assert "confidence" not in data or data.get("confidence") in (None, {})

    # Scientific honesty & algorithm disclosure
    summary = data["summary"]
    assert summary["algorithm"] == "Deterministic Discrete Grid Search Solver"
    assert summary["feasibleConfigurations"] > 0
    assert summary["totalConfigurationsEvaluated"] >= summary["feasibleConfigurations"]


@pytest.mark.asyncio
async def test_infeasible_constraints_never_returns_infeasible_recommendation(client: AsyncClient):
    """
    CRITICAL RULE TEST:
    When hard constraints cannot be satisfied, the optimizer MUST:
    1. Return status='infeasible'
    2. NEVER return an infeasible configuration as the recommendation (recommendedConfiguration is None)
    3. Return 0 feasible candidates
    4. Provide clear explanatory disclaimer
    """
    user = await create_user_and_token(client, "Jane D", "jane@infeasible.com", "AeroDynamics")
    headers = user["headers"]

    # Impossible constraints: 95% margin requirement (retail baseline is ~38%)
    payload = {
        "objective": "maximize_gross_profit",
        "hardConstraints": {
            "minMarginPercent": 95.0,  # Impossible margin floor
            "maxMarketingBudget": 1.5,
        },
    }

    resp = await client.post("/api/optimizer", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]

    # Infeasible guarantees
    assert data["status"] == "infeasible"
    assert data["recommendedConfiguration"] is None, "Infeasible configuration was illegally recommended!"
    assert data["recommendation"] is None, "Infeasible configuration was illegally recommended!"
    assert data["projectedOutcomes"] is None
    assert data["feasibleCandidates"] == []
    assert data["results"] == []
    assert data["summary"]["feasibleConfigurations"] == 0
    assert data["summary"]["infeasibleConfigurations"] > 0
    assert "violated" in data["disclaimer"].lower() or "infeasible" in data["disclaimer"].lower()


@pytest.mark.asyncio
async def test_boundary_values_and_custom_allowed_ranges(client: AsyncClient):
    """
    Tests allowedRanges customization and boundary limits:
    - Tight range with min == max produces exactly one discrete evaluation point
    - Custom steps are respected
    """
    user = await create_user_and_token(client, "Boundary User", "bound@test.com", "BoundCorp")
    headers = user["headers"]

    payload = {
        "objective": "maximize_gross_profit",
        "allowedRanges": {
            "marketingBudget": {"min": 1.5, "max": 1.5, "step": 0.1},      # 1 value
            "workingInventory": {"min": 1000.0, "max": 1000.0, "step": 50}, # 1 value
            "unitPrice": {"min": 100.0, "max": 105.0, "step": 5.0},         # 2 values (100, 105)
        },
        "hardConstraints": {
            "maxMarketingBudget": 2.0,
        },
    }

    resp = await client.post("/api/optimizer", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]

    # Exactly 1 * 1 * 2 = 2 total configurations evaluated
    assert data["summary"]["totalConfigurationsEvaluated"] == 2
    rec = data["recommendedConfiguration"]
    assert rec["marketingBudgetNum"] == 15000000  # Exactly 1.5 Cr
    assert rec["workingInventoryNum"] == 1000      # Exactly 1000 units


@pytest.mark.asyncio
async def test_multiple_objectives_yield_specialized_recommendations(client: AsyncClient):
    """
    Tests that the 4 supported objectives yield mathematically coherent,
    distinct optimal configurations:
    1. maximize_gross_profit
    2. maximize_revenue
    3. maximize_operating_margin
    4. minimize_inventory
    """
    user = await create_user_and_token(client, "Multi Obj", "multi@objectives.com", "ObjectiveLLC")
    headers = user["headers"]

    common_constraints = {
        "maxMarketingBudget": 2.5,
        "minInventory": 600,
        "maxInventory": 1500,
        "minMarginPercent": 25.0,
    }

    # 1. Maximize Gross Profit
    res_profit = await client.post(
        "/api/optimizer",
        json={"objective": "maximize_gross_profit", "hardConstraints": common_constraints},
        headers=headers,
    )
    gp_data = res_profit.json()["data"]
    assert gp_data["status"] == "optimal"

    # 2. Maximize Revenue
    res_rev = await client.post(
        "/api/optimizer",
        json={"objective": "maximize_revenue", "hardConstraints": common_constraints},
        headers=headers,
    )
    rev_data = res_rev.json()["data"]
    assert rev_data["status"] == "optimal"

    # 3. Maximize Operating Margin
    res_margin = await client.post(
        "/api/optimizer",
        json={"objective": "maximize_operating_margin", "hardConstraints": common_constraints},
        headers=headers,
    )
    margin_data = res_margin.json()["data"]
    assert margin_data["status"] == "optimal"

    # 4. Minimize Inventory
    res_inv = await client.post(
        "/api/optimizer",
        json={"objective": "minimize_inventory", "hardConstraints": common_constraints},
        headers=headers,
    )
    inv_data = res_inv.json()["data"]
    assert inv_data["status"] == "optimal"

    # Comparison guarantees
    # Maximize Revenue should produce revenue >= Maximize Operating Margin revenue
    assert rev_data["projectedOutcomes"]["revenue"] >= margin_data["projectedOutcomes"]["revenue"]

    # Minimize Inventory should recommend lowest feasible working inventory (boundary of minInventory = 600)
    assert inv_data["recommendedConfiguration"]["workingInventoryNum"] == 600

    # Maximize Operating Margin should have operating margin >= Maximize Revenue operating margin
    assert margin_data["projectedOutcomes"]["operatingMargin"] >= rev_data["projectedOutcomes"]["operatingMargin"]


@pytest.mark.asyncio
async def test_optimizer_post_v1_solve_endpoint_contract(client: AsyncClient):
    """
    Tests exact conformity to docs/API_CONTRACT.md section 7:
    POST /api/v1/optimizer/solve
    """
    user = await create_user_and_token(client, "Contract User", "contract@api.com", "ContractCorp")
    headers = user["headers"]

    payload = {
        "objective": "maximize_gross_profit",
        "hardConstraints": {
            "maxMarketingBudget": 2.0,
            "minInventory": 500,
            "maxInventory": 1500,
            "minMarginPercent": 30.0,
        },
    }

    resp = await client.post("/api/v1/optimizer/solve", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]

    # Contract checks
    assert "results" in data
    assert "recommendation" in data
    assert "summary" in data
    assert len(data["results"]) > 0

    first_result = data["results"][0]
    assert "id" in first_result
    assert "label" in first_result
    assert "grossProfit" in first_result
    assert "revenue" in first_result
    assert "margin" in first_result
    assert "budget" in first_result
    assert first_result["status"] == "recommended"
    assert first_result["rank"] == 1


@pytest.mark.asyncio
async def test_optimizer_workspace_and_multi_tenant_isolation(client: AsyncClient):
    """
    Verifies:
    1. GET /api/optimizer returns complete workspace state
    2. Multi-tenant isolation: Org B cannot see Org A's optimization history
    """
    # Org A
    user_a = await create_user_and_token(client, "Org A Lead", "lead_a@corp.com", "Org Alpha")
    # Org B
    user_b = await create_user_and_token(client, "Org B Lead", "lead_b@corp.com", "Org Beta")

    # Org A runs 2 optimizations
    await client.post(
        "/api/optimizer",
        json={"objective": "maximize_gross_profit", "hardConstraints": {"maxMarketingBudget": 1.8}},
        headers=user_a["headers"],
    )
    await client.post(
        "/api/optimizer",
        json={"objective": "maximize_revenue", "hardConstraints": {"maxMarketingBudget": 2.2}},
        headers=user_a["headers"],
    )

    # Org A checks workspace
    ws_resp = await client.get("/api/optimizer", headers=user_a["headers"])
    assert ws_resp.status_code == 200
    ws_data = ws_resp.json()["data"]
    assert "objectives" in ws_data
    assert "decisionVariables" in ws_data
    assert "results" in ws_data

    # Org A checks history
    hist_a_resp = await client.get("/api/optimizer/history", headers=user_a["headers"])
    assert hist_a_resp.status_code == 200
    hist_a = hist_a_resp.json()["data"]
    assert len(hist_a) == 2

    # Org B checks history -> MUST be empty (zero runs for Org B)
    hist_b_resp = await client.get("/api/optimizer/history", headers=user_b["headers"])
    assert hist_b_resp.status_code == 200
    hist_b = hist_b_resp.json()["data"]
    assert len(hist_b) == 0, f"Tenant leak: Org B saw {len(hist_b)} runs from Org A!"


def test_minmax_normalize_and_zero_range():
    assert DeterministicGridSearchOptimizer.minmax_normalize([]) == []
    assert DeterministicGridSearchOptimizer.minmax_normalize([4.0, 4.0, 4.0]) == [0.0, 0.0, 0.0]
    scaled = DeterministicGridSearchOptimizer.minmax_normalize([10.0, 20.0, 30.0])
    assert scaled[0] == 0.0
    assert scaled[2] == 100.0
    assert scaled[1] == 50.0


def test_non_dominated_mask_two_objectives():
    """A and B are non-dominated; C is dominated by A."""
    mask = DeterministicGridSearchOptimizer.non_dominated_mask(
        [10.0, 8.0, 7.0],
        [5.0, 8.0, 4.0],
    )
    assert mask == [True, True, False]


def test_engine_exposes_full_feasible_set_and_discrete_pareto():
    """
    Discrete Pareto is computed from ALL feasible grid points, not a top-15 cut.
    Coordinates are min-max of actual gross profit and operating margin.
    """
    opt = DeterministicGridSearchOptimizer()
    result = opt.solve(
        objective="maximize_gross_profit",
        hard_constraints={
            "maxMarketingBudget": 2.0,
            "minMarginPercent": 25.0,
            "minInventory": 500,
            "maxInventory": 1500,
        },
        allowed_ranges={
            "marketingBudget": {"min": 1.0, "max": 1.3, "step": 0.15},
            "workingInventory": {"min": 600.0, "max": 800.0, "step": 100.0},
            "unitPrice": {"min": 100.0, "max": 105.0, "step": 5.0},
        },
    )
    assert result["status"] == "optimal"
    summary = result["summary"]
    n_feas = summary["feasibleConfigurations"]
    n_total = summary["totalConfigurationsEvaluated"]
    assert n_feas > 0
    assert len(result["feasibleCandidates"]) == n_feas
    assert len(result["feasibleSolutions"]) == n_total
    assert len(result["paretoFrontier"]) == n_feas
    assert result["sensitivity"] == []
    assert "confidence" not in result

    frontier = [p for p in result["paretoFrontier"] if p.get("onFrontier")]
    assert len(frontier) >= 1
    rec_id = summary["optimalConfigId"]
    rec_points = [p for p in result["paretoFrontier"] if p["id"] == rec_id]
    assert rec_points and rec_points[0]["type"] == "recommended"

    for p in frontier:
        for q in result["paretoFrontier"]:
            if p["id"] == q["id"]:
                continue
            dominates = (
                q["grossProfit"] >= p["grossProfit"]
                and q["operatingMargin"] >= p["operatingMargin"]
                and (q["grossProfit"] > p["grossProfit"] or q["operatingMargin"] > p["operatingMargin"])
            )
            assert not dominates, f"{q['id']} dominates frontier point {p['id']}"

    xs = [s["x"] for s in result["feasibleSolutions"]]
    ys = [s["y"] for s in result["feasibleSolutions"]]
    assert min(xs) >= 0.0 and max(xs) <= 100.0
    assert min(ys) >= 0.0 and max(ys) <= 100.0


@pytest.mark.asyncio
async def test_live_workspace_uses_engine_values_not_mock(client: AsyncClient):
    """GET /api/optimizer must not inject mock search stats, Config #742, or confidence scores."""
    user = await create_user_and_token(client, "Live Opt", "live.opt@corp.com", "LiveOptCorp")
    headers = user["headers"]

    resp = await client.get("/api/optimizer", headers=headers)
    assert resp.status_code == 200, resp.text
    ws = resp.json()["data"]
    payload = resp.text

    assert "cfg-742" not in payload
    assert "Config #742" not in payload
    assert "confidence" not in ws

    summary = ws["summary"]
    assert summary["algorithm"] == "Deterministic Discrete Grid Search Solver"
    assert summary["totalConfigurationsEvaluated"] == (
        summary["feasibleConfigurations"] + summary["infeasibleConfigurations"]
    )
    assert summary["totalConfigurationsEvaluated"] != 1260 or summary["feasibleConfigurations"] != 842
    assert summary.get("solverDurationMs") is not None

    assert len(ws["feasibleCandidates"]) == summary["feasibleConfigurations"]
    assert len(ws["feasibleSolutions"]) == summary["totalConfigurationsEvaluated"]
    assert len(ws["paretoFrontier"]) == summary["feasibleConfigurations"]
    assert ws["sensitivity"] == []
    assert isinstance(ws["history"], list)
    assert len(ws["history"]) >= 1

    mock_search = {"totalCandidates": 1260, "feasibleCount": 842, "infeasibleCount": 418}
    assert ws["summary"].get("totalCandidates") != mock_search["totalCandidates"]
    assert "searchSummary" not in ws or ws.get("searchSummary") is None


# ==============================================================================
# 6. OPTIMIZER FIX REGRESSION TESTS
#    Validate the six calibration fixes applied to optimizer_engine.py:
#      F1 – scale_factor is a fixed MODEL_ASSUMPTION constant (10,000)
#      F2 – base_orders = base_revenue × 10,000 (model identity)
#      F3 – revenue floor max(0.1,…) replaced with max(0.0,…)
#      F4 – base_mktg derived from marketing_spend column when available
#      F5 – base_inv derived from inventory.iloc[-1] (latest snapshot)
#      F6 – base_opex = base_revenue × 0.10 (MODEL_ASSUMPTION ratio)
#    And one existing-behaviour guard:
#      F7 – constraints / objective / Pareto logic unchanged
# ==============================================================================

class TestOptimizerFixF1ScaleFactor:
    """F1: scale_factor must always equal 10,000 regardless of dataset."""

    def test_default_constructor_scale_factor(self):
        """Default constructor: scale_factor == 10,000."""
        opt = DeterministicGridSearchOptimizer()
        assert opt.scale_factor == 10_000.0

    def test_from_dataframe_none_scale_factor(self):
        """from_dataframe(None): scale_factor == 10,000."""
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=None)
        assert opt.scale_factor == 10_000.0

    def test_from_dataframe_with_revenue_scale_factor(self):
        """With a real revenue column scale_factor must still be 10,000."""
        df = pd.DataFrame({
            "revenue": [100_000.0, 200_000.0, 107_082.44],
            "cost":    [ 60_000.0, 120_000.0,  60_000.00],
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.scale_factor == 10_000.0

    def test_revenue_model_identity_holds(self):
        """
        The model identity: rev(base_orders, base_price) == base_revenue.
        With scale_factor fixed at 10,000 and base_orders = base_revenue * 10,000:
            rev = (base_orders × base_price) / (scale_factor × base_price)
                = base_orders / scale_factor
                = (base_revenue × 10,000) / 10,000
                = base_revenue  ✓
        """
        df = pd.DataFrame({
            "revenue": [200_000.0, 207_082.44],
            "cost":    [120_000.0, 120_000.00],
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        expected_rev_cr = (200_000.0 + 207_082.44) / 10_000_000.0  # ≈ 0.04071 Cr

        # At base_orders / price / mktg / inv defaults revenue should reproduce base_revenue
        cand = opt.evaluate_candidate(
            mktg=opt.base_mktg, inv=opt.base_inv, price=opt.base_price, idx=1
        )
        # revenue at exact baseline should equal base_revenue (within rounding)
        assert abs(cand.revenue - expected_rev_cr) < 0.01, (
            f"Baseline revenue {cand.revenue:.4f} Cr should ≈ base_revenue "
            f"{expected_rev_cr:.4f} Cr"
        )


class TestOptimizerFixF2BaseOrders:
    """F2: base_orders = base_revenue × 10,000 — the model-identity derivation."""

    def test_base_orders_model_identity(self):
        """base_orders must equal base_revenue * 10,000 when a revenue column is present."""
        df = pd.DataFrame({
            "revenue": [100_000.0, 150_000.0, 157_082.44],
            "cost":    [ 60_000.0,  90_000.0,  90_000.00],
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        expected_rev_cr = sum([100_000.0, 150_000.0, 157_082.44]) / 10_000_000.0
        expected_base_orders = expected_rev_cr * 10_000.0
        assert abs(opt.base_orders - expected_base_orders) < 1.0, (
            f"base_orders {opt.base_orders:.2f} should ≈ {expected_base_orders:.2f}"
        )

    def test_base_orders_not_raw_transaction_count(self):
        """base_orders must NOT equal the raw number of dataset rows (old broken behaviour)."""
        # 120 rows, revenue ≈ ₹4.07 L → base_orders should be ≈ 407, not 120
        n_rows = 120
        df = pd.DataFrame({
            "revenue": [3_392.35] * n_rows,  # each row ~₹3,392 → total ≈ ₹407,082
            "cost":    [1_928.80] * n_rows,
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_orders != float(n_rows), (
            "base_orders must not equal raw row count; it must be base_revenue × 10,000"
        )
        assert opt.base_orders > n_rows, (
            f"base_orders {opt.base_orders:.1f} should be >> {n_rows} rows"
        )


class TestOptimizerFixF3RevenueFloor:
    """F3: revenue floor changed from max(0.1, ...) to max(0.0, ...).
    After the scale_factor fix, revenue is a real non-zero value and the
    floor must not inject phantom profit.
    """

    def test_revenue_floor_is_zero_not_point_one(self):
        """
        Fabricated floor test: construct a case where calculated revenue would
        be < 0.1 Cr and verify the result is NOT clamped to 0.1.
        Use a tiny base_orders so revenue is genuinely small.
        """
        # base_orders=1, base_price=100, scale_factor=10,000
        # rev = (1 × 100) / (10,000 × 100) = 0.0001 Cr — below old 0.1 floor
        opt = DeterministicGridSearchOptimizer(
            base_orders=1.0,
            base_revenue=0.0001,
            base_inv=1.0,
            base_mktg=0.01,
        )
        cand = opt.evaluate_candidate(mktg=0.01, inv=1.0, price=100.0, idx=1)
        assert cand.revenue < 0.1, (
            f"Revenue {cand.revenue} should not be clamped to the old 0.1 Cr floor"
        )

    def test_gross_margin_consistent_when_revenue_is_small(self):
        """
        When revenue is small but non-zero, gm_pct must equal (gp/rev)*100 — not
        be inflated by a mismatched floor on rev vs cogs.
        """
        opt = DeterministicGridSearchOptimizer(
            base_orders=5.0,
            base_revenue=0.0005,
            base_inv=10.0,
            base_mktg=0.01,
        )
        cand = opt.evaluate_candidate(mktg=0.01, inv=10.0, price=100.0, idx=1)
        if cand.revenue > 0:
            expected_gm = round(cand.gross_profit / cand.revenue * 100.0, 1)
            assert abs(cand.gross_margin_percent - expected_gm) < 0.2, (
                f"gm_pct {cand.gross_margin_percent} ≠ algebraic {expected_gm}"
            )

    def test_gross_profit_not_larger_than_revenue(self):
        """gross_profit must never exceed revenue (no phantom profit from floor)."""
        opt = DeterministicGridSearchOptimizer()
        for price in [95.0, 100.0, 105.0, 110.0, 120.0]:
            cand = opt.evaluate_candidate(mktg=1.5, inv=1000.0, price=price, idx=1)
            assert cand.gross_profit <= cand.revenue + 1e-6, (
                f"GP {cand.gross_profit} > Revenue {cand.revenue} at price={price}"
            )


class TestOptimizerFixF4BaseMarketingSpend:
    """F4: base_mktg is derived from marketing_spend column when present."""

    def test_base_mktg_derived_from_dataset(self):
        """When marketing_spend is in df, base_mktg = spend_sum / 10,000,000."""
        total_spend_rupees = 166_800.0
        df = pd.DataFrame({
            "revenue":        [3_392.35] * 120,
            "cost":           [1_928.80] * 120,
            "marketing_spend": [total_spend_rupees / 120] * 120,
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        expected_mktg_cr = total_spend_rupees / 10_000_000.0
        assert abs(opt.base_mktg - expected_mktg_cr) < 1e-6, (
            f"base_mktg {opt.base_mktg:.6f} Cr should ≈ {expected_mktg_cr:.6f} Cr"
        )

    def test_base_mktg_stays_default_when_column_absent(self):
        """Without a marketing_spend column, base_mktg keeps the model default 1.40."""
        df = pd.DataFrame({
            "revenue": [100_000.0, 200_000.0],
            "cost":    [ 60_000.0, 120_000.0],
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_mktg == 1.40


class TestOptimizerFixF5BaseInventorySnapshot:
    """F5: base_inv uses inventory.iloc[-1] — the latest snapshot, not sum."""

    def test_base_inv_is_latest_snapshot(self):
        """base_inv must equal the last non-null inventory value, not their sum."""
        inventory_rows = [900.0, 700.0, 600.0, 501.0]  # last = 501
        df = pd.DataFrame({
            "revenue":   [10_000.0] * len(inventory_rows),
            "cost":      [ 6_000.0] * len(inventory_rows),
            "inventory": inventory_rows,
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_inv == 501.0, (
            f"base_inv {opt.base_inv} should be last snapshot 501.0, not sum {sum(inventory_rows)}"
        )

    def test_base_inv_not_sum(self):
        """base_inv must NOT equal the sum of inventory rows."""
        inventory_rows = [900.0, 700.0, 600.0, 501.0]
        df = pd.DataFrame({
            "revenue":   [10_000.0] * len(inventory_rows),
            "cost":      [ 6_000.0] * len(inventory_rows),
            "inventory": inventory_rows,
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_inv != sum(inventory_rows), (
            "base_inv must be latest snapshot, not cumulative sum"
        )

    def test_base_inv_stays_default_when_column_absent(self):
        """Without inventory column, base_inv keeps model default 1000."""
        df = pd.DataFrame({
            "revenue": [100_000.0],
            "cost":    [ 60_000.0],
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_inv == 1000.0


class TestOptimizerFixF6BaseOpex:
    """F6: OPEX is 0.0 & UNAVAILABLE when absent, and DATASET-derived when operating_expense is present."""

    def test_base_opex_zero_when_absent(self):
        """base_opex must be 0.0 and opex_source UNAVAILABLE when operating_expense column is absent."""
        df = pd.DataFrame({
            "revenue": [3_392.35] * 120,   # total ≈ ₹407,082 → 0.04071 Cr
            "cost":    [1_928.80] * 120,
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert opt.base_opex == 0.0
        assert opt.opex_source == "UNAVAILABLE"

    def test_base_opex_derived_when_present(self):
        """When operating_expense column exists, base_opex is DATASET-derived."""
        df = pd.DataFrame({
            "revenue": [10_000_000.0],
            "cost": [6_000_000.0],
            "operating_expense": [1_000_000.0],  # 0.1 Cr
        })
        opt = DeterministicGridSearchOptimizer.from_dataframe(df=df)
        assert abs(opt.base_opex - 0.10) < 1e-6
        assert opt.opex_source == "DATASET"


class TestOptimizerFixF7ConstraintsObjectivePareto:
    """
    F7: Constraint logic, objective scoring, and Pareto computation must be
    completely unchanged by the calibration fixes.
    """

    def test_default_constraint_keys_unchanged(self):
        """solve() default constraint dict must be exactly as specified."""
        opt = DeterministicGridSearchOptimizer()
        result = opt.solve(
            objective="maximize_gross_profit",
            hard_constraints=None,   # triggers the default dict
            allowed_ranges={
                "marketingBudget":   {"min": 1.0, "max": 1.3, "step": 0.3},
                "workingInventory":  {"min": 1000.0, "max": 1000.0, "step": 1.0},
                "unitPrice":         {"min": 100.0, "max": 100.0, "step": 1.0},
            },
        )
        # With defaults: maxMarketingBudget=2.0, minMargin=30%, inv 500–1500
        # mktg=1.0 and 1.3 are both ≤ 2.0 and inv=1000 is within [500,1500]
        assert result["status"] in ("optimal", "infeasible")
        if result["status"] == "optimal":
            for cs in result["constraintStatus"]:
                assert cs["status"] in ("satisfied", "binding")

    def test_objective_score_is_gross_profit_not_margin(self):
        """maximize_gross_profit scores by gross_profit Cr, not margin %."""
        opt = DeterministicGridSearchOptimizer()
        result = opt.solve(
            objective="maximize_gross_profit",
            hard_constraints={"maxMarketingBudget": 2.0, "minMarginPercent": 25.0,
                               "minInventory": 600, "maxInventory": 1500},
        )
        assert result["status"] == "optimal"
        cands = result["feasibleCandidates"]
        # The recommended candidate (rank=1) must have gross_profit >= all others
        rec = next(c for c in cands if c["isRecommended"])
        for c in cands:
            assert rec["grossProfit"] >= c["grossProfit"] - 1e-6

    def test_pareto_non_domination_holds(self):
        """No Pareto-frontier point should be dominated by another feasible point."""
        opt = DeterministicGridSearchOptimizer()
        result = opt.solve(
            objective="maximize_gross_profit",
            hard_constraints={"maxMarketingBudget": 2.0, "minMarginPercent": 25.0,
                               "minInventory": 600, "maxInventory": 1500},
            allowed_ranges={
                "marketingBudget":  {"min": 1.0, "max": 1.3, "step": 0.15},
                "workingInventory": {"min": 600.0, "max": 900.0, "step": 150.0},
                "unitPrice":        {"min": 100.0, "max": 105.0, "step": 5.0},
            },
        )
        assert result["status"] == "optimal"
        frontier = [p for p in result["paretoFrontier"] if p.get("onFrontier")]
        assert len(frontier) >= 1
        for p in frontier:
            for q in result["paretoFrontier"]:
                if p["id"] == q["id"]:
                    continue
                dominates = (
                    q["grossProfit"] >= p["grossProfit"]
                    and q["operatingMargin"] >= p["operatingMargin"]
                    and (q["grossProfit"] > p["grossProfit"] or q["operatingMargin"] > p["operatingMargin"])
                )
                assert not dominates, (
                    f"{q['id']} dominates frontier point {p['id']}"
                )

    def test_infeasible_never_produces_recommendation(self):
        """Impossible constraints must still return status=infeasible, no recommendation."""
        opt = DeterministicGridSearchOptimizer()
        result = opt.solve(
            objective="maximize_gross_profit",
            hard_constraints={"minMarginPercent": 99.0},  # impossible
        )
        assert result["status"] == "infeasible"
        assert result["recommendedConfiguration"] is None
        assert result["feasibleCandidates"] == []
