"""
DecisionOS — Phase 5 Tests: Real Metric Engine & Dashboard API

Tests:
1. Metric Engine deterministic math verification:
   - Revenue, Gross Profit, Gross Margin, Operating Margin
   - Orders, Average Order Value (AOV)
   - Inventory Value, Marketing Spend, Conversion Rate, CAC
   - Graceful fallback for missing columns (available=False with clear reason)
2. Dashboard API verification:
   - GET /api/dashboard (Full Executive Dashboard with KPIs, performance series, health)
   - GET /api/dashboard/metrics (10 deterministic commercial metrics)
   - GET /api/v1/dashboard/summary (Contract alias)
   - Empty state handling before data upload
   - Full pipeline trace: MongoDB -> Dataset -> Digital Twin -> Metric Engine -> Dashboard API
   - Multi-tenant organization isolation between Company A and Company B
"""

import io
import json
import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.metric_engine import MetricEngine, format_currency_value
from app.main import app

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


# ─────────────────────────────────────────────────────────────────────────────
# 1. METRIC ENGINE DETERMINISTIC MATH VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestMetricEngineCalculations:
    """Manual mathematical verification of all 10 core metrics."""

    def test_all_10_metrics_manual_calculation(self):
        # Known synthetic business dataset
        # 3 transactions:
        # Row 1: rev=50,000, cost=30,000, qty=10, mktg=4,000, visitors=500, inv=100, opex=2,000
        # Row 2: rev=100,000, cost=50,000, qty=20, mktg=6,000, visitors=1,000, inv=150, opex=3,000
        # Row 3: rev=150,000, cost=70,000, qty=30, mktg=10,000, visitors=1,500, inv=250, opex=5,000
        df = pd.DataFrame({
            "date": pd.to_datetime(["2026-09-01", "2026-09-02", "2026-09-03"]),
            "order_id": ["ORD-1", "ORD-2", "ORD-3"],
            "customer_id": ["CUST-1", "CUST-2", "CUST-3"],
            "channel": ["Shopify", "Amazon", "Shopify"],
            "revenue": [50000.0, 100000.0, 150000.0],
            "cost": [30000.0, 50000.0, 70000.0],
            "quantity": [10, 20, 30],
            "marketing_spend": [4000.0, 6000.0, 10000.0],
            "visitors": [500, 1000, 1500],
            "inventory": [100, 150, 250],
            "operating_expense": [2000.0, 3000.0, 5000.0],
        })

        engine = MetricEngine(df, currency="INR", data_quality_score=98.0)

        # 1. Revenue: 50k + 100k + 150k = 300,000
        rev = engine.calculate_revenue()
        assert rev.available is True
        assert rev.value == 300000.0
        assert "3.00 L" in rev.formatted_value or "300,000" in rev.formatted_value

        # 2. Gross Profit: 300k - (30k + 50k + 70k = 150k) = 150,000
        gp = engine.calculate_gross_profit()
        assert gp.available is True
        assert gp.value == 150000.0

        # 3. Gross Margin: 150k / 300k = 50.0%
        gm = engine.calculate_gross_margin()
        assert gm.available is True
        assert gm.value == 50.0
        assert gm.formatted_value == "50.0%"

        # 4. Operating Margin: (GP 150k - OPEX 10k = 140k operating income) / 300k = 46.67%
        op = engine.calculate_operating_margin()
        assert op.available is True
        assert op.value == 46.67
        assert "46.7%" in op.formatted_value

        # 5. Orders: 3 unique orders
        ord_m = engine.calculate_orders()
        assert ord_m.available is True
        assert ord_m.value == 3.0

        # 6. Average Order Value (AOV): 300,000 / 3 = 100,000
        aov = engine.calculate_aov()
        assert aov.available is True
        assert aov.value == 100000.0

        # 7. Inventory Value: total units = 500
        inv = engine.calculate_inventory_value()
        assert inv.available is True
        assert inv.value > 0

        # 8. Marketing Spend: 4k + 6k + 10k = 20,000
        mktg = engine.calculate_marketing_spend()
        assert mktg.available is True
        assert mktg.value == 20000.0

        # 9. Conversion Rate: 3 orders / 3000 visitors = 0.1%
        conv = engine.calculate_conversion_rate()
        assert conv.available is True
        assert conv.value == 0.1
        assert conv.formatted_value == "0.10%"

        # 10. CAC: 20,000 spend / 3 customers = 6,666.67
        cac = engine.calculate_cac()
        assert cac.available is True
        assert cac.value == 6666.67

    def test_missing_data_fallbacks_never_fabricate(self):
        """When optional columns are omitted, metrics return available=False with reasons."""
        minimal_df = pd.DataFrame({
            "revenue": [20000.0, 30000.0],
            "quantity": [2, 3],
        })

        engine = MetricEngine(minimal_df, currency="INR")

        assert engine.calculate_revenue().available is True
        assert engine.calculate_orders().available is True
        assert engine.calculate_aov().available is True

        # Omitted columns
        gp = engine.calculate_gross_profit()
        assert gp.available is False
        assert gp.value is None
        assert "cost" in gp.reason.lower()

        mktg = engine.calculate_marketing_spend()
        assert mktg.available is False
        assert mktg.value is None
        assert "marketing" in mktg.reason.lower()

        conv = engine.calculate_conversion_rate()
        assert conv.available is False
        assert conv.value is None
        assert "visitor" in conv.reason.lower()

        cac = engine.calculate_cac()
        assert cac.available is False
        assert cac.value is None
        assert "marketing" in cac.reason.lower()


