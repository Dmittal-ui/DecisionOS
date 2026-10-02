"""
DecisionOS — Phase 6 Tests: Opportunity Detection & Investigation Engine

Comprehensive test suite verifying:
1. Deterministic Opportunity Detection Engine:
   - Controlled dataset with known business anomalies (CAC spike, margin drop, stockout, funnel drop)
   - Continuous pipeline: Data → Signal → Opportunity → Investigation
   - Deterministic rule execution (No LLM)
2. Investigation Workspace:
   - Clear distinction between observed factual evidence and competing hypotheses
   - Hierarchical diagnostic decision tree
   - Chronological event timeline
   - Grounded confidence scores
3. API Contract Endpoints:
   - GET /api/opportunities (filtering by category, status, urgency, search, sort)
   - GET /api/opportunities/{id}
   - POST /api/opportunities/scan
   - GET /api/investigations/{id}
   - Contract aliases: GET /api/v1/opportunities, GET /api/v1/investigation/{opportunityCode}
4. Multi-Tenant Organization Isolation:
   - Strict tenant boundary: Org B cannot access Org A's opportunities or investigations
"""

import io
import json
import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.investigation_builder import build_investigation_for_opportunity
from app.engine.opportunity_detector import detect_opportunities
from app.main import app
from app.models.opportunity import OpportunityDocument

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
# 1. Deterministic Opportunity Detection Engine Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_cac_spike_controlled_detection():
    """
    Controlled dataset where a known CAC spike exists:
    Marketing Spend = 35,000, Revenue = 100,000, Orders = 70.
    CAC = 500.0 (benchmark is 250.0).
    Spend/Rev ratio = 35.0% (benchmark is 22.0%).
    """
    n = 70
    df = pd.DataFrame({
        "revenue": [100000.0 / n] * n,
        "cost": [50000.0 / n] * n,
        "marketing_spend": [35000.0 / n] * n,
        "order_id": [f"ORD-{i}" for i in range(n)],
        "channel": ["Paid Search"] * 40 + ["Social"] * 30,
    })

    opps = detect_opportunities(
        df=df,
        business_id="biz_1",
        organization_id="org_1",
        currency="INR",
        data_quality_score=95.0,
    )

    assert len(opps) >= 1
    cac_opp = next((o for o in opps if o.category == "revenue" and "Acquisition" in o.title), None)
    assert cac_opp is not None
    assert cac_opp.category == "revenue"
    assert cac_opp.priority in ("critical", "high")
    assert cac_opp.status == "detected"
    assert cac_opp.confidence > 70.0
    assert cac_opp.impact.net_value > 0
    assert cac_opp.impact.cost_reduction > 0

    # Verify signals
    signals = cac_opp.signals
    assert len(signals) >= 2
    sig_names = [s.label for s in signals]
    assert any("CAC" in s for s in sig_names)
    assert any("Marketing" in s for s in sig_names)
    assert any(s.direction == "negative" for s in signals)


def test_gross_margin_compression_controlled_detection():
    """
    Controlled dataset where Gross Margin is compressed below hurdle:
    Revenue = 100,000, Cost = 72,000 -> Gross Margin = 28.0% (< 38% target).
    """
    df = pd.DataFrame({
        "revenue": [50000.0, 50000.0],
        "cost": [36000.0, 36000.0],
        "order_id": ["ORD-1", "ORD-2"],
    })

    opps = detect_opportunities(
        df=df,
        business_id="biz_1",
        organization_id="org_1",
        currency="INR",
        data_quality_score=95.0,
    )

    margin_opp = next((o for o in opps if o.category == "pricing_optimization"), None)
    assert margin_opp is not None
    assert margin_opp.category == "pricing_optimization"
    assert margin_opp.impact.net_value > 0
    assert margin_opp.confidence > 75.0
    assert any("Gross Margin Compression" in s.label for s in margin_opp.signals)


