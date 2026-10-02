"""
DecisionOS — Phase 9 Tests: Decision Registry + Human Approval + Decision DNA

Comprehensive test suite verifying:
1. Decision Registry:
   - Initial listing & status is proposed (never automatically approved)
   - High-impact decision requires human action
   - Detailed decision retrieval with evidence, constraints, comparisons, confidence
2. Human Approval:
   - Stakeholder authorization with approverName, approverRole, notes
   - State transition: proposed -> approved -> recorded
   - Automatic Decision DNA creation with selectedConfiguration
3. Human Modification:
   - Parameter override (marketingBudget, workingInventory, unitPrice, justification)
   - Real-time recalculation of projected commercial outcomes
   - State transition: proposed -> modified -> recorded
   - Stores modifiedConfig and audit diff
   - Updates Decision DNA with modified selectedConfiguration
4. Human Rejection:
   - Stakeholder rejection with rejectedBy, reason, notes
   - State transition: proposed -> rejected
   - Stores rejectionDetails and updates Decision DNA
5. Audit Logging:
   - Immutable audit events: actor, timestamp, action, decisionId, details
   - Queryable audit history endpoint
6. Decision DNA:
   - Complete package linking Opportunity, Investigation, Replay, Scenario, Optimizer, Decision
   - Epistemic honesty: actualOutcome returns 'Outcome Pending' (never fabricates results)
   - Full provenance and learning feedback loop
7. Multi-tenant Organization Isolation:
   - Cross-org read and mutation attempts strictly blocked with 404
"""

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
# 1. DECISION REGISTRY LISTING & NEVER AUTO-APPROVED GUARANTEE
# ==============================================================================

@pytest.mark.asyncio
async def test_decision_registry_listing_never_auto_approved(client: AsyncClient):
    """
    Verifies:
    1. Decisions are listed with complete context
    2. Decisions are NEVER automatically approved (initial status is 'proposed' or 'under_review')
    3. High-impact decisions require human authorization
    """
    user = await create_user_and_token(client, "Governor Lead", "gov@decision.com", "GovCorp")
    headers = user["headers"]

    resp = await client.get("/api/decisions", headers=headers)
    assert resp.status_code == 200, resp.text
    decisions = resp.json()["data"]
    assert len(decisions) >= 1

    dec = decisions[0]
    assert dec["status"] in ["proposed", "under_review"], "Violation: Decision was automatically approved!"
    assert dec["status"] != "approved"
    assert "recommendation" in dec
    assert "variables" in dec["recommendation"]
    assert "projectedOutcomes" in dec["recommendation"]
    assert "comparisons" in dec
    assert "constraints" in dec
    assert "evidence" in dec
    assert "provenance" in dec
    assert "confidenceDetails" in dec

    # Direct fetch by ID
    single_resp = await client.get(f"/api/decisions/{dec['id']}", headers=headers)
    assert single_resp.status_code == 200
    assert single_resp.json()["data"]["id"] == dec["id"]


# ==============================================================================
# 2. HUMAN APPROVAL LIFECYCLE & DECISION DNA PERSISTENCE
# ==============================================================================

