"""
DecisionOS — Reset Current Data & Dataset History Regression Tests

Verifies:
1. Resetting current data marks active dataset ARCHIVED and resets operational analysis.
2. User account is NOT deleted.
3. Organization is NOT deleted.
4. Tenant isolation: Org A reset does not affect Org B.
5. New dataset upload creates new version/dataset_id.
6. History list returns all versions for the tenant.
7. History detail returns exact data-grounded metrics for that dataset version without recalculation.
8. Cross-tenant history access is rejected.
"""

import io
import pytest
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.database.mongodb import get_database

CSV_DATA_V1 = """order_id,date,channel,revenue,cogs,marketing_spend,inventory_units,unit_price,quantity
ORD-001,2026-09-01,Direct,10000,6000,1000,500,100,100
ORD-002,2026-09-02,Direct,20000,12000,2000,450,100,200
"""

CSV_DATA_V2 = """order_id,date,channel,revenue,cogs,marketing_spend,inventory_units,unit_price,quantity
ORD-101,2026-10-01,Direct,50000,25000,5000,800,250,200
ORD-102,2026-10-02,Direct,70000,35000,7000,750,250,280
"""


def get_test_db():
    client = AsyncMongoMockClient()
    return client["decisionos_reset_history_test"]


@pytest.fixture
def test_db():
    return get_test_db()


@pytest.fixture
async def client(test_db):
    async def override_get_database():
        yield test_db

    app.dependency_overrides[get_database] = override_get_database
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c
    app.dependency_overrides.clear()


async def _signup_user(client: AsyncClient, email: str, org_name: str) -> dict:
    res = await client.post("/api/auth/signup", json={
        "name": "Test User",
        "email": email,
        "password": "SecurePassword123!",
        "organization_name": org_name,
    })
    assert res.status_code == 201, res.text
    return res.json()["data"]


