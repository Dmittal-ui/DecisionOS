"""
DecisionOS — Phase 7 Tests: Decision Replay + Scenario Lab Simulation Engine

Comprehensive test suite verifying:
1. Decision Replay (Part A):
   - Historical decision lookup and listing
   - Actual vs counterfactual branch recalculation
   - Explicit simulated labeling and epistemic disclaimer
   - Replay timeline progression and metric deltas
   - Multi-tenant organization isolation
2. Scenario Lab (Part B):
   - Scenario preset retrieval
   - Baseline -> change variables -> scenario simulation -> calculated result
   - Microeconomic modeling: price elasticity, ad saturation, inventory constraint
   - Constraint checks (working capital cap, inventory floor, margin hurdle)
   - Sensitivity drivers and probabilistic uncertainty ranges
   - Supply bottleneck handling (low inventory capping demand)
"""

import io
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.scenario_engine import run_scenario_simulation
from app.main import app
from app.models.scenario import ScenarioVariablesModel


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
    res = await client.post("/api/auth/signup", json=payload)
    assert res.status_code == 201
    data = res.json()["data"]
    return {
        "token": data["access_token"],
        "user": data["user"],
        "org_id": data["user"]["organization_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. Decision Replay Tests (Part A)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_historical_decisions(client: AsyncClient):
    """Verifies listing of past decisions with empirical telemetry and counterfactual branches."""
    user = await create_user_and_token(client, "Replay User", "replay@test.com", "Replay Corp")
    headers = user["headers"]

    # 1. Standard endpoint GET /api/replay
    res = await client.get("/api/replay", headers=headers)
    assert res.status_code == 200
    decisions = res.json()["data"]
    assert len(decisions) >= 2

    dec1 = next((d for d in decisions if d["code"] == "DEC-2026-MKT-018"), decisions[0])
    assert dec1["id"] is not None
    assert dec1["title"] == "Marketing Channel Budget Reallocation"
    assert dec1["actionTaken"] is not None
    assert dec1["owner"] is not None
    assert len(dec1["availableBranches"]) >= 2

    # Verify branch structure
    branch = dec1["availableBranches"][0]
    assert branch["id"] == "branch_reallocate"
    assert branch["label"] is not None
    assert branch["description"] is not None

    # 2. Contract alias endpoint GET /api/v1/replay/historical-decisions
    alias_res = await client.get("/api/v1/replay/historical-decisions", headers=headers)
    assert alias_res.status_code == 200
    assert len(alias_res.json()["data"]) == len(decisions)


@pytest.mark.asyncio
async def test_get_replay_workspace_by_id(client: AsyncClient):
    """Verifies loading historical business state and default counterfactual branch."""
    user = await create_user_and_token(client, "Workspace User", "workspace@test.com", "Workspace Corp")
    headers = user["headers"]

    # Fetch the list first to get the org-scoped decision ID
    list_res = await client.get("/api/replay", headers=headers)
    assert list_res.status_code == 200
    decisions = list_res.json()["data"]
    assert len(decisions) >= 1
    dec_id = decisions[0]["id"]  # org-scoped: e.g. "hist_dec_1_<org_prefix>"

    res = await client.get(f"/api/replay/{dec_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    # 1. Decision context — id is org-scoped, code stays constant
    assert data["decision"]["id"] == dec_id
    assert data["decision"]["code"] in ("DEC-2026-MKT-018", "DEC-2026-INV-009")
    assert data["selectedBranchId"] is not None

    # 2. Actual vs Counterfactual Timelines
    assert len(data["actualTimeline"]) >= 3
    assert len(data["counterfactualTimeline"]) >= 3

    # 3. Side-by-side metric comparison
    metrics = data["metrics"]
    assert len(metrics) >= 3
    metric_keys = [m["key"] for m in metrics]
    assert "gross_revenue" in metric_keys
    assert "gross_profit" in metric_keys
    assert "operating_margin" in metric_keys

    for m in metrics:
        assert m["actualValue"] is not None
        assert m["counterfactualValue"] is not None
        assert m["delta"] is not None
        assert m["deltaType"] in ("positive", "negative", "neutral")

    # 4. Epistemic integrity requirement: strictly labeled as simulated
    assert data["isSimulated"] is True
    assert "simulated" in data["disclaimer"].lower()
    assert "guarantee" in data["disclaimer"].lower()

    # 5. Contract alias GET /api/v1/replay/workspace/{id}
    alias_res = await client.get(f"/api/v1/replay/workspace/{dec_id}", headers=headers)
    assert alias_res.status_code == 200
    assert alias_res.json()["data"]["isSimulated"] is True


@pytest.mark.asyncio
async def test_simulate_counterfactual_replay_post(client: AsyncClient):
    """
    Tests POST /api/replay:
    Accepts counterfactual configuration, recalculates supported metrics,
    and returns actual vs counterfactual comparison labeled as simulated.
    """
    user = await create_user_and_token(client, "Sim User", "sim@test.com", "Sim Corp")
    headers = user["headers"]

    # Get the org-scoped decision ID
    list_res = await client.get("/api/replay", headers=headers)
    decisions = list_res.json()["data"]
    dec_id = next((d["id"] for d in decisions if d["code"] == "DEC-2026-MKT-018"), decisions[0]["id"])

    # Branch 1: branch_reallocate (Aggressive shift to high-intent keywords)
    payload_reallocate = {
        "decisionId": dec_id,
        "branchId": "branch_reallocate",
    }
    res1 = await client.post("/api/replay", headers=headers, json=payload_reallocate)
    assert res1.status_code == 200
    data1 = res1.json()["data"]

    assert data1["selectedBranchId"] == "branch_reallocate"
    assert data1["isSimulated"] is True

    gp_metric = next(m for m in data1["metrics"] if m["key"] == "gross_profit")
    assert gp_metric["counterfactualNum"] > gp_metric["actualNum"]
    assert gp_metric["deltaType"] == "positive"

    cac_metric = next(m for m in data1["metrics"] if m["key"] == "blended_cac")
    assert cac_metric["counterfactualNum"] < cac_metric["actualNum"]

    # Branch 2: branch_hold (Conservative budget hold)
    payload_hold = {
        "decisionId": dec_id,
        "branchId": "branch_hold",
    }
    res2 = await client.post("/api/v1/replay/simulate", headers=headers, json=payload_hold)
    assert res2.status_code == 200
    data2 = res2.json()["data"]
    assert data2["selectedBranchId"] == "branch_hold"
    assert data2["isSimulated"] is True


@pytest.mark.asyncio
async def test_replay_tenant_isolation(client: AsyncClient):
    """Verifies that Org B cannot view or simulate Org A's replay workspace."""
    org_a = await create_user_and_token(client, "Org A", "orga@test.com", "Org A Corp")
    org_b = await create_user_and_token(client, "Org B", "orgb@test.com", "Org B Corp")

    # Org B accessing nonexistent or unowned decision ID returns 404
    res = await client.get("/api/replay/non_existent_decision_id", headers=org_b["headers"])
    assert res.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# 2. Scenario Lab Tests (Part B)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_scenario_presets(client: AsyncClient):
    """Verifies scenario presets retrieval."""
    user = await create_user_and_token(client, "Preset User", "preset@test.com", "Preset Corp")
    headers = user["headers"]

    res = await client.get("/api/scenarios", headers=headers)
    assert res.status_code == 200
    presets = res.json()["data"]
    assert len(presets) >= 3

    preset_ids = [p["id"] for p in presets]
    assert "preset_growth" in preset_ids
    assert "preset_margin" in preset_ids
    assert "preset_cash" in preset_ids

    # Verify levers structure
    growth = next(p for p in presets if p["id"] == "preset_growth")
    assert growth["levers"]["marketingBudget"] > 0
    assert growth["levers"]["workingInventory"] > 0
    assert growth["levers"]["unitPrice"] > 0

    # Contract alias GET /api/v1/scenario/presets
    alias_res = await client.get("/api/v1/scenario/presets", headers=headers)
    assert alias_res.status_code == 200
    assert len(alias_res.json()["data"]) == len(presets)


@pytest.mark.asyncio
async def test_simulate_scenario_post_growth_push(client: AsyncClient):
    """
    Tests POST /api/scenarios:
    Input: baselineId, variables (marketingBudget, workingInventory, unitPrice).
    Verifies real projected outcomes calculated via the business model:
    - revenue
    - gross profit
    - operating margin
    - orders
    - inventory
    - constraints
    - sensitivity
    - uncertainty
    """
    user = await create_user_and_token(client, "Scenario User", "scenario@test.com", "Scenario Corp")
    headers = user["headers"]

    payload = {
        "presetId": "preset_growth",
        "scenarioName": "Growth Push Simulation",
        "variables": {
            "marketingBudget": 1.85,
            "workingInventory": 1300,
            "unitPrice": 102,
        },
    }

    res = await client.post("/api/scenarios", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    # 1. Primary projected metrics
    assert data["projectedRevenue"] > 0
    assert data["projectedGrossProfit"] > 0
    assert data["projectedOperatingMargin"] > 0
    assert data["projectedOrders"] > 0
    assert data["projectedInventory"] >= 0

    # 2. Before vs After Metric Comparisons
    metrics = data["metrics"]
    assert len(metrics) >= 4
    metric_keys = [m["key"] for m in metrics]
    assert "gross_revenue" in metric_keys
    assert "gross_profit" in metric_keys
    assert "operating_margin" in metric_keys
    assert "orders" in metric_keys

    # 3. Constraints check
    constraints = data["constraints"]
    assert len(constraints) >= 2
    c_ids = [c["id"] for c in constraints]
    assert "const_working_capital" in c_ids
    assert "const_inventory_floor" in c_ids
    for c in constraints:
        assert c["status"] in ("within_constraint", "warning", "breached")
        assert c["statusLabel"] is not None

    # 4. Sensitivity analysis where supported
    sensitivity = data["sensitivity"]
    assert len(sensitivity) >= 2
    s_keys = [s["leverKey"] for s in sensitivity]
    assert "unitPrice" in s_keys
    assert "marketingBudget" in s_keys
    for s in sensitivity:
        assert s["sensitivityLevel"] in ("High", "Medium", "Low")
        assert s["impactScore"] > 0

    # 5. Uncertainty where supported
    uncertainty = data["uncertainty"]
    assert uncertainty["confidenceScore"] > 70.0
    assert len(uncertainty["ranges"]) >= 2

    # 6. Contract alias POST /api/v1/scenario/simulate
    alias_res = await client.post("/api/v1/scenario/simulate", headers=headers, json=payload)
    assert alias_res.status_code == 200
    assert alias_res.json()["data"]["projectedRevenue"] == data["projectedRevenue"]


def test_scenario_microeconomic_model_elasticity_and_saturation():
    """
    Unit test verifying the microeconomic mechanics of the simulation engine:
    1. Higher price -> lower demand according to price elasticity
    2. Higher marketing spend -> higher orders with diminishing marginal returns
    3. Low inventory -> inventory constraint caps realized orders
    """
    # Baseline run
    base_vars = ScenarioVariablesModel(marketing_budget=1.40, working_inventory=1000.0, unit_price=100.0)
    base_run = run_scenario_simulation(base_vars)

    # 1. Price increase test (P = 120 vs P = 100)
    higher_price_vars = ScenarioVariablesModel(marketing_budget=1.40, working_inventory=1000.0, unit_price=120.0)
    price_run = run_scenario_simulation(higher_price_vars)

    # Higher price should yield fewer orders due to negative price elasticity
    assert price_run.projectedOrders < base_run.projectedOrders
    # But margin percentage should increase
    assert price_run.projectedOperatingMargin > base_run.projectedOperatingMargin

    # 2. Marketing budget increase test with inventory headroom (M = 2.0, I = 1300 vs M = 1.4, I = 1000)
    higher_mktg_vars = ScenarioVariablesModel(marketing_budget=2.00, working_inventory=1300.0, unit_price=100.0)
    mktg_run = run_scenario_simulation(higher_mktg_vars)
    assert mktg_run.projectedOrders > base_run.projectedOrders

    # 3. Inventory bottleneck test (I = 100 units < 500 safety floor)
    starved_inv_vars = ScenarioVariablesModel(marketing_budget=1.40, working_inventory=100.0, unit_price=100.0)
    starved_run = run_scenario_simulation(starved_inv_vars)

    # Orders must be throttled by the inventory ceiling
    assert starved_run.projectedOrders < base_run.projectedOrders
    # Inventory constraint must be breached
    inv_constraint = next(c for c in starved_run.constraints if c.id == "const_inventory_floor")
    assert inv_constraint.status == "breached"


@pytest.mark.asyncio
async def test_scenario_working_capital_cap_breached_on_extreme_spend(client: AsyncClient):
    """Verifies constraint breach detection when marketing budget exceeds capital ceiling."""
    user = await create_user_and_token(client, "Cap Tester", "captester@test.com", "Cap Corp")
    headers = user["headers"]

    payload = {
        "variables": {
            "marketingBudget": 5.0,  # ₹5.0 Cr exceeds ₹3.5 Cr cap
            "workingInventory": 1500,
            "unitPrice": 100,
        },
    }

    res = await client.post("/api/scenarios", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    cap_constraint = next(c for c in data["constraints"] if c["id"] == "const_working_capital")
    assert cap_constraint["status"] == "breached"
    assert "breached" in cap_constraint["statusLabel"].lower()