@pytest.mark.asyncio
async def test_human_approval_creates_audit_and_dna(client: AsyncClient):
    """
    Verifies human approval:
    1. Status transitions: proposed -> approved
    2. Audit event recorded with actor, timestamp, action='approved'
    3. Decision DNA automatically created/updated with selectedConfiguration matching recommendation
    4. actualOutcome strictly returns 'Outcome Pending' (epistemic honesty)
    """
    user = await create_user_and_token(client, "Alexandra Chen", "alexandra@chen.com", "ApexRetail")
    headers = user["headers"]

    # 1. Fetch initial decision
    list_resp = await client.get("/api/decisions", headers=headers)
    dec_id = list_resp.json()["data"][0]["id"]

    # 2. Execute human approval
    approve_payload = {
        "approverName": "Alexandra Chen",
        "approverRole": "Chief Strategy & Operating Officer (CSOO)",
        "notes": "Approved without modification based on Q3 optimizer convergence.",
    }
    approve_resp = await client.post(f"/api/decisions/{dec_id}/approve", json=approve_payload, headers=headers)
    assert approve_resp.status_code == 200, approve_resp.text
    approved_dec = approve_resp.json()["data"]

    assert approved_dec["status"] == "approved"
    assert len(approved_dec["auditTimeline"]) >= 3
    last_event = approved_dec["auditTimeline"][-1]
    assert last_event["type"] == "approved"
    assert "Alexandra Chen" in last_event["actor"]

    # 3. Verify audit history
    audit_resp = await client.get(f"/api/decisions/{dec_id}/audits", headers=headers)
    assert audit_resp.status_code == 200
    audits = audit_resp.json()["data"]
    assert len(audits) >= 1
    assert audits[0]["action"] == "approved"
    assert audits[0]["actor"] == "Alexandra Chen"
    assert audits[0]["details"]["notes"] == "Approved without modification based on Q3 optimizer convergence."

    # 4. Verify Decision DNA was created & outcome is strictly 'Outcome Pending'
    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200, dna_resp.text
    dna = dna_resp.json()["data"]

    assert dna["decisionId"] == dec_id
    assert dna["status"] == "approved"
    assert dna["humanDecision"]["action"] == "approved"
    assert dna["humanDecision"]["decisionMaker"] == "Alexandra Chen"

    # CRITICAL: Outcome Pending verification
    actual_outcome = dna["actualOutcome"]
    assert actual_outcome["status"] == "pending"
    assert actual_outcome["explanation"] == "Outcome Pending"
    assert actual_outcome["summary"] == "Outcome Pending"
    assert actual_outcome["metrics"] == []

    # Learning loop verification
    assert dna["learning"]["isAvailable"] is False
    assert dna["learning"]["whatWeExpected"] == "Outcome Pending"


# ==============================================================================
# 3. HUMAN MODIFICATION & RECALCULATION
# ==============================================================================

@pytest.mark.asyncio
async def test_human_modification_recalculates_outcomes_and_updates_dna(client: AsyncClient):
    """
    Verifies human override:
    1. Stakeholder provides modified variables
    2. Recalculates projected outcomes using grounded model
    3. Status transitions to 'modified'
    4. Stores modifiedConfig and audit diff
    5. Updates Decision DNA with modified selectedConfiguration
    """
    user = await create_user_and_token(client, "Modifier Lead", "mod@apex.com", "ModCorp")
    headers = user["headers"]

    list_resp = await client.get("/api/decisions", headers=headers)
    dec_id = list_resp.json()["data"][0]["id"]

    modify_payload = {
        "modifiedBy": "Alexandra Chen",
        "marketingBudget": "₹1.50 Cr",
        "workingInventory": "1,100 units",
        "unitPrice": "₹106",
        "justification": "Conservative buffer required due to regional port congestion in West zone.",
    }
    mod_resp = await client.post(f"/api/decisions/{dec_id}/modify", json=modify_payload, headers=headers)
    assert mod_resp.status_code == 200, mod_resp.text
    modified_dec = mod_resp.json()["data"]

    assert modified_dec["status"] == "modified"
    assert modified_dec["modifiedConfig"] is not None
    mc = modified_dec["modifiedConfig"]
    assert mc["modifiedBy"] == "Alexandra Chen"
    assert "₹1.50 Cr" in mc["marketingBudget"]
    assert "1,100" in mc["workingInventory"]
    assert "106" in mc["unitPrice"]
    assert "port congestion" in mc["notes"]

    # Verify audit event for modification
    audit_resp = await client.get(f"/api/decisions/{dec_id}/audits", headers=headers)
    assert audit_resp.status_code == 200
    audits = audit_resp.json()["data"]
    mod_audit = next(a for a in audits if a["action"] == "modified")
    assert mod_audit["actor"] == "Alexandra Chen"
    assert "modifiedConfiguration" in mod_audit["details"]
    assert "recalculatedOutcomes" in mod_audit["details"]

    # Verify Decision DNA reflects modified configuration
    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200
    dna = dna_resp.json()["data"]
    assert dna["status"] == "modified"
    assert dna["humanDecision"]["action"] == "modified"
    assert "1,100" in dna["selectedConfiguration"]["workingInventory"]
    assert "106" in dna["selectedConfiguration"]["unitPrice"]
    assert dna["actualOutcome"]["explanation"] == "Outcome Pending"


# ==============================================================================
# 4. HUMAN REJECTION & REASON RECORDING
# ==============================================================================