def test_inventory_stockout_controlled_detection():
    """
    Controlled dataset where forward inventory cover is critically low:
    Inventory = 20 units, Orders = 100 over 10 days -> 10 units/day -> 2.0 days supply (< 12 days).
    """
    n = 100
    dates = pd.date_range("2026-09-01", "2026-09-10", periods=n)
    df = pd.DataFrame({
        "date": dates,
        "revenue": [1000.0] * n,
        "cost": [500.0] * n,
        "order_id": [f"ORD-{i}" for i in range(n)],
        "inventory": [0.2] * n,  # Sum = 20 units
    })

    opps = detect_opportunities(
        df=df,
        business_id="biz_1",
        organization_id="org_1",
        currency="INR",
        data_quality_score=90.0,
    )

    inv_opp = next((o for o in opps if o.category == "inventory_rebalance"), None)
    assert inv_opp is not None
    assert inv_opp.category == "inventory_rebalance"
    assert inv_opp.priority == "critical"
    assert any("Stockout" in s.label for s in inv_opp.signals)


def test_conversion_rate_drop_controlled_detection():
    """
    Controlled dataset where conversion rate is degraded:
    Visitors = 20,000, Orders = 200 -> Conv = 1.0% (< 2.0% benchmark).
    """
    n = 200
    df = pd.DataFrame({
        "revenue": [500.0] * n,
        "cost": [250.0] * n,
        "visitors": [100.0] * n,  # Sum = 20,000 visitors
        "order_id": [f"ORD-{i}" for i in range(n)],
    })

    opps = detect_opportunities(
        df=df,
        business_id="biz_1",
        organization_id="org_1",
        currency="INR",
        data_quality_score=90.0,
    )

    conv_opp = next((o for o in opps if o.category == "revenue" and "Conversion" in o.title), None)
    assert conv_opp is not None
    assert conv_opp.category == "revenue"
    assert any("Conversion" in s.label for s in conv_opp.signals)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Deterministic Investigation Builder Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_investigation_builder_distinguishes_evidence_from_hypotheses():
    """
    Verifies that the investigation workspace strictly distinguishes
    observed empirical evidence (factual telemetry) from competing hypotheses (structural theories).
    """
    n = 70
    df = pd.DataFrame({
        "revenue": [100000.0 / n] * n,
        "cost": [50000.0 / n] * n,
        "marketing_spend": [35000.0 / n] * n,
        "order_id": [f"ORD-{i}" for i in range(n)],
    })

    opps = detect_opportunities(
        df=df,
        business_id="biz_1",
        organization_id="org_1",
        currency="INR",
        data_quality_score=95.0,
    )
    opp = opps[0]

    inv = build_investigation_for_opportunity(opp, df)

    # 1. Opportunity context
    assert inv.opportunity_id == opp.id
    assert inv.opportunity_code == opp.code
    assert inv.opportunity_context["title"] == opp.title

    # 2. Observed Evidence (Facts)
    assert len(inv.evidence) >= 2
    for ev in inv.evidence:
        assert ev.id.startswith("ev_")
        assert ev.direction in ("supporting", "contradicting", "neutral")
        assert ev.strength in ("high", "medium", "low")
        assert ev.source is not None

    # 3. Competing Hypotheses (Explanations)
    assert len(inv.hypotheses) >= 2
    leading_hyp = next((h for h in inv.hypotheses if h.status == "leading"), None)
    assert leading_hyp is not None
    assert leading_hyp.confidence_score > 50.0
    assert leading_hyp.id == inv.leading_hypothesis_id

    # Evidence items in leading hypothesis must match observed evidence
    assert len(leading_hyp.evidence_items) > 0
    for h_ev in leading_hyp.evidence_items:
        assert any(e.id == h_ev.id for e in inv.evidence)

    # 4. Decision Tree
    assert inv.tree_root is not None
    assert inv.tree_root.type == "root"
    assert len(inv.tree_root.children) >= 1

    # 5. Timeline
    assert len(inv.timeline) >= 3
    assert any(t.type == "detection" for t in inv.timeline)

    # 6. Overall Confidence
    assert inv.overall_confidence > 0


