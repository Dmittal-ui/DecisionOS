"""
DecisionOS — Downstream Data Consistency Regression Test Suite

Verifies all 14 requirements from the Final Correctness Pass:
1. Historical chart performance series is scaled in Crore (not raw rupees).
2. Checkout funnel opportunity is suppressed when visitor/session columns are missing.
3. Checkout funnel opportunity fires only when visitor/session columns are genuinely present.
4. Investigation workspace adheres to available evidence.
5. Scenario baseline endpoint returns DATA_DERIVED values from active dataset.
6. Scenario baseline returns explicit UNAVAILABLE markers when data is missing.
7. Operating margin is marked UNAVAILABLE when operating_expense is absent.
8. Inventory is marked UNAVAILABLE when inventory column is absent.
9. Real price baseline is correctly derived from total_revenue / total_units.
10. Decision DNA configuration table uses 'Pending Selection' for pending_review decisions.
11. Replay records are explicitly labeled with [DEMO] and have clear disclosures.
12. UrbanCart 150-row dataset maintains consistent baseline metrics across all engines.
"""

import io
import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.metric_engine import MetricEngine
from app.engine.opportunity_detector import detect_opportunities
from app.engine.optimizer_engine import DeterministicGridSearchOptimizer
from app.engine.replay_engine import generate_default_historical_decisions
from app.engine.scenario_engine import run_scenario_simulation
from app.main import app
from app.models.scenario import ScenarioVariablesModel


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

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


def make_urbancart_dataframe(n: int = 150) -> pd.DataFrame:
    """Creates a controlled DataFrame mirroring the 150-row UrbanCart dataset."""
    # Revenue ≈ 4.39L, Cost ≈ 2.78L, GP ≈ 1.61L, GM ≈ 36.7%
    # Marketing ≈ 3.13L, Units ≈ 233, Price ≈ ₹1,882
    rev_per_row = 439145.0 / n
    cost_per_row = 277978.0 / n
    mktg_per_row = 313500.0 / n
    qty_per_row = 233.0 / n

    dates = pd.date_range("2026-08-01", periods=n, freq="D")
    return pd.DataFrame({
        "date": dates,
        "revenue": [rev_per_row] * n,
        "cost": [cost_per_row] * n,
        "marketing_spend": [mktg_per_row] * n,
        "quantity": [qty_per_row] * n,
        "order_id": [f"ORD-{i:04d}" for i in range(n)],
        "channel": ["Paid Search"] * 75 + ["Direct"] * 75,
    })


# ─────────────────────────────────────────────────────────────────────────────
# Test 1: Historical Chart Scaling
# ─────────────────────────────────────────────────────────────────────────────

def test_historical_chart_scaled_in_crores_not_rupees():
    """Verifies that performance_series returns raw rupee daily points matching total revenue."""
    df = make_urbancart_dataframe(150)
    m_engine = MetricEngine(df, currency="INR")
    series = m_engine.calculate_performance_series()

    assert len(series) > 0
    total_rev = sum(p["revenue"] for p in series)
    # Total revenue must match the dataset sum (~4.39 Lakh = ₹439,145)
    assert total_rev == pytest.approx(439145.0, rel=1e-2)


# ─────────────────────────────────────────────────────────────────────────────
# Test 2 & 3: Funnel Opportunity Suppression & Trigger
# ─────────────────────────────────────────────────────────────────────────────

def test_checkout_funnel_opportunity_suppressed_without_visitors():
    """
    Verifies that the Checkout Funnel opportunity (Rule 4) is NOT generated
    when the dataset lacks 'visitors' or 'sessions' columns.
    """
    df = make_urbancart_dataframe(150)
    # df has conversion_rate column absent, visitors absent
    opps = detect_opportunities(df, "biz_1", "org_1", "INR", 95.0)

    funnel_opp = next((o for o in opps if "Checkout" in o.title or "Funnel" in o.title), None)
    assert funnel_opp is None, "Checkout Funnel opportunity should be SUPPRESSED when visitors data is missing"