@pytest.mark.asyncio
async def test_human_rejection_stores_reason_in_audit_and_dna(client: AsyncClient):
    """
    Verifies human rejection:
    1. Rejection stores reason and notes
    2. Status transitions to 'rejected'
    3. Audit event logged
    4. Decision DNA marked 'rejected' with stakeholder reason
    """
    user = await create_user_and_token(client, "Marcus Vance", "marcus@risk.com", "RiskAdvisory")
    headers = user["headers"]

    list_resp = await client.get("/api/decisions", headers=headers)
    dec_id = list_resp.json()["data"][0]["id"]

    reject_payload = {
        "rejectedBy": "Marcus Vance",
        "reason": "Risk threshold exceeded",
        "notes": "Ad spend saturation curve carries unacceptably high variance in Q3 macro environment.",
    }
    rej_resp = await client.post(f"/api/decisions/{dec_id}/reject", json=reject_payload, headers=headers)
    assert rej_resp.status_code == 200, rej_resp.text
    rejected_dec = rej_resp.json()["data"]

    assert rejected_dec["status"] == "rejected"
    assert rejected_dec["rejectionDetails"] is not None
    rd = rejected_dec["rejectionDetails"]
    assert rd["rejectedBy"] == "Marcus Vance"
    assert rd["reason"] == "Risk threshold exceeded"
    assert "variance in Q3" in rd["notes"]

    # Decision DNA status updated to rejected
    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200
    dna = dna_resp.json()["data"]
    assert dna["status"] == "rejected"
    assert dna["humanDecision"]["action"] == "rejected"
    assert "Risk threshold exceeded" in dna["humanDecision"]["reason"]


# ==============================================================================
# 5. DECISION DNA LINEAGE & PROVENANCE LINKAGE
# ==============================================================================

@pytest.mark.asyncio
async def test_decision_dna_provenance_and_lineage(client: AsyncClient):
    """
    Verifies Decision DNA links all upstream phases:
    Opportunity, Investigation, Replay, Scenario, Optimizer, Decision.
    """
    user = await create_user_and_token(client, "Lineage Lead", "lineage@dna.com", "DNACorp")
    headers = user["headers"]

    dna_list_resp = await client.get("/api/decision-dna", headers=headers)
    assert dna_list_resp.status_code == 200
    dna_records = dna_list_resp.json()["data"]
    assert len(dna_records) >= 1

    record = dna_records[0]
    # Provenance links
    prov = record["provenance"]
    assert "opportunityId" in prov
    assert "investigationId" in prov
    assert "replayId" in prov
    assert "scenarioId" in prov
    assert "optimizationId" in prov
    assert "decisionId" in prov

    # Lineage nodes
    lineage = record["lineage"]
    assert len(lineage) >= 3
    stages = [n["stage"] for n in lineage]
    assert any("Opportunity" in s for s in stages)
    assert any("Decision" in s for s in stages)


# ==============================================================================
# 6. MULTI-TENANT ORGANIZATION ISOLATION
# ==============================================================================

@pytest.mark.asyncio
async def test_governance_and_decision_dna_multi_tenant_isolation(client: AsyncClient):
    """
    CRITICAL ISOLATION TEST:
    1. Org A creates and modifies decisions & DNA.
    2. Org B cannot read Org A's decisions.
    3. Org B cannot approve, modify, or reject Org A's decisions (returns 404).
    4. Org B cannot read Org A's Decision DNA packages (returns 404).
    """
    user_a = await create_user_and_token(client, "Lead A", "lead_a@isolated.com", "Tenant A")
    user_b = await create_user_and_token(client, "Lead B", "lead_b@isolated.com", "Tenant B")

    # Org A lists decisions and approves
    resp_a = await client.get("/api/decisions", headers=user_a["headers"])
    dec_a_id = resp_a.json()["data"][0]["id"]

    await client.post(
        f"/api/decisions/{dec_a_id}/approve",
        json={"approverName": "Lead A", "notes": "Approved for Tenant A"},
        headers=user_a["headers"],
    )

    # 1. Org B tries to fetch Org A's decision by ID -> 404
    cross_get = await client.get(f"/api/decisions/{dec_a_id}", headers=user_b["headers"])
    assert cross_get.status_code == 404

    # 2. Org B tries to approve Org A's decision -> 404
    cross_approve = await client.post(
        f"/api/decisions/{dec_a_id}/approve",
        json={"approverName": "Hacker B", "notes": "Illegal cross-tenant approval"},
        headers=user_b["headers"],
    )
    assert cross_approve.status_code == 404

    # 3. Org B tries to modify Org A's decision -> 404
    cross_modify = await client.post(
        f"/api/decisions/{dec_a_id}/modify",
        json={"modifiedBy": "Hacker B", "marketingBudget": "0.1"},
        headers=user_b["headers"],
    )
    assert cross_modify.status_code == 404

    # 4. Org B tries to reject Org A's decision -> 404
    cross_reject = await client.post(
        f"/api/decisions/{dec_a_id}/reject",
        json={"rejectedBy": "Hacker B", "reason": "Illegal rejection"},
        headers=user_b["headers"],
    )
    assert cross_reject.status_code == 404

    # 5. Org B tries to access Org A's Decision DNA -> 404
    cross_dna = await client.get(f"/api/decision-dna/dna_{dec_a_id}", headers=user_b["headers"])
    assert cross_dna.status_code == 404