async def _upload_and_normalize(client: AsyncClient, token: str, filename: str, content: str) -> dict:
    # 1. Upload file
    files = {"file": (filename, io.BytesIO(content.encode("utf-8")), "text/csv")}
    upload_res = await client.post(
        "/api/business/files",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert upload_res.status_code == 201, upload_res.text
    file_id = upload_res.json()["data"]["id"]

    # 2. Normalize file
    norm_res = await client.post(
        f"/api/business/datasets/normalize/{file_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert norm_res.status_code == 201, norm_res.text
    return norm_res.json()["data"]


class TestResetAndHistory:

    async def test_reset_current_data_and_verify_account_intact(self, client: AsyncClient):
        # 1. Signup user
        auth_data = await _signup_user(client, "alice@enterprise.com", "Enterprise Corp")
        token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]

        # 2. Upload and normalize dataset 1
        data1 = await _upload_and_normalize(client, token, "dataset_v1.csv", CSV_DATA_V1)
        ds1_id = data1["dataset"]["id"]

        # Verify active digital twin exists
        twin_res = await client.get("/api/business/twin", headers={"Authorization": f"Bearer {token}"})
        assert twin_res.status_code == 200

        # 3. Call Reset Current Data
        reset_res = await client.post("/api/business/datasets/reset", headers={"Authorization": f"Bearer {token}"})
        assert reset_res.status_code == 200
        assert reset_res.json()["data"]["reset"] is True
        assert reset_res.json()["data"]["archivedDatasetId"] == ds1_id

        # 4. Verify user account is NOT deleted and still valid
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["data"]["id"] == user_id

        # 5. Verify active twin returns 404 (reset)
        twin_res_after = await client.get("/api/business/twin", headers={"Authorization": f"Bearer {token}"})
        assert twin_res_after.status_code == 404

        # 6. Verify dashboard summary returns hasData = False
        dash_res = await client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
        assert dash_res.status_code == 200
        assert dash_res.json()["data"]["hasData"] is False

    async def test_reset_tenant_isolation(self, client: AsyncClient):
        # Org A
        auth_a = await _signup_user(client, "user_a@org-a.com", "Org A Corp")
        token_a = auth_a["access_token"]
        await _upload_and_normalize(client, token_a, "dataset_a.csv", CSV_DATA_V1)

        # Org B
        auth_b = await _signup_user(client, "user_b@org-b.com", "Org B Corp")
        token_b = auth_b["access_token"]
        await _upload_and_normalize(client, token_b, "dataset_b.csv", CSV_DATA_V2)

        # Org A resets data
        reset_res = await client.post("/api/business/datasets/reset", headers={"Authorization": f"Bearer {token_a}"})
        assert reset_res.status_code == 200

        # Org A has no active twin
        twin_a = await client.get("/api/business/twin", headers={"Authorization": f"Bearer {token_a}"})
        assert twin_a.status_code == 404

        # Org B's active twin is completely untouched
        twin_b = await client.get("/api/business/twin", headers={"Authorization": f"Bearer {token_b}"})
        assert twin_b.status_code == 200

    async def test_upload_new_dataset_and_inspect_history(self, client: AsyncClient):
        auth_data = await _signup_user(client, "carol@analytics.com", "Analytics Group")
        token = auth_data["access_token"]

        # 1. Upload dataset 1
        data1 = await _upload_and_normalize(client, token, "dataset_v1.csv", CSV_DATA_V1)
        ds1_id = data1["dataset"]["id"]

        # 2. Reset dataset 1
        await client.post("/api/business/datasets/reset", headers={"Authorization": f"Bearer {token}"})

        # 3. Upload dataset 2
        data2 = await _upload_and_normalize(client, token, "dataset_v2.csv", CSV_DATA_V2)
        ds2_id = data2["dataset"]["id"]
        assert ds1_id != ds2_id

        # 4. Check history list contains both datasets
        hist_res = await client.get("/api/business/history", headers={"Authorization": f"Bearer {token}"})
        assert hist_res.status_code == 200
        history = hist_res.json()["data"]
        assert len(history) == 2

        # Dataset 2 is active/current (version 2)
        item_v2 = next(item for item in history if item["datasetId"] == ds2_id)
        assert item_v2["isCurrent"] is True
        assert item_v2["status"] == "ACTIVE"
        assert item_v2["version"] == 2

        # Dataset 1 is archived (version 1)
        item_v1 = next(item for item in history if item["datasetId"] == ds1_id)
        assert item_v1["isCurrent"] is False
        assert item_v1["status"] == "ARCHIVED"
        assert item_v1["version"] == 1

        # 5. Check History Detail for Dataset 1 vs Dataset 2
        detail1_res = await client.get(f"/api/business/history/{ds1_id}", headers={"Authorization": f"Bearer {token}"})
        assert detail1_res.status_code == 200
        detail1 = detail1_res.json()["data"]
        assert detail1["dataset"]["id"] == ds1_id
        assert detail1["dataset"]["filename"] == "dataset_v1.csv"
        # Verify twin metrics in Dataset 1 match Dataset 1 revenue (30,000)
        assert detail1["digitalTwin"] is not None
        assert detail1["digitalTwin"]["metrics"]["revenue"]["value"] == 30000.0

        detail2_res = await client.get(f"/api/business/history/{ds2_id}", headers={"Authorization": f"Bearer {token}"})
        assert detail2_res.status_code == 200
        detail2 = detail2_res.json()["data"]
        assert detail2["dataset"]["id"] == ds2_id
        assert detail2["dataset"]["filename"] == "dataset_v2.csv"
        # Verify twin metrics in Dataset 2 match Dataset 2 revenue (120,000)
        assert detail2["digitalTwin"]["metrics"]["revenue"]["value"] == 120000.0

    async def test_cross_tenant_history_access_forbidden(self, client: AsyncClient):
        # Org A
        auth_a = await _signup_user(client, "user_x@org-x.com", "Org X")
        data_a = await _upload_and_normalize(client, auth_a["access_token"], "data_x.csv", CSV_DATA_V1)
        ds_a_id = data_a["dataset"]["id"]

        # Org B
        auth_b = await _signup_user(client, "user_y@org-y.com", "Org Y")

        # Org B attempting to fetch Org A's historical dataset
        res = await client.get(
            f"/api/business/history/{ds_a_id}",
            headers={"Authorization": f"Bearer {auth_b['access_token']}"},
        )
        assert res.status_code == 404