# ─────────────────────────────────────────────────────────────────────────────
# 2. DASHBOARD API ENDPOINT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestDashboardEndpoints:
    """GET /api/dashboard, GET /api/dashboard/metrics, GET /api/v1/dashboard/summary"""

    async def test_dashboard_empty_state_before_upload(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan", "rohan@urbancart.in", "UrbanCart India")

        # 1. /api/dashboard before any dataset upload
        res_dash = await client.get("/api/dashboard", headers=user["headers"])
        assert res_dash.status_code == 200
        body = res_dash.json()
        assert body["success"] is True
        data = body["data"]
        assert data["hasData"] is False
        assert data["kpis"]["revenue"]["available"] is False

        # 2. /api/dashboard/metrics before any dataset upload
        res_metrics = await client.get("/api/dashboard/metrics", headers=user["headers"])
        assert res_metrics.status_code == 200
        metrics_data = res_metrics.json()["data"]["metrics"]
        assert metrics_data["revenue"]["available"] is False
        assert "upload" in metrics_data["revenue"]["reason"].lower()

    async def test_full_pipeline_to_dashboard_api(self, client: AsyncClient):
        """
        Verify:
        MongoDB -> Dataset -> Digital Twin -> Metric Engine -> Dashboard API
        """
        user = await create_user_and_token(client, "Alexandra", "alexandra@urbancart.in", "UrbanCart")

        # CSV with exact known figures
        # 4 orders, total revenue = 80,000, total cost = 40,000, marketing = 8,000, visitors = 400
        csv_content = (
            "sale_date,order_number,customer_id,channel,total_sales,qty,cost,ad_spend,visitors,stock,opex\n"
            "2026-09-20,ORD-1,C-1,Amazon,20000,5,10000,2000,100,50,1000\n"
            "2026-09-21,ORD-2,C-2,Shopify,30000,8,15000,3000,150,80,1500\n"
            "2026-09-22,ORD-3,C-3,QuickCommerce,10000,2,5000,1000,50,30,500\n"
            "2026-09-23,ORD-4,C-4,Amazon,20000,5,10000,2000,100,40,1000\n"
        ).encode("utf-8")

        # 1. Upload File
        up_res = await client.post(
            "/api/business/files",
            files={"file": ("urbancart_q3.csv", csv_content, "text/csv")},
            headers=user["headers"],
        )
        assert up_res.status_code == 201
        file_id = up_res.json()["data"]["fileId"]

        # 2. Normalize -> Store Dataset & Digital Twin
        norm_res = await client.post(f"/api/business/datasets/normalize/{file_id}", headers=user["headers"])
        assert norm_res.status_code == 201

        # 3. GET /api/dashboard/metrics
        metrics_res = await client.get("/api/dashboard/metrics", headers=user["headers"])
        assert metrics_res.status_code == 200
        metrics = metrics_res.json()["data"]["metrics"]

        # Verify all 10 metrics:
        assert metrics["revenue"]["value"] == 80000.0
        assert metrics["grossProfit"]["value"] == 40000.0
        assert metrics["grossMargin"]["value"] == 50.0
        assert metrics["operatingMargin"]["value"] == 45.0  # (40k GP - 4k OPEX) / 80k = 45%
        assert metrics["orders"]["value"] == 4.0
        assert metrics["averageOrderValue"]["value"] == 20000.0  # 80k / 4
        assert metrics["marketingSpend"]["value"] == 8000.0
        assert metrics["conversionRate"]["value"] == 1.0  # 4 / 400 * 100
        assert metrics["cac"]["value"] == 2000.0  # 8k / 4 customers
        assert metrics["inventoryValue"]["value"] > 0

        # 4. GET /api/dashboard
        dash_res = await client.get("/api/dashboard", headers=user["headers"])
        assert dash_res.status_code == 200
        dash = dash_res.json()["data"]

        assert dash["hasData"] is True
        assert dash["kpis"]["revenue"]["numericValue"] == 80000.0
        assert dash["kpis"]["grossProfit"]["numericValue"] == 40000.0
        assert dash["kpis"]["orders"]["numericValue"] == 4.0
        assert dash["businessHealthIndex"]["overallScore"] > 0

        # Check performance series contains daily aggregated points
        assert len(dash["performanceSeries"]["30D"]) == 4
        assert dash["performanceSeries"]["30D"][0]["revenue"] == 20000.0

        # Check multi-channel
        assert "Amazon" in dash["channels"]
        assert "Shopify" in dash["channels"]
        assert dash["channels"]["Amazon"]["revenue"] == 40000.0

        # 5. GET /api/v1/dashboard/summary (Contract Alias)
        summary_res = await client.get("/api/v1/dashboard/summary", headers=user["headers"])
        assert summary_res.status_code == 200
        assert summary_res.json()["data"]["kpis"]["revenue"]["numericValue"] == 80000.0

    async def test_dashboard_multi_tenant_isolation(self, client: AsyncClient):
        """Verify Org A and Org B receive only their own real calculations."""
        org_a = await create_user_and_token(client, "User A", "a@retail.com", "Company Alpha")
        org_b = await create_user_and_token(client, "User B", "b@retail.com", "Company Beta")

        csv_a = "total_sales,qty,cost\n500000,100,250000\n".encode("utf-8")
        csv_b = "total_sales,qty,cost\n75000,20,30000\n".encode("utf-8")

        # Org A upload & normalize
        up_a = await client.post("/api/business/files", files={"file": ("a.csv", csv_a, "text/csv")}, headers=org_a["headers"])
        await client.post(f"/api/business/datasets/normalize/{up_a.json()['data']['fileId']}", headers=org_a["headers"])

        # Org B upload & normalize
        up_b = await client.post("/api/business/files", files={"file": ("b.csv", csv_b, "text/csv")}, headers=org_b["headers"])
        await client.post(f"/api/business/datasets/normalize/{up_b.json()['data']['fileId']}", headers=org_b["headers"])

        # Query metrics
        dash_a = (await client.get("/api/dashboard/metrics", headers=org_a["headers"])).json()["data"]
        dash_b = (await client.get("/api/dashboard/metrics", headers=org_b["headers"])).json()["data"]

        # Org A sees 500,000 revenue & 250,000 gross profit
        assert dash_a["metrics"]["revenue"]["value"] == 500000.0
        assert dash_a["metrics"]["grossProfit"]["value"] == 250000.0

        # Org B sees 75,000 revenue & 45,000 gross profit
        assert dash_b["metrics"]["revenue"]["value"] == 75000.0
        assert dash_b["metrics"]["grossProfit"]["value"] == 45000.0