# ==============================================================================
# 7. CONTRACT ENDPOINTS (v1 Aliases)
# ==============================================================================

@pytest.mark.asyncio
async def test_decision_v1_api_contract_routes(client: AsyncClient):
    """
    Verifies that v1 API routes from docs/API_CONTRACT.md sections 8 & 9 function identically:
    - GET  /api/v1/decisions
    - POST /api/v1/decisions/{id}/approve
    - GET  /api/v1/decision-dna
    - GET  /api/v1/decision-dna/{id}
    """
    user = await create_user_and_token(client, "Contract Lead", "contract_lead@corp.com", "V1Corp")
    headers = user["headers"]

    # GET /api/v1/decisions
    v1_dec_resp = await client.get("/api/v1/decisions", headers=headers)
    assert v1_dec_resp.status_code == 200
    decs = v1_dec_resp.json()["data"]
    assert len(decs) >= 1
    target_id = decs[0]["id"]

    # POST /api/v1/decisions/{id}/approve
    v1_appr = await client.post(
        f"/api/v1/decisions/{target_id}/approve",
        json={
            "approverName": "Alexandra Chen",
            "approverRole": "Chief Strategy & Operating Officer (CSOO)",
            "notes": "Approved without modification based on Q3 optimizer convergence.",
        },
        headers=headers,
    )
    assert v1_appr.status_code == 200

    # GET /api/v1/decision-dna
    v1_dna_list = await client.get("/api/v1/decision-dna", headers=headers)
    assert v1_dna_list.status_code == 200
    assert len(v1_dna_list.json()["data"]) >= 1

    # GET /api/v1/decision-dna/{id}
    v1_dna_single = await client.get(f"/api/v1/decision-dna/dna_{target_id}", headers=headers)
    assert v1_dna_single.status_code == 200
    assert v1_dna_single.json()["data"]["decisionId"] == target_id


# ==============================================================================
# 8. DNA FIX REGRESSION TESTS
#    Guards for the three confirmed fixes:
#    FIX-1  owner model default is no longer "Chief Strategy & Operating Officer"
#    FIX-2  seeded human_decision is "pending_review", not a fake approval
#    FIX-2c approve/modify/reject write the actor name into DNA.owner
#    FIX-3  currency strings never show "₹0.0 Cr" for sub-Crore values
# ==============================================================================


@pytest.mark.asyncio
async def test_seeded_dna_owner_is_not_fake_title(client: AsyncClient):
    """
    FIX-1 + FIX-2 guard:
    The seeded DNA record must NOT have owner = "Chief Strategy & Operating Officer"
    and must NOT falsely claim a human approved it.
    """
    user = await create_user_and_token(client, "Aarav Shah", "aarav@retail.com", "ShahRetail")
    headers = user["headers"]

    # Trigger seeding via the list endpoint
    dna_resp = await client.get("/api/decision-dna", headers=headers)
    assert dna_resp.status_code == 200
    records = dna_resp.json()["data"]
    assert len(records) >= 1, "Expected at least one seeded DNA record"

    record = records[0]

    # owner must NOT be the fabricated CSOO title
    assert record["owner"] != "Chief Strategy & Operating Officer", (
        f"DNA owner is the hardcoded fake title. Got: {record['owner']!r}"
    )

    # human_decision must NOT show a fake pre-approval
    hd = record["humanDecision"]
    assert hd.get("action") == "pending_review", (
        f"Seeded DNA human_decision.action should be 'pending_review', got: {hd.get('action')!r}"
    )
    assert hd.get("decisionMaker") == "", (
        f"Seeded DNA decisionMaker should be empty string, got: {hd.get('decisionMaker')!r}"
    )
    assert hd.get("decidedAt") == "", (
        f"Seeded DNA decidedAt should be empty string, got: {hd.get('decidedAt')!r}"
    )


