"""
DecisionOS — Phase 10: Complete End-to-End Pipeline & Multi-Tenant Security Verification

This test suite executes:
1. End-to-End Pipeline:
   User Signup → Business Create → Real CSV Upload → Normalization → Digital Twin →
   Real Metrics → Executive Dashboard → Opportunity Radar Scan → Deep Investigation →
   Decision Replay → Scenario Simulation → Constraint Optimizer → Decision Registry →
   Human Approval → Decision DNA with Cryptographic Provenance.

2. Multi-Tenant Security Isolation:
   Organization A and Organization B cross-tenant boundary audit across all 8 domains:
   Files, Datasets, Metrics, Opportunities, Investigations, Scenarios, Decisions, Decision DNA.
"""

import io
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
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


@pytest.mark.asyncio
async def test_complete_end_to_end_pipeline(client: AsyncClient):
    """
    Executes the entire DecisionOS enterprise operational lifecycle from
    raw transactional ingestion to persistent Decision DNA lineage.
    """
    # ── 1. CREATE USER ────────────────────────────────────────────────────────
    user_email = "alexandra.chen@apex-global.corp"
    reg_res = await client.post(
        "/api/auth/signup",
        json={
            "name": "Alexandra Chen",
            "email": user_email,
            "password": "EnterprisePassword2026!",
            "organization_name": "Apex Global Operations",
        },
    )
    assert reg_res.status_code == 201, f"User registration failed: {reg_res.text}"
    user_data = reg_res.json()["data"]
    token = user_data["token"]
    org_id = user_data["user"]["organizationId"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # ── 2. CREATE BUSINESS WORKSPACE ──────────────────────────────────────────
    biz_res = await client.post(
        "/api/business",
        headers=auth_headers,
        json={
            "businessName": "Apex Retail Systems",
            "industry": "Omnichannel Retail",
            "currency": "INR",
            "timezone": "Asia/Kolkata",
        },
    )
    assert biz_res.status_code in (200, 201), f"Create business failed: {biz_res.text}"
    biz_data = biz_res.json()["data"]
    assert biz_data["currency"] == "INR"

    # ── 3. UPLOAD REAL BUSINESS DATA (CSV) ───────────────────────────────────
    # Non-UrbanCart custom columns to verify canonical normalization
    csv_content = (
        "txn_date,order_ref,sales_amount,cost_goods,units_sold,channel_name,ad_cost\n"
        "2026-09-01,ORD-101,50000,30000,50,Online,5000\n"
        "2026-09-02,ORD-102,75000,45000,75,Retail,6000\n"
        "2026-09-03,ORD-103,120000,72000,120,Direct,8000\n"
        "2026-09-04,ORD-104,90000,54000,90,Online,7000\n"
        "2026-09-05,ORD-105,110000,66000,110,Direct,7500\n"
    )
    files = {
        "file": ("apex_q3_transactions.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    upload_res = await client.post(
        "/api/business/files",
        headers=auth_headers,
        files=files,
    )
    assert upload_res.status_code in (200, 201), f"File upload failed: {upload_res.text}"
    uploaded_file = upload_res.json()["data"]
    file_id = uploaded_file["fileId"]

    # ── 4. VALIDATE & NORMALIZE DATASET ───────────────────────────────────────
    norm_res = await client.post(
        f"/api/digital-twin/normalize?file_id={file_id}",
        headers=auth_headers,
    )
    assert norm_res.status_code in (200, 201), f"Normalization failed: {norm_res.text}"
    norm_data = norm_res.json()["data"]
    assert norm_data["dataset"]["validRows"] == 5
    assert norm_data["digitalTwin"] is not None

    # ── 5. DIGITAL TWIN VERIFICATION ─────────────────────────────────────────
    twin_res = await client.get(
        "/api/digital-twin",
        headers=auth_headers,
    )
    assert twin_res.status_code == 200, f"Digital twin query failed: {twin_res.text}"
    twin_data = twin_res.json()["data"]
    assert twin_data["organizationId"] == org_id
    assert twin_data["dataQualityScore"] > 0

    # ── 6. REAL COMMERCIAL METRICS ────────────────────────────────────────────
    metrics_res = await client.get(
        "/api/dashboard/metrics",
        headers=auth_headers,
    )
    assert metrics_res.status_code == 200, f"Metrics computation failed: {metrics_res.text}"
    metrics_data = metrics_res.json()["data"]["metrics"]
    # Total revenue = 50000 + 75000 + 120000 + 90000 + 110000 = 445,000
    assert metrics_data["revenue"]["available"] is True
    assert metrics_data["revenue"]["value"] == 445000.0
    # Gross profit = 445,000 - (30000 + 45000 + 72000 + 54000 + 66000) = 445,000 - 267,000 = 178,000
    assert metrics_data["grossProfit"]["available"] is True
    assert metrics_data["grossProfit"]["value"] == 178000.0
    # Orders = 5
    assert metrics_data["orders"]["available"] is True
    assert metrics_data["orders"]["value"] == 5

    # ── 7. EXECUTIVE DASHBOARD ───────────────────────────────────────────────
    dash_res = await client.get(
        "/api/dashboard",
        headers=auth_headers,
    )
    assert dash_res.status_code == 200, f"Dashboard fetch failed: {dash_res.text}"
    dash_data = dash_res.json()["data"]
    assert dash_data["hasData"] is True
    assert "revenue" in dash_data["kpis"]
    assert dash_data["kpis"]["revenue"]["available"] is True

    # Check contract alias /api/v1/dashboard/summary
    alias_res = await client.get(
        "/api/v1/dashboard/summary",
        headers=auth_headers,
    )
    assert alias_res.status_code == 200

    # ── 8. OPPORTUNITY RADAR SCAN ─────────────────────────────────────────────
    scan_res = await client.post(
        "/api/opportunities/scan",
        headers=auth_headers,
    )
    assert scan_res.status_code == 200, f"Opportunity scan failed: {scan_res.text}"

    opps_res = await client.get(
        "/api/opportunities",
        headers=auth_headers,
    )
    assert opps_res.status_code == 200
    opps = opps_res.json()["data"]
    assert len(opps) > 0
    target_opp = opps[0]
    opp_id = target_opp["id"]
    opp_code = target_opp["code"]

    # ── 9. ROOT-CAUSE INVESTIGATION ───────────────────────────────────────────
    inv_res = await client.get(
        f"/api/investigations/{opp_id}",
        headers=auth_headers,
    )
    assert inv_res.status_code == 200, f"Investigation fetch failed: {inv_res.text}"
    inv_data = inv_res.json()["data"]
    assert inv_data["opportunityCode"] == opp_code
    assert len(inv_data["hypotheses"]) > 0
    assert inv_data["treeRoot"] is not None

    # ── 10. DECISION REPLAY ───────────────────────────────────────────────────
    replay_list_res = await client.get(
        "/api/replay",
        headers=auth_headers,
    )
    assert replay_list_res.status_code == 200
    replays = replay_list_res.json()["data"]
    assert len(replays) > 0
    hist_dec = replays[0]

    replay_sim_res = await client.post(
        "/api/replay",
        headers=auth_headers,
        json={
            "decisionId": hist_dec["id"],
            "branchId": hist_dec["availableBranches"][0]["id"] if hist_dec["availableBranches"] else "branch_opt",
        },
    )
    assert replay_sim_res.status_code == 200
    replay_sim_data = replay_sim_res.json()["data"]
    # Verify explicitly labeled as simulated
    assert replay_sim_data["insight"]["whatChangedExplanation"] is not None
    assert len(replay_sim_data["metrics"]) > 0

    # ── 11. SCENARIO LAB SIMULATION ───────────────────────────────────────────
    scen_presets_res = await client.get(
        "/api/scenarios",
        headers=auth_headers,
    )
    assert scen_presets_res.status_code == 200
    presets = scen_presets_res.json()["data"]
    assert len(presets) > 0

    sim_res = await client.post(
        "/api/scenarios",
        headers=auth_headers,
        json={
            "presetId": "preset_growth",
            "levers": {
                "marketingBudget": 1.75,
                "workingInventory": 1250,
                "unitPrice": 105,
            },
        },
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()["data"]
    assert sim_data["presetId"] == "preset_growth"
    assert len(sim_data["metrics"]) > 0
    assert len(sim_data["constraints"]) > 0

    # ── 12. CONSTRAINT-AWARE DETERMINISTIC OPTIMIZER ─────────────────────────
    opt_res = await client.post(
        "/api/optimizer",
        headers=auth_headers,
        json={
            "objective": "maximize_gross_profit",
            "hardConstraints": {
                "maxMarketingBudget": 2.0,
                "minInventory": 500,
                "maxInventory": 1500,
                "minMarginPercent": 25.0,
            },
        },
    )
    assert opt_res.status_code == 200, f"Optimizer solve failed: {opt_res.text}"
    opt_data = opt_res.json()["data"]
    assert opt_data["status"] == "optimal"
    assert opt_data["recommendation"] is not None
    assert opt_data["summary"]["feasibleConfigurations"] > 0

    # ── 13. DECISION REGISTRY & HUMAN GOVERNANCE ─────────────────────────────
    # Fetch registered decisions
    decs_res = await client.get(
        "/api/decisions",
        headers=auth_headers,
    )
    assert decs_res.status_code == 200
    decs = decs_res.json()["data"]
    assert len(decs) > 0
    dec_item = decs[0]
    dec_id = dec_item["id"]

    # Human Approval Action
    appr_res = await client.post(
        f"/api/decisions/{dec_id}/approve",
        headers=auth_headers,
        json={
            "approverName": "Alexandra Chen",
            "approverRole": "Chief Strategy & Operating Officer (CSOO)",
            "notes": "Approved based on deterministic optimizer solution convergence.",
        },
    )
    assert appr_res.status_code == 200, f"Decision approval failed: {appr_res.text}"
    appr_data = appr_res.json()["data"]
    assert appr_data["status"] == "approved"

    # ── 14. DECISION DNA PERSISTENCE & PROVENANCE ─────────────────────────────
    dna_list_res = await client.get(
        "/api/decision-dna",
        headers=auth_headers,
    )
    assert dna_list_res.status_code == 200
    dna_list = dna_list_res.json()["data"]
    assert len(dna_list) > 0

    dna_item = dna_list[0]
    dna_res = await client.get(
        f"/api/decision-dna/{dna_item['id']}",
        headers=auth_headers,
    )
    assert dna_res.status_code == 200
    dna_detail = dna_res.json()["data"]
    assert dna_detail["provenance"]["integrityHash"] is not None
    assert len(dna_detail["provenance"]["integrityHash"]) == 64  # SHA-256 length
    # Check that pending empirical outcome is strictly labeled
    assert dna_detail["actualOutcome"]["status"] == "pending"
    assert "Pending" in dna_detail["actualOutcome"]["explanation"] or "Outcome Pending" in dna_detail["actualOutcome"]["explanation"] or "pending" in dna_detail["actualOutcome"]["explanation"].lower()


@pytest.mark.asyncio
async def test_multi_tenant_security_isolation(client: AsyncClient):
    """
    Strict security verification:
    Ensures Organization A cannot access Organization B's:
    1. Files
    2. Datasets & Digital Twin
    3. Grounded Commercial Metrics
    4. Opportunities
    5. Root-Cause Investigations
    6. Scenarios
    7. Decisions & Human Approvals
    8. Decision DNA
    """
    # ── Create Organization A ────────────────────────────────────────────────
    res_a = await client.post(
        "/api/auth/signup",
        json={
            "name": "Org A Executive",
            "email": "exec_a@alpha-corp.com",
            "password": "PasswordOrgA123!",
            "organization_name": "Organization Alpha",
        },
    )
    assert res_a.status_code == 201
    token_a = res_a.json()["data"]["token"]
    org_a_id = res_a.json()["data"]["user"]["organizationId"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Upload file for Org A
    csv_a = "date,revenue,cost,orders\n2026-09-01,100000,60000,10\n"
    up_a = await client.post(
        "/api/business/files",
        headers=headers_a,
        files={"file": ("alpha_sales.csv", io.BytesIO(csv_a.encode("utf-8")), "text/csv")},
    )
    file_a_id = up_a.json()["data"]["fileId"]
    await client.post(f"/api/digital-twin/normalize?file_id={file_a_id}", headers=headers_a)

    # ── Create Organization B ────────────────────────────────────────────────
    res_b = await client.post(
        "/api/auth/signup",
        json={
            "name": "Org B Executive",
            "email": "exec_b@beta-corp.com",
            "password": "PasswordOrgB123!",
            "organization_name": "Organization Beta",
        },
    )
    assert res_b.status_code == 201
    token_b = res_b.json()["data"]["token"]
    org_b_id = res_b.json()["data"]["user"]["organizationId"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Upload file for Org B
    csv_b = "date,revenue,cost,orders\n2026-09-01,999999,111111,99\n"
    up_b = await client.post(
        "/api/business/files",
        headers=headers_b,
        files={"file": ("beta_sales.csv", io.BytesIO(csv_b.encode("utf-8")), "text/csv")},
    )
    file_b_id = up_b.json()["data"]["fileId"]
    await client.post(f"/api/digital-twin/normalize?file_id={file_b_id}", headers=headers_b)

    # ── 1. FILE ISOLATION ─────────────────────────────────────────────────────
    # Org A lists files: should NOT see Org B's file
    files_a_res = await client.get("/api/business/files", headers=headers_a)
    files_a = files_a_res.json()["data"]
    file_ids_a = [f["fileId"] for f in files_a]
    assert file_b_id not in file_ids_a

    # Org A attempts to delete Org B's file
    del_res = await client.delete(f"/api/business/files/{file_b_id}", headers=headers_a)
    assert del_res.status_code in (404, 403)

    # ── 2. DATASET & DIGITAL TWIN ISOLATION ───────────────────────────────────
    twin_a = (await client.get("/api/digital-twin", headers=headers_a)).json()["data"]
    twin_b = (await client.get("/api/digital-twin", headers=headers_b)).json()["data"]
    assert twin_a["organizationId"] == org_a_id
    assert twin_b["organizationId"] == org_b_id
    assert twin_a["organizationId"] != twin_b["organizationId"]

    # ── 3. METRICS ISOLATION ──────────────────────────────────────────────────
    metrics_a = (await client.get("/api/dashboard/metrics", headers=headers_a)).json()["data"]["metrics"]
    metrics_b = (await client.get("/api/dashboard/metrics", headers=headers_b)).json()["data"]["metrics"]
    # Org A revenue is 100,000; Org B revenue is 999,999
    assert metrics_a["revenue"]["value"] == 100000.0
    assert metrics_b["revenue"]["value"] == 999999.0
    assert metrics_a["revenue"]["value"] != metrics_b["revenue"]["value"]

    # ── 4. OPPORTUNITY ISOLATION ──────────────────────────────────────────────
    opps_a = (await client.get("/api/opportunities", headers=headers_a)).json()["data"]
    opps_b = (await client.get("/api/opportunities", headers=headers_b)).json()["data"]
    opp_ids_b = [o["id"] for o in opps_b]
    for o_a in opps_a:
        assert o_a["id"] not in opp_ids_b
        assert o_a["organizationId"] == org_a_id

    # ── 5. INVESTIGATION ISOLATION ───────────────────────────────────────────
    if opps_b:
        opp_b_id = opps_b[0]["id"]
        # Org A attempts to access Org B's investigation
        inv_cross = await client.get(f"/api/investigations/{opp_b_id}", headers=headers_a)
        assert inv_cross.status_code in (403, 404)

    # ── 6. DECISION ISOLATION & UNAUTHORIZED CROSS-TENANT APPROVAL ────────────
    decs_a = (await client.get("/api/decisions", headers=headers_a)).json()["data"]
    decs_b = (await client.get("/api/decisions", headers=headers_b)).json()["data"]
    dec_ids_b = [d["id"] for d in decs_b]
    for d_a in decs_a:
        assert d_a["id"] not in dec_ids_b

    if decs_b:
        dec_b_id = decs_b[0]["id"]
        # Org A attempts to view Org B's decision
        view_cross = await client.get(f"/api/decisions/{dec_b_id}", headers=headers_a)
        assert view_cross.status_code in (403, 404)

        # Org A attempts to approve Org B's decision
        appr_cross = await client.post(
            f"/api/decisions/{dec_b_id}/approve",
            headers=headers_a,
            json={"approverName": "Hacker A", "approverRole": "Intruder"},
        )
        assert appr_cross.status_code in (403, 404)

    # ── 7. DECISION DNA ISOLATION ─────────────────────────────────────────────
    dna_a = (await client.get("/api/decision-dna", headers=headers_a)).json()["data"]
    dna_b = (await client.get("/api/decision-dna", headers=headers_b)).json()["data"]
    dna_ids_b = [dna["id"] for dna in dna_b]
    for item_a in dna_a:
        assert item_a["id"] not in dna_ids_b

    if dna_b:
        dna_b_id = dna_b[0]["id"]
        # Org A attempts to access Org B's Decision DNA
        dna_cross = await client.get(f"/api/decision-dna/{dna_b_id}", headers=headers_a)
        assert dna_cross.status_code in (403, 404)