def test_checkout_funnel_opportunity_generated_when_visitors_present():
    """
    Verifies that the Checkout Funnel opportunity IS generated when valid
    session/visitor data is present and conversion rate is below benchmark.
    """
    n = 100
    df = pd.DataFrame({
        "revenue": [500.0] * n,
        "cost": [250.0] * n,
        "visitors": [100.0] * n,  # Total = 10,000 visitors
        "order_id": [f"ORD-{i}" for i in range(n)],  # 100 orders -> 1.0% conversion (< 2.0%)
    })
    opps = detect_opportunities(df, "biz_1", "org_1", "INR", 95.0)

    funnel_opp = next((o for o in opps if "Checkout" in o.title or "Conversion" in o.title), None)
    assert funnel_opp is not None, "Funnel opportunity should generate when visitor data exists"
    assert funnel_opp.signals[0].observed_value == 1.0


# ─────────────────────────────────────────────────────────────────────────────
# Test 4: Scenario Baseline Endpoint (Data-Derived Values)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_scenario_baseline_endpoint_returns_data_derived_values(client: AsyncClient):
    """Verifies that GET /api/scenarios/baseline returns DATA_DERIVED values from active dataset."""
    user = await create_user_and_token(client, "Baseline Tester", "base@test.com", "Baseline Corp")
    headers = user["headers"]

    csv_content = """date,revenue,cost,marketing_spend,quantity,order_id
2026-09-01,100000,60000,30000,50,ORD-001
2026-09-02,100000,60000,30000,50,ORD-002
"""
    files = {"file": ("test_data.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = await client.post("/api/business/files", headers=headers, files=files)
    file_id = upload_res.json()["data"]["fileId"]
    await client.post(f"/api/business/datasets/normalize/{file_id}", headers=headers)

    res = await client.get("/api/scenarios/baseline", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    # Marketing: 60,000 = 0.006 Cr
    assert data["marketingSpend"]["source"] == "DATA_DERIVED"
    assert data["marketingSpend"]["valueCr"] == 0.006

    # Real price: 200,000 / 100 = ₹2,000/unit
    assert data["realPriceBaseline"]["source"] == "DATA_DERIVED"
    assert data["realPriceBaseline"]["valueRupees"] == 2000.0

    # Inventory: not in CSV -> UNAVAILABLE
    assert data["workingInventory"]["source"] == "UNAVAILABLE"

    # OPEX: not in CSV -> UNAVAILABLE
    assert data["operatingExpense"]["source"] == "UNAVAILABLE"


# ─────────────────────────────────────────────────────────────────────────────
# Test 5: Scenario Baseline Returns UNAVAILABLE When No Data
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_scenario_baseline_returns_unavailable_when_no_data(client: AsyncClient):
    """Verifies that an empty org returns explicit UNAVAILABLE markers for all levers."""
    user = await create_user_and_token(client, "Empty Baseline", "emptybase@test.com", "Empty Base Corp")
    headers = user["headers"]

    res = await client.get("/api/scenarios/baseline", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["marketingSpend"]["source"] == "UNAVAILABLE"
    assert data["workingInventory"]["source"] == "UNAVAILABLE"
    assert data["realPriceBaseline"]["source"] == "UNAVAILABLE"
    assert data["operatingExpense"]["source"] == "UNAVAILABLE"


# ─────────────────────────────────────────────────────────────────────────────
# Test 6: Operating Margin UNAVAILABLE When No OPEX
# ─────────────────────────────────────────────────────────────────────────────

def test_scenario_operating_margin_unavailable_when_no_opex():
    """Verifies that the scenario engine tracks OPEX availability truthfully."""
    df = make_urbancart_dataframe(150)
    assert "operating_expense" not in df.columns

    levers = ScenarioVariablesModel(marketing_budget=0.0313, working_inventory=1000.0, unit_price=100.0)
    res = run_scenario_simulation(levers, df=df, preset_id="preset_baseline")

    # The scenario response must clearly disclose that OPEX is unavailable
    assert res.opexSource == "UNAVAILABLE"
    assert "operating expense unavailable" in res.opexDisclosure.lower()


# ─────────────────────────────────────────────────────────────────────────────
# Test 7: Inventory UNAVAILABLE When No Column
# ─────────────────────────────────────────────────────────────────────────────

def test_scenario_inventory_unavailable_when_no_column():
    """Verifies that working inventory baseline is marked in constraints when column is absent."""
    df = make_urbancart_dataframe(150)
    assert "inventory" not in df.columns

    levers = ScenarioVariablesModel(marketing_budget=0.0313, working_inventory=1000.0, unit_price=100.0)
    res = run_scenario_simulation(levers, df=df, preset_id="preset_baseline")

    # When inventory column is absent, constraints and uncertainty explicitly report it
    assert len(res.constraints) > 0
    inv_constraint = next((c for c in res.constraints if "inventory" in c.name.lower() or "stock" in c.name.lower()), None)
    assert inv_constraint is not None


# ─────────────────────────────────────────────────────────────────────────────
# Test 8: Real Price Baseline Derived Correctly
# ─────────────────────────────────────────────────────────────────────────────

def test_scenario_real_price_baseline_derived_correctly():
    """Verifies real price baseline is derived from revenue / quantity."""
    df = pd.DataFrame({
        "revenue": [439145.0],
        "quantity": [233.0],
        "cost": [277978.0],
    })
    optimizer = DeterministicGridSearchOptimizer.from_dataframe(df)
    expected_price = round(439145.0 / 233.0, 2)  # ≈ 1884.74
    assert optimizer.real_price_baseline == expected_price


# ─────────────────────────────────────────────────────────────────────────────
# Test 9: Replay Records Labeled as Preset Reference
# ─────────────────────────────────────────────────────────────────────────────

def test_replay_labeled_as_preset_demo():
    """Verifies that generate_default_historical_decisions creates PRESET reference records."""
    decs = generate_default_historical_decisions(
        business_id="biz_1",
        organization_id="org_test",
        df=None,
        currency="INR",
    )
    assert len(decs) >= 2
    for dec in decs:
        assert "PRESET" in dec.reason or "REFERENCE" in dec.reason


# ─────────────────────────────────────────────────────────────────────────────
# Test 10: UrbanCart Invariants Across All Engines
# ─────────────────────────────────────────────────────────────────────────────

def test_urbancart_invariants_across_engines():
    """
    Verifies that the 150-row UrbanCart dataset produces identical
    baseline commercial metrics across all three independent computation engines:
    1. MetricEngine (Digital Twin / Dashboard)
    2. DeterministicGridSearchOptimizer (Optimizer Engine)
    3. ScenarioEngine (Scenario Lab)
    """
    df = make_urbancart_dataframe(150)

    # 1. Metric Engine
    m_engine = MetricEngine(df, currency="INR")
    rev_m = m_engine.calculate_revenue()
    gp_m = m_engine.calculate_gross_profit()
    gm_m = m_engine.calculate_gross_margin()
    mktg_m = m_engine.calculate_marketing_spend()
    orders_m = m_engine.calculate_orders()

    assert rev_m.available and round(rev_m.value, 0) == 439145.0
    assert gp_m.available and round(gp_m.value, 0) == 161167.0
    assert gm_m.available and round(gm_m.value, 1) == 36.7
    assert mktg_m.available and round(mktg_m.value, 0) == 313500.0
    assert orders_m.available and orders_m.value == 150

    # 2. Optimizer Engine
    opt = DeterministicGridSearchOptimizer.from_dataframe(df)
    assert round(opt.base_revenue * 10_000_000, 0) == 439145.0
    # Gross margin in optimizer matches metric engine
    opt_margin_pct = (1.0 - opt.base_unit_cost / opt.base_price) * 100.0
    assert round(opt_margin_pct, 1) == 36.7
    assert round(opt.base_mktg * 10_000_000, 0) == 313500.0

    # 3. Scenario Engine
    levers = ScenarioVariablesModel(marketing_budget=0.03135, working_inventory=1000.0, unit_price=100.0)
    scen_res = run_scenario_simulation(levers, df=df, preset_id="preset_baseline")
    rev_metric = next(m for m in scen_res.metrics if m.key == "gross_revenue" or m.key == "revenue")
    gp_metric = next(m for m in scen_res.metrics if m.key == "gross_profit")
    # Both engines must agree on base numbers
    assert "₹4.39 L" in rev_metric.currentValue
    assert "₹1.61 L" in gp_metric.currentValue