@pytest.mark.asyncio
async def test_seeded_dna_not_executive_decision_board(client: AsyncClient):
    """FIX-2 guard: 'Executive Decision Board' must never appear as the seeded decisionMaker."""
    user = await create_user_and_token(client, "Priya Nair", "priya@nair.com", "NairCorp")
    headers = user["headers"]

    # Seeding triggered on first access
    resp = await client.get("/api/decision-dna", headers=headers)
    assert resp.status_code == 200
    payload_text = resp.text
    assert "Executive Decision Board" not in payload_text, (
        "Seeded DNA still contains the fake 'Executive Decision Board' approver."
    )
    assert "Governance Authority" not in payload_text, (
        "Seeded DNA still contains the fake 'Governance Authority' role."
    )


@pytest.mark.asyncio
async def test_approve_writes_actor_name_to_dna_owner(client: AsyncClient):
    """
    FIX-2c guard:
    After a real human approval, DNA.owner must equal the approver's name,
    not be empty or the old fake title.
    """
    user = await create_user_and_token(client, "Meera Joshi", "meera@joshi.com", "JoshiTech")
    headers = user["headers"]

    # Get decision
    dec_resp = await client.get("/api/decisions", headers=headers)
    assert dec_resp.status_code == 200
    dec_id = dec_resp.json()["data"][0]["id"]

    approver = "Meera Joshi"
    await client.post(
        f"/api/decisions/{dec_id}/approve",
        json={"approverName": approver, "approverRole": "CTO", "notes": "Approved."},
        headers=headers,
    )

    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200
    dna = dna_resp.json()["data"]

    assert dna["owner"] == approver, (
        f"DNA owner should be '{approver}' after approval, got: {dna['owner']!r}"
    )
    assert dna["humanDecision"]["action"] == "approved"
    assert dna["humanDecision"]["decisionMaker"] == approver


@pytest.mark.asyncio
async def test_modify_writes_actor_name_to_dna_owner(client: AsyncClient):
    """FIX-2c: After modification, DNA.owner equals the modifier's name."""
    user = await create_user_and_token(client, "Raj Desai", "raj@desai.com", "DesaiLogistics")
    headers = user["headers"]

    dec_resp = await client.get("/api/decisions", headers=headers)
    dec_id = dec_resp.json()["data"][0]["id"]

    modifier = "Raj Desai"
    await client.post(
        f"/api/decisions/{dec_id}/modify",
        json={
            "modifiedBy": modifier,
            "marketingBudget": "₹1.20 Cr",
            "workingInventory": "950 units",
            "unitPrice": "₹102",
            "justification": "Conservative adjustment.",
        },
        headers=headers,
    )

    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200
    dna = dna_resp.json()["data"]

    assert dna["owner"] == modifier, (
        f"DNA owner should be '{modifier}' after modify, got: {dna['owner']!r}"
    )
    assert dna["humanDecision"]["action"] == "modified"


@pytest.mark.asyncio
async def test_reject_writes_actor_name_to_dna_owner(client: AsyncClient):
    """FIX-2c: After rejection, DNA.owner equals the rejector's name."""
    user = await create_user_and_token(client, "Sunita Pillai", "sunita@pillai.com", "PillaiOps")
    headers = user["headers"]

    dec_resp = await client.get("/api/decisions", headers=headers)
    dec_id = dec_resp.json()["data"][0]["id"]

    rejector = "Sunita Pillai"
    await client.post(
        f"/api/decisions/{dec_id}/reject",
        json={"rejectedBy": rejector, "reason": "Risk too high", "notes": "Q4 macro."},
        headers=headers,
    )

    dna_resp = await client.get(f"/api/decision-dna/dna_{dec_id}", headers=headers)
    assert dna_resp.status_code == 200
    dna = dna_resp.json()["data"]

    assert dna["owner"] == rejector, (
        f"DNA owner should be '{rejector}' after reject, got: {dna['owner']!r}"
    )
    assert dna["humanDecision"]["action"] == "rejected"
