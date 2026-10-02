"""
DecisionOS — Phase 3 Tests: Business Workspace & Real File Upload

Tests:
1. Business Workspace:
   - Create business (POST /api/business)
   - Duplicate business prevention (409 Conflict)
   - Get business (GET /api/business)
   - Get business before creation (404 Not Found)
   - Update business (PUT /api/business)
   - Unauthorized business operations (401 Unauthorized)
   - Business organization isolation
2. File Upload & Ingestion:
   - Upload CSV with row/column extraction
   - Upload XLSX with sheet/row/column extraction
   - Upload JSON array and object structures
   - Reject invalid file extensions (.pdf, .exe, etc.)
   - Reject empty files (0 bytes)
   - Unauthorized upload (401)
3. File Listing:
   - List files returns accurate count and metadata
4. Organization Isolation:
   - Org A and Org B upload separate files
   - Org A cannot see Org B's files in listing
   - Org B cannot see Org A's files in listing
   - Org B cannot delete Org A's file (403 Forbidden)
5. File Deletion:
   - Successful deletion of own file (disk and DB)
   - Deletion of non-existent file returns 404
"""

import io
import json
import pytest
import openpyxl
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
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
    """Helper to create user + organization and return access token + user details."""
    payload = {
        "name": name,
        "email": email,
        "password": "Password123!",
        "organization_name": org_name,
    }
    response = await client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201, f"Signup failed: {response.text}"
    data = response.json()["data"]
    return {
        "token": data["access_token"],
        "user": data["user"],
        "org_id": data["user"]["organization_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


def create_in_memory_xlsx(filename: str = "test.xlsx") -> tuple[str, bytes]:
    """Helper to create a real XLSX workbook in memory."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "SalesData"
    ws.append(["transaction_id", "product_name", "units", "revenue"])
    ws.append(["TX-101", "Wireless Earbuds", 5, 12500])
    ws.append(["TX-102", "Mechanical Keyboard", 2, 7800])
    ws.append(["TX-103", "USB-C Hub", 10, 4500])

    buf = io.BytesIO()
    wb.save(buf)
    return (filename, buf.getvalue())


# ─────────────────────────────────────────────────────────────────────────────
# 1. BUSINESS WORKSPACE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestBusinessWorkspace:
    """POST, GET, PUT /api/business"""

    async def test_create_business_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        payload = {
            "businessName": "UrbanCart Flagship",
            "industry": "E-Commerce",
            "currency": "INR",
            "timezone": "Asia/Kolkata",
        }
        res = await client.post("/api/business", json=payload, headers=user["headers"])
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert data["businessName"] == "UrbanCart Flagship"
        assert data["business_name"] == "UrbanCart Flagship"
        assert data["organizationId"] == user["org_id"]
        assert data["industry"] == "E-Commerce"
        assert data["currency"] == "INR"
        assert "businessId" in data
        assert "createdAt" in data

    async def test_create_business_duplicate_conflict(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        payload = {
            "businessName": "UrbanCart Flagship",
            "industry": "E-Commerce",
        }
        res1 = await client.post("/api/business", json=payload, headers=user["headers"])
        assert res1.status_code == 201

        # Second creation attempt for the same organization
        res2 = await client.post("/api/business", json=payload, headers=user["headers"])
        assert res2.status_code == 409
        assert res2.json()["detail"]["code"] == "CONFLICT"

    async def test_get_business_not_found(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        res = await client.get("/api/business", headers=user["headers"])
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "NOT_FOUND"

    async def test_get_business_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        payload = {
            "business_name": "UrbanCart Direct",
            "industry": "Direct-to-Consumer",
            "currency": "USD",
        }
        await client.post("/api/business", json=payload, headers=user["headers"])

        res = await client.get("/api/business", headers=user["headers"])
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["businessName"] == "UrbanCart Direct"
        assert data["industry"] == "Direct-to-Consumer"
        assert data["currency"] == "USD"

    async def test_update_business_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        await client.post("/api/business", json={"businessName": "Old Name", "industry": "Retail"}, headers=user["headers"])

        update_payload = {
            "businessName": "UrbanCart Omnichannel",
            "industry": "Modern Retail",
            "currency": "EUR",
        }
        res = await client.put("/api/business", json=update_payload, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["businessName"] == "UrbanCart Omnichannel"
        assert data["industry"] == "Modern Retail"
        assert data["currency"] == "EUR"

    async def test_business_unauthorized(self, client: AsyncClient):
        res_post = await client.post("/api/business", json={"businessName": "Test", "industry": "Tech"})
        assert res_post.status_code == 401

        res_get = await client.get("/api/business")
        assert res_get.status_code == 401

        res_put = await client.put("/api/business", json={"businessName": "Test"})
        assert res_put.status_code == 401

    async def test_business_organization_isolation(self, client: AsyncClient):
        org_a = await create_user_and_token(client, "User A", "a@org.com", "Org Alpha")
        org_b = await create_user_and_token(client, "User B", "b@org.com", "Org Beta")

        await client.post("/api/business", json={"businessName": "Alpha Store", "industry": "B2B"}, headers=org_a["headers"])
        await client.post("/api/business", json={"businessName": "Beta Market", "industry": "B2C"}, headers=org_b["headers"])

        res_a = await client.get("/api/business", headers=org_a["headers"])
        res_b = await client.get("/api/business", headers=org_b["headers"])

        assert res_a.json()["data"]["businessName"] == "Alpha Store"
        assert res_b.json()["data"]["businessName"] == "Beta Market"
        assert res_a.json()["data"]["organizationId"] != res_b.json()["data"]["organizationId"]


# ─────────────────────────────────────────────────────────────────────────────
# 2. FILE UPLOAD & VALIDATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestFileUpload:
    """POST /api/business/files"""

    async def test_upload_csv_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        csv_content = (
            "date,sku,price,units_sold,channel\n"
            "2026-09-01,SKU-A,1200,45,Amazon\n"
            "2026-09-02,SKU-B,850,30,Shopify\n"
            "2026-09-03,SKU-C,2400,12,QuickCommerce\n"
        ).encode("utf-8")

        files = {"file": ("daily_sales.csv", csv_content, "text/csv")}
        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["success"] is True
        data = body["data"]

        assert data["filename"] == "daily_sales.csv"
        assert data["fileType"] == "csv"
        assert data["file_type"] == "csv"
        assert data["size"] == len(csv_content)
        assert data["rowCount"] == 3
        assert data["columnCount"] == 5
        assert "sku" in data["columns"]
        assert data["processingStatus"] == "processed"
        assert data["organizationId"] == user["org_id"]
        assert "fileId" in data
        assert "uploadDate" in data

    async def test_upload_xlsx_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        filename, xlsx_bytes = create_in_memory_xlsx("quarterly_orders.xlsx")

        files = {"file": (filename, xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 201, res.text
        data = res.json()["data"]

        assert data["filename"] == "quarterly_orders.xlsx"
        assert data["fileType"] == "xlsx"
        assert data["rowCount"] == 3
        assert data["columnCount"] == 4
        assert "product_name" in data["columns"]
        assert data["processingStatus"] == "processed"

    async def test_upload_json_array_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        records = [
            {"customerId": "C01", "name": "Rohan Patel", "spend": 45000},
            {"customerId": "C02", "name": "Priya Sharma", "spend": 32000},
        ]
        json_bytes = json.dumps(records).encode("utf-8")

        files = {"file": ("customers.json", json_bytes, "application/json")}
        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 201, res.text
        data = res.json()["data"]

        assert data["filename"] == "customers.json"
        assert data["fileType"] == "json"
        assert data["rowCount"] == 2
        assert "customerId" in data["columns"]
        assert data["processingStatus"] == "processed"

    async def test_upload_json_object_success(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        dataset_obj = {
            "metadata": {"source": "CRM", "year": 2026},
            "data": [
                {"leadId": "L1", "status": "converted"},
                {"leadId": "L2", "status": "churned"},
                {"leadId": "L3", "status": "engaged"},
            ],
        }
        json_bytes = json.dumps(dataset_obj).encode("utf-8")

        files = {"file": ("crm_export.json", json_bytes, "application/json")}
        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 201, res.text
        data = res.json()["data"]

        assert data["filename"] == "crm_export.json"
        assert data["fileType"] == "json"
        assert data["rowCount"] == 3

    async def test_invalid_file_type_rejected(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        pdf_content = b"%PDF-1.4 Mock PDF binary data"
        files = {"file": ("business_plan.pdf", pdf_content, "application/pdf")}

        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 400
        assert "Unsupported file format" in res.json()["detail"]["message"]

    async def test_empty_file_rejected(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        files = {"file": ("empty.csv", b"", "text/csv")}

        res = await client.post("/api/business/files", files=files, headers=user["headers"])
        assert res.status_code == 400
        assert "empty" in res.json()["detail"]["message"].lower()

    async def test_unauthorized_upload(self, client: AsyncClient):
        files = {"file": ("test.csv", b"a,b\n1,2", "text/csv")}
        res = await client.post("/api/business/files", files=files)
        assert res.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 3. FILE LISTING, DELETION & ISOLATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestFileListingAndIsolation:
    """GET and DELETE /api/business/files"""

    async def test_file_listing_and_deletion(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")

        # Initially empty
        res_empty = await client.get("/api/business/files", headers=user["headers"])
        assert res_empty.status_code == 200
        assert res_empty.json()["data"] == []

        # Upload 2 files
        files1 = {"file": ("file1.csv", b"col1,col2\n10,20", "text/csv")}
        files2 = {"file": ("file2.csv", b"colA,colB\n100,200", "text/csv")}
        res1 = await client.post("/api/business/files", files=files1, headers=user["headers"])
        res2 = await client.post("/api/business/files", files=files2, headers=user["headers"])
        file1_id = res1.json()["data"]["fileId"]
        file2_id = res2.json()["data"]["fileId"]

        # List files
        res_list = await client.get("/api/business/files", headers=user["headers"])
        assert res_list.status_code == 200
        file_list = res_list.json()["data"]
        assert len(file_list) == 2
        file_ids = [f["fileId"] for f in file_list]
        assert file1_id in file_ids
        assert file2_id in file_ids

        # Delete file1
        res_del = await client.delete(f"/api/business/files/{file1_id}", headers=user["headers"])
        assert res_del.status_code == 200
        assert res_del.json()["data"]["deleted"] is True

        # Verify only file2 remains
        res_after = await client.get("/api/business/files", headers=user["headers"])
        remaining = res_after.json()["data"]
        assert len(remaining) == 1
        assert remaining[0]["fileId"] == file2_id

    async def test_file_organization_isolation(self, client: AsyncClient):
        """
        Verify:
        - Org A cannot see Org B's files.
        - Org B cannot see Org A's files.
        - Org B cannot delete Org A's file (403 Forbidden).
        """
        org_a = await create_user_and_token(client, "User A", "a@org.com", "Org Alpha")
        org_b = await create_user_and_token(client, "User B", "b@org.com", "Org Beta")

        # Org A uploads file_a
        files_a = {"file": ("alpha_sales.csv", b"revenue,units\n500000,100", "text/csv")}
        res_a = await client.post("/api/business/files", files=files_a, headers=org_a["headers"])
        file_a_id = res_a.json()["data"]["fileId"]

        # Org B uploads file_b
        files_b = {"file": ("beta_inventory.csv", b"sku,stock\nB1,400", "text/csv")}
        res_b = await client.post("/api/business/files", files=files_b, headers=org_b["headers"])
        file_b_id = res_b.json()["data"]["fileId"]

        # Org A lists files: must see file_a only
        list_a = await client.get("/api/business/files", headers=org_a["headers"])
        ids_seen_by_a = [f["fileId"] for f in list_a.json()["data"]]
        assert file_a_id in ids_seen_by_a
        assert file_b_id not in ids_seen_by_a

        # Org B lists files: must see file_b only
        list_b = await client.get("/api/business/files", headers=org_b["headers"])
        ids_seen_by_b = [f["fileId"] for f in list_b.json()["data"]]
        assert file_b_id in ids_seen_by_b
        assert file_a_id not in ids_seen_by_b

        # Org B tries to DELETE Org A's file: MUST FAIL with 403 Forbidden
        del_attempt = await client.delete(f"/api/business/files/{file_a_id}", headers=org_b["headers"])
        assert del_attempt.status_code == 403
        assert del_attempt.json()["detail"]["code"] == "FORBIDDEN"

        # Verify Org A's file is still intact
        list_a_again = await client.get("/api/business/files", headers=org_a["headers"])
        assert file_a_id in [f["fileId"] for f in list_a_again.json()["data"]]

    async def test_delete_nonexistent_file_returns_404(self, client: AsyncClient):
        user = await create_user_and_token(client, "Alex Chen", "alex@acme.com", "Acme Retail")
        res = await client.delete("/api/business/files/non-existent-uuid-999", headers=user["headers"])
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "NOT_FOUND"