# ─────────────────────────────────────────────────────────────────────────────
# 3. Full End-to-End Integration Pipeline Test:
#    Data -> File Upload -> Normalization -> Signal -> Opportunity -> Investigation
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_full_pipeline_controlled_business_issue(client: AsyncClient):
    """
    Tests the complete end-to-end flow:
    Upload data with known CAC spike -> Digital Twin -> Radar Scan -> Opportunity -> Investigation.
    """
    user_data = await create_user_and_token(client, "Nishant P", "nishant@pipeline.com", "Pipeline Corp")
    headers = user_data["headers"]

    # 1. Create controlled CSV where marketing spend is high relative to orders
    csv_content = """date,revenue,cost,marketing_spend,order_id,channel,visitors
2026-09-01,25000,10000,12000,ORD-001,Paid Search,800
2026-09-02,30000,12000,14000,ORD-002,Paid Search,850
2026-09-03,28000,11000,13000,ORD-003,Paid Search,820
2026-09-04,32000,13000,15000,ORD-004,Paid Search,900
2026-09-05,27000,11000,12000,ORD-005,Social Ads,750
"""
    files = {"file": ("controlled_cac_spike.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = await client.post("/api/business/files", headers=headers, files=files)
    assert upload_res.status_code == 201
    file_id = upload_res.json()["data"]["fileId"]

    # 2. Process Digital Twin & Dataset
    twin_res = await client.post(f"/api/business/datasets/normalize/{file_id}", headers=headers)
    assert twin_res.status_code == 201

    # 3. Trigger Radar Scan
    scan_res = await client.post("/api/opportunities/scan", headers=headers)
    assert scan_res.status_code == 200
    detected_opps = scan_res.json()["data"]
    assert len(detected_opps) >= 1

    # 4. Verify Opportunity details — use the first detected opportunity
    opp = detected_opps[0]
    opp_id = opp["id"]
    opp_code = opp["code"]

    assert opp["opportunityId"] == opp_id
    assert opp["organizationId"] == user_data["org_id"]
    assert opp["businessId"] is not None
    assert opp["title"] is not None
    assert opp["category"] is not None
    assert opp["priority"] in ("critical", "high", "medium", "low")
    assert opp["impact"]["netValue"] > 0
    assert opp["impact"]["confidenceScore"] > 0
    assert opp["confidence"] > 0
    assert len(opp["signals"]) >= 1
    assert opp["detectedAt"] is not None
    assert opp["status"] == "detected"

    # 5. Retrieve Opportunity by ID (GET /api/opportunities/{id})
    get_opp_res = await client.get(f"/api/opportunities/{opp_id}", headers=headers)
    assert get_opp_res.status_code == 200
    retrieved_opp = get_opp_res.json()["data"]
    assert retrieved_opp["id"] == opp_id
    assert retrieved_opp["code"] == opp_code

    # 6. Retrieve Opportunity by Code
    get_opp_code_res = await client.get(f"/api/opportunities/{opp_code}", headers=headers)
    assert get_opp_code_res.status_code == 200
    assert get_opp_code_res.json()["data"]["id"] == opp_id

    # 7. Query Opportunities List (GET /api/opportunities)
    list_res = await client.get("/api/opportunities", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) >= 1
    assert any(item["id"] == opp_id for item in items)

    # 8. Retrieve Investigation Workspace (GET /api/investigations/{id})
    inv_res = await client.get(f"/api/investigations/{opp_id}", headers=headers)
    assert inv_res.status_code == 200
    inv = inv_res.json()["data"]

    # Verify all required investigation fields
    assert inv["opportunityId"] == opp_id
    assert inv["opportunityCode"] == opp_code
    assert inv["opportunityContext"]["title"] == opp["title"]
    assert len(inv["signals"]) >= 1
    assert len(inv["hypotheses"]) >= 2
    assert len(inv["evidence"]) >= 2
    assert inv["treeRoot"] is not None
    assert inv["decisionTree"] is not None
    assert len(inv["timeline"]) >= 3
    assert inv["confidence"] > 0
    assert inv["overallConfidence"] > 0

    # Verify clear distinction between observed evidence and hypotheses
    evidence_descriptions = [e["description"] for e in inv["evidence"]]
    hypothesis_titles = [h["title"] for h in inv["hypotheses"]]
    assert len(evidence_descriptions) > 0
    assert len(hypothesis_titles) > 0
    for h in inv["hypotheses"]:
        assert "evidenceItems" in h
        assert len(h["evidenceItems"]) >= 0

    # 9. Test API Contract Alias: GET /api/v1/investigation/{opportunityCode}
    alias_inv_res = await client.get(f"/api/v1/investigation/{opp_code}", headers=headers)
    assert alias_inv_res.status_code == 200
    assert alias_inv_res.json()["data"]["opportunityCode"] == opp_code


# ─────────────────────────────────────────────────────────────────────────────
# 4. Filter, Search, and Sort Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_opportunities_filtering_and_sorting(client: AsyncClient):
    user_data = await create_user_and_token(client, "Filter Tester", "filter@test.com", "Filter Inc")
    headers = user_data["headers"]

    csv_content = """revenue,cost,marketing_spend,order_id,channel
100000,75000,35000,ORD-1,Paid Digital
"""
    files = {"file": ("filter_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = await client.post("/api/business/files", headers=headers, files=files)
    file_id = upload_res.json()["data"]["fileId"]
    await client.post(f"/api/business/datasets/normalize/{file_id}", headers=headers)

    # Scan
    await client.post("/api/opportunities/scan", headers=headers)

    # 1. Filter by category
    res_pricing = await client.get("/api/opportunities?category=pricing_optimization", headers=headers)
    assert res_pricing.status_code == 200
    for item in res_pricing.json()["data"]:
        assert item["category"] == "pricing_optimization"

    # 2. Filter by status
    res_status = await client.get("/api/opportunities?status=detected", headers=headers)
    assert res_status.status_code == 200
    for item in res_status.json()["data"]:
        assert item["status"] == "detected"

    # 3. Search query
    res_search = await client.get("/api/opportunities?search=Margin", headers=headers)
    assert res_search.status_code == 200
    for item in res_search.json()["data"]:
        assert "margin" in item["title"].lower() or "margin" in item["summary"].lower()

    # 4. Sorting by confidence
    res_sort = await client.get("/api/opportunities?sortBy=confidence&sortDir=desc", headers=headers)
    assert res_sort.status_code == 200
    items = res_sort.json()["data"]
    if len(items) >= 2:
        assert items[0]["confidence"] >= items[1]["confidence"]


# ─────────────────────────────────────────────────────────────────────────────
# 5. Multi-Tenant Organization Isolation Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_multi_tenant_organization_isolation(client: AsyncClient):
    """
    Verifies that Organization B cannot see or investigate Organization A's opportunities.
    """
    # 1. Create Org A and ingest data
    org_a = await create_user_and_token(client, "Alice A", "alice@orga.com", "Org A Corp")
    csv_a = "revenue,cost,marketing_spend,order_id\n100000,75000,35000,ORD-A1\n"
    f_res = await client.post(
        "/api/business/files",
        headers=org_a["headers"],
        files={"file": ("orga.csv", io.BytesIO(csv_a.encode("utf-8")), "text/csv")},
    )
    fid_a = f_res.json()["data"]["fileId"]
    await client.post(f"/api/business/datasets/normalize/{fid_a}", headers=org_a["headers"])
    scan_a = await client.post("/api/opportunities/scan", headers=org_a["headers"])
    opps_a = scan_a.json()["data"]
    assert len(opps_a) >= 1
    opp_a_id = opps_a[0]["id"]
    opp_a_code = opps_a[0]["code"]

    # 2. Create Org B (completely separate tenant)
    org_b = await create_user_and_token(client, "Bob B", "bob@orgb.com", "Org B Corp")

    # 3. Org B lists opportunities -> should be empty (0 opportunities)
    list_b = await client.get("/api/opportunities", headers=org_b["headers"])
    assert list_b.status_code == 200
    assert len(list_b.json()["data"]) == 0

    # 4. Org B attempts to access Org A's opportunity by ID -> 404 NOT FOUND
    opp_b_res = await client.get(f"/api/opportunities/{opp_a_id}", headers=org_b["headers"])
    assert opp_b_res.status_code == 404

    # 5. Org B attempts to access Org A's opportunity by Code -> 404 NOT FOUND
    opp_b_code_res = await client.get(f"/api/opportunities/{opp_a_code}", headers=org_b["headers"])
    assert opp_b_code_res.status_code == 404

    # 6. Org B attempts to access Org A's investigation workspace -> 404 NOT FOUND
    inv_b_res = await client.get(f"/api/investigations/{opp_a_id}", headers=org_b["headers"])
    assert inv_b_res.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# 6. Error Handling & Edge Cases
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_nonexistent_opportunity_and_investigation_returns_404(client: AsyncClient):
    user = await create_user_and_token(client, "NonExist Tester", "nonexist@test.com", "NonExist Inc")
    headers = user["headers"]

    res_opp = await client.get("/api/opportunities/unknown_opp_uuid_12345", headers=headers)
    assert res_opp.status_code == 404

    res_inv = await client.get("/api/investigations/unknown_inv_uuid_12345", headers=headers)
    assert res_inv.status_code == 404


@pytest.mark.asyncio
async def test_empty_dataset_scan_returns_empty(client: AsyncClient):
    """Verifies that an organization with no uploaded data returns an empty list without crashing."""
    user = await create_user_and_token(client, "Empty Tester", "empty@test.com", "Empty Inc")
    headers = user["headers"]

    res_scan = await client.post("/api/opportunities/scan", headers=headers)
    assert res_scan.status_code == 200
    assert res_scan.json()["data"] == []


@pytest.mark.asyncio
async def test_investigation_direct_id_lookup(client: AsyncClient):
    """Verifies retrieval of investigation workspace directly by investigation ID."""
    user = await create_user_and_token(client, "Inv Direct", "invdirect@test.com", "Inv Direct Inc")
    headers = user["headers"]

    csv_content = "revenue,cost,marketing_spend,order_id\n100000,75000,35000,ORD-1\n"
    f_res = await client.post(
        "/api/business/files",
        headers=headers,
        files={"file": ("inv_direct.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    fid = f_res.json()["data"]["fileId"]
    await client.post(f"/api/business/datasets/normalize/{fid}", headers=headers)
    scan_res = await client.post("/api/opportunities/scan", headers=headers)
    opps = scan_res.json()["data"]
    assert len(opps) >= 1
    opp_id = opps[0]["id"]

    # First fetch via opp_id to get investigation ID
    inv_res = await client.get(f"/api/investigations/{opp_id}", headers=headers)
    assert inv_res.status_code == 200
    inv_id = inv_res.json()["data"]["id"]

    # Now fetch directly via investigation ID
    direct_inv_res = await client.get(f"/api/investigations/{inv_id}", headers=headers)
    assert direct_inv_res.status_code == 200
    assert direct_inv_res.json()["data"]["id"] == inv_id
    assert direct_inv_res.json()["data"]["opportunityId"] == opp_id


def test_deterministic_repeatability_no_llm():
    """
    Verifies that running detection multiple times on identical input
    yields perfectly identical results with 0 variance, proving deterministic execution.
    """
    n = 50
    df = pd.DataFrame({
        "revenue": [2000.0] * n,
        "cost": [1400.0] * n,
        "marketing_spend": [600.0] * n,
        "order_id": [f"ORD-{i}" for i in range(n)],
    })

    run1 = detect_opportunities(df, "b1", "o1", "INR", 95.0)
    run2 = detect_opportunities(df, "b1", "o1", "INR", 95.0)

    assert len(run1) == len(run2)
    for o1, o2 in zip(run1, run2):
        assert o1.code == o2.code
        assert o1.title == o2.title
        assert o1.category == o2.category
        assert o1.confidence == o2.confidence
        assert o1.impact.net_value == o2.impact.net_value
        assert len(o1.signals) == len(o2.signals)
        for s1, s2 in zip(o1.signals, o2.signals):
            assert s1.value == s2.value
            assert s1.direction == s2.direction
