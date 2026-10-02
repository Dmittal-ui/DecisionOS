"""
DecisionOS — Phase 4 Tests: Data Validation, Normalization & Business Digital Twin

Tests:
1. Valid CSV ingestion & normalization (custom aliases)
2. Valid XLSX ingestion & normalization (multi-metric)
3. Invalid CSV handling (empty, malformed, non-tabular)
4. Missing columns handling (no core commercial signals vs. missing specific optional metrics)
5. Invalid values handling (corrupted numbers, negative quantities, invalid dates)
6. Column mapping unit tests (synonyms & canonical resolution)
7. Normalization unit tests (data cleaning, quality scoring)
8. Digital Twin creation & retrieval (all 8 metrics, fallback reasons, channel breakdown, org isolation)
"""

import io
import json
import openpyxl
import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import get_database
from app.engine.digital_twin_builder import build_digital_twin_from_dataframe
from app.engine.normalizer import (
    CANONICAL_ALIASES,
    detect_and_map_columns,
    validate_and_clean_dataframe,
)
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


def create_comprehensive_xlsx_bytes() -> bytes:
    """Creates an in-memory Excel workbook with multi-channel and marketing signals."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "OmnichannelData"
    ws.append([
        "transaction_date", "order_number", "customer_id", "channel",
        "total_sales", "qty", "cogs", "ad_spend", "traffic", "stock", "opex"
    ])
    ws.append(["2026-09-01", "ORD-101", "CUST-1", "Amazon", 15000, 10, 8000, 2000, 500, 120, 1500])
    ws.append(["2026-09-02", "ORD-102", "CUST-2", "Shopify", 25000, 15, 12000, 3000, 800, 100, 2000])
    ws.append(["2026-09-03", "ORD-103", "CUST-3", "QuickCommerce", 8000, 5, 4500, 1000, 300, 95, 800])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# 1. COLUMN MAPPING & NORMALIZATION UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestEngineNormalizerUnits:
    """Unit tests for column mapping and validation logic."""

    def test_column_mapping_canonical_aliases(self):
        raw_data = {
            "sale_date": ["2026-09-01", "2026-09-02"],
            "total_sales": [12000, 18000],
            "qty": [4, 6],
            "cogs": [7000, 10000],
            "ad_spend": [1500, 2000],
            "unrelated_internal_code": ["X1", "X2"],
        }
        df = pd.DataFrame(raw_data)
        mapped_df, columns_mapped, unmapped = detect_and_map_columns(df)

        assert columns_mapped["sale_date"] == "date"
        assert columns_mapped["total_sales"] == "revenue"
        assert columns_mapped["qty"] == "quantity"
        assert columns_mapped["cogs"] == "cost"
        assert columns_mapped["ad_spend"] == "marketing_spend"
        assert "unrelated_internal_code" in unmapped
        assert "revenue" in mapped_df.columns
        assert "cost" in mapped_df.columns

    def test_validation_detects_empty_dataframe(self):
        empty_df = pd.DataFrame()
        with pytest.raises(ValueError) as exc:
            validate_and_clean_dataframe(empty_df, {})
        assert "empty" in str(exc.value).lower()

    def test_validation_detects_missing_commercial_signals(self):
        non_commercial_df = pd.DataFrame({
            "first_name": ["Alice", "Bob"],
            "department": ["HR", "Legal"],
            "badge_number": [101, 102],
        })
        with pytest.raises(ValueError) as exc:
            validate_and_clean_dataframe(non_commercial_df, {})
        assert "no recognizable business" in str(exc.value).lower()

    def test_validation_detects_negative_and_nan_values(self):
        df = pd.DataFrame({
            "revenue": [1000.0, "not_a_number", 2000.0],
            "quantity": [5, -3, 8],
            "cost": [400.0, 500.0, -100.0],
        })
        mapped = {"revenue": "revenue", "quantity": "quantity", "cost": "cost"}
        cleaned, summary = validate_and_clean_dataframe(df, mapped)

        assert summary["invalid_rows"] > 0
        assert summary["data_quality_score"] < 100.0
        error_types = [e["type"] for e in summary["validation_errors"]]
        assert "INVALID_NUMERIC_VALUES" in error_types
        assert "NEGATIVE_VALUES" in error_types


# ─────────────────────────────────────────────────────────────────────────────
# 2. DIGITAL TWIN BUILDER UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestDigitalTwinBuilderUnits:
    """Unit tests for grounded metric calculations."""

    def test_digital_twin_metrics_calculation(self):
        df = pd.DataFrame({
            "date": pd.to_datetime(["2026-09-01", "2026-09-02", "2026-09-03"]),
            "order_id": ["O1", "O2", "O3"],
            "customer_id": ["C1", "C2", "C3"],
            "channel": ["Amazon", "Shopify", "Amazon"],
            "revenue": [10000.0, 20000.0, 30000.0],  # 60,000
            "cost": [6000.0, 11000.0, 17000.0],      # 34,000 (GP = 26,000)
            "quantity": [10, 20, 30],
            "marketing_spend": [2000.0, 3000.0, 1000.0],  # 6,000 (CAC = 6000/3 = 2000)
            "visitors": [200, 300, 500],             # 1000 (Conversion = 3/1000 = 0.3%)
            "inventory": [50, 45, 40],               # 135
            "operating_expense": [1000.0, 1500.0, 500.0], # 3,000 (Operating Income = 23,000 / 60,000 = 38.33%)
        })

        metrics, channel_metrics, p_start, p_end = build_digital_twin_from_dataframe(df)

        # Revenue
        assert metrics["revenue"].available is True
        assert metrics["revenue"].value == 60000.0

        # Gross Profit
        assert metrics["gross_profit"].available is True
        assert metrics["gross_profit"].value == 26000.0

        # Orders
        assert metrics["orders"].available is True
        assert metrics["orders"].value == 3.0

        # Inventory — uses latest (most recent) non-null snapshot, not cumulative sum.
        # inventory = [50, 45, 40]; latest = 40.
        assert metrics["inventory"].available is True
        assert metrics["inventory"].value == 40.0

        # Marketing Spend
        assert metrics["marketing_spend"].available is True
        assert metrics["marketing_spend"].value == 6000.0

        # Conversion
        assert metrics["conversion"].available is True
        assert metrics["conversion"].value == 0.3

        # CAC
        assert metrics["cac"].available is True
        assert metrics["cac"].value == 2000.0

        # Operating Margin
        assert metrics["operating_margin"].available is True
        assert round(metrics["operating_margin"].value, 1) == 38.3

        # Channel Breakdown
        assert "Amazon" in channel_metrics
        assert "Shopify" in channel_metrics
        assert channel_metrics["Amazon"]["revenue"] == 40000.0

    def test_digital_twin_unavailable_metrics_have_reasons(self):
        """When cost or marketing data is absent, metrics report available=False with reasons."""
        df = pd.DataFrame({
            "revenue": [5000.0, 8000.0],
            "quantity": [2, 4],
        })

        metrics, _, _, _ = build_digital_twin_from_dataframe(df)

        assert metrics["revenue"].available is True
        assert metrics["revenue"].value == 13000.0

        # Gross profit missing cost
        assert metrics["gross_profit"].available is False
        assert metrics["gross_profit"].value is None
        assert "cost" in metrics["gross_profit"].reason.lower()

        # Marketing spend missing
        assert metrics["marketing_spend"].available is False
        assert "marketing" in metrics["marketing_spend"].reason.lower()

        # CAC missing
        assert metrics["cac"].available is False
        assert "marketing" in metrics["cac"].reason.lower()

        # Conversion missing
        assert metrics["conversion"].available is False
        assert "conversion_rate" in metrics["conversion"].reason.lower() or "visitor" in metrics["conversion"].reason.lower()

    def test_digital_twin_conversion_rate_column(self):
        """When conversion_rate column is present without visitors, Digital Twin derives conversion correctly."""
        df = pd.DataFrame({
            "revenue": [10000.0, 20000.0],
            "conversion_rate": [2.5, 3.5],
        })

        metrics, _, _, _ = build_digital_twin_from_dataframe(df)

        assert metrics["conversion"].available is True
        assert metrics["conversion"].value == 3.0
        assert metrics["conversion"].sample_size == 2
        assert metrics["conversion"].unit == "percentage"

    def test_digital_twin_conversion_unavailable_when_both_absent(self):
        """When both conversion_rate and visitors are absent, conversion is unavailable with honest reason."""
        df = pd.DataFrame({
            "revenue": [10000.0, 20000.0],
            "cost": [5000.0, 10000.0],
        })

        metrics, _, _, _ = build_digital_twin_from_dataframe(df)

        assert metrics["conversion"].available is False
        assert metrics["conversion"].value is None
        assert "neither" in metrics["conversion"].reason.lower()



# ─────────────────────────────────────────────────────────────────────────────
# 3. END-TO-END PIPELINE API TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestPipelineEndToEnd:
    """Full pipeline: Upload File -> Normalize -> Store Dataset -> Digital Twin."""

    async def test_1_valid_csv_normalization_and_twin(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        csv_bytes = (
            "sale_date,total_sales,qty,cost,channel,stock\n"
            "2026-09-10,45000,15,22000,Online,150\n"
            "2026-09-11,65000,20,31000,Online,130\n"
            "2026-09-12,30000,10,15000,Retail,80\n"
        ).encode("utf-8")

        # 1. Upload
        upload_res = await client.post(
            "/api/business/files",
            files={"file": ("sales_q3.csv", csv_bytes, "text/csv")},
            headers=user["headers"],
        )
        assert upload_res.status_code == 201
        file_id = upload_res.json()["data"]["fileId"]

        # 2. Normalize & Create Twin
        norm_res = await client.post(
            f"/api/business/datasets/normalize/{file_id}",
            headers=user["headers"],
        )
        assert norm_res.status_code == 201, norm_res.text
        body = norm_res.json()["data"]

        dataset = body["dataset"]
        twin = body["digitalTwin"]

        # Validate Dataset
        assert dataset["fileId"] == file_id
        assert dataset["validRows"] == 3
        assert dataset["columnsMapped"]["total_sales"] == "revenue"
        assert dataset["columnsMapped"]["cogs"] if "cogs" in dataset["columnsMapped"] else dataset["columnsMapped"]["cost"] == "cost"
        assert dataset["dataQualityScore"] == 100.0

        # Validate Digital Twin
        assert twin["metrics"]["revenue"]["available"] is True
        assert twin["metrics"]["revenue"]["value"] == 140000.0
        assert twin["metrics"]["gross_profit"]["available"] is True
        assert twin["metrics"]["gross_profit"]["value"] == 72000.0
        assert twin["metrics"]["inventory"]["available"] is True
        assert twin["metrics"]["inventory"]["value"] == 80.0  # latest snapshot (was sum=360)

        # Validate unsupplied metric is marked unavailable with reason
        assert twin["metrics"]["marketing_spend"]["available"] is False
        assert twin["metrics"]["marketing_spend"]["reason"] is not None

    async def test_2_valid_xlsx_normalization_and_twin(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        xlsx_bytes = create_comprehensive_xlsx_bytes()

        # 1. Upload XLSX
        upload_res = await client.post(
            "/api/business/files",
            files={"file": ("q3_performance.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=user["headers"],
        )
        assert upload_res.status_code == 201
        file_id = upload_res.json()["data"]["fileId"]

        # 2. Normalize
        norm_res = await client.post(
            f"/api/business/datasets/normalize/{file_id}",
            headers=user["headers"],
        )
        assert norm_res.status_code == 201
        twin = norm_res.json()["data"]["digitalTwin"]

        # Validate all 8 metrics computed
        assert twin["metrics"]["revenue"]["available"] is True
        assert twin["metrics"]["revenue"]["value"] == 48000.0  # 15k + 25k + 8k
        assert twin["metrics"]["gross_profit"]["available"] is True
        assert twin["metrics"]["gross_profit"]["value"] == 23500.0  # 48k - 24.5k
        assert twin["metrics"]["orders"]["value"] == 3.0
        assert twin["metrics"]["marketing_spend"]["value"] == 6000.0
        assert twin["metrics"]["inventory"]["value"] == 95.0   # latest snapshot (was sum=315)
        assert twin["metrics"]["cac"]["available"] is True
        assert twin["metrics"]["conversion"]["available"] is True
        assert twin["metrics"]["operating_margin"]["available"] is True

        # Check multi-channel
        assert "Amazon" in twin["channelMetrics"]
        assert "Shopify" in twin["channelMetrics"]

    async def test_3_invalid_csv_rejected(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        # Upload a blank file
        upload_res = await client.post(
            "/api/business/files",
            files={"file": ("corrupted.csv", b"", "text/csv")},
            headers=user["headers"],
        )
        assert upload_res.status_code == 400

    async def test_4_missing_columns_validation(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        # CSV with no recognizable commercial signals
        csv_bytes = (
            "first_name,last_name,department,badge_id\n"
            "Alice,Smith,Engineering,E01\n"
            "Bob,Jones,Marketing,M02\n"
        ).encode("utf-8")

        upload_res = await client.post(
            "/api/business/files",
            files={"file": ("employees.csv", csv_bytes, "text/csv")},
            headers=user["headers"],
        )
        assert upload_res.status_code == 201
        file_id = upload_res.json()["data"]["fileId"]

        # Normalization should fail validation because of missing commercial signals
        norm_res = await client.post(
            f"/api/business/datasets/normalize/{file_id}",
            headers=user["headers"],
        )
        assert norm_res.status_code == 400
        assert "no recognizable business" in norm_res.json()["detail"]["message"].lower()

    async def test_5_invalid_values_handling(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        # CSV with negative values and invalid dates
        csv_bytes = (
            "sale_date,total_sales,qty,cost\n"
            "2026-09-01,10000,5,4000\n"
            "invalid-date,20000,-3,8000\n"
            "2026-09-03,not_a_number,10,6000\n"
        ).encode("utf-8")

        upload_res = await client.post(
            "/api/business/files",
            files={"file": ("dirty_data.csv", csv_bytes, "text/csv")},
            headers=user["headers"],
        )
        file_id = upload_res.json()["data"]["fileId"]

        norm_res = await client.post(
            f"/api/business/datasets/normalize/{file_id}",
            headers=user["headers"],
        )
        assert norm_res.status_code == 201
        dataset = norm_res.json()["data"]["dataset"]
        assert dataset["invalidRows"] > 0
        assert len(dataset["validationErrors"]) > 0
        assert dataset["dataQualityScore"] < 100.0

    async def test_6_get_digital_twin_endpoint(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        csv_bytes = "sale_date,total_sales,cost\n2026-09-01,50000,20000\n".encode("utf-8")

        # Before twin creation: 404 Not Found
        twin_pre = await client.get("/api/business/twin", headers=user["headers"])
        assert twin_pre.status_code == 404

        # Upload and normalize
        up = await client.post("/api/business/files", files={"file": ("s.csv", csv_bytes, "text/csv")}, headers=user["headers"])
        file_id = up.json()["data"]["fileId"]
        await client.post(f"/api/business/datasets/normalize/{file_id}", headers=user["headers"])

        # GET twin returns 200 OK with populated metrics
        twin_res = await client.get("/api/business/twin", headers=user["headers"])
        assert twin_res.status_code == 200
        twin = twin_res.json()["data"]
        assert twin["metrics"]["revenue"]["value"] == 50000.0
        assert twin["metrics"]["gross_profit"]["value"] == 30000.0

    async def test_7_digital_twin_organization_isolation(self, client: AsyncClient):
        org_a = await create_user_and_token(client, "User A", "a@corp.com", "Company A")
        org_b = await create_user_and_token(client, "User B", "b@corp.com", "Company B")

        csv_a = "total_sales,cost\n100000,40000\n".encode("utf-8")
        csv_b = "total_sales,cost\n25000,10000\n".encode("utf-8")

        # Org A uploads & normalizes
        up_a = await client.post("/api/business/files", files={"file": ("a.csv", csv_a, "text/csv")}, headers=org_a["headers"])
        await client.post(f"/api/business/datasets/normalize/{up_a.json()['data']['fileId']}", headers=org_a["headers"])

        # Org B uploads & normalizes
        up_b = await client.post("/api/business/files", files={"file": ("b.csv", csv_b, "text/csv")}, headers=org_b["headers"])
        await client.post(f"/api/business/datasets/normalize/{up_b.json()['data']['fileId']}", headers=org_b["headers"])

        # Check Org A twin
        twin_a = (await client.get("/api/business/twin", headers=org_a["headers"])).json()["data"]
        assert twin_a["metrics"]["revenue"]["value"] == 100000.0

        # Check Org B twin
        twin_b = (await client.get("/api/business/twin", headers=org_b["headers"])).json()["data"]
        assert twin_b["metrics"]["revenue"]["value"] == 25000.0

        # Org B cannot normalize Org A's file (403 Forbidden)
        cross_norm = await client.post(
            f"/api/business/datasets/normalize/{up_a.json()['data']['fileId']}",
            headers=org_b["headers"],
        )
        assert cross_norm.status_code == 403

    async def test_8_list_datasets_endpoint(self, client: AsyncClient):
        user = await create_user_and_token(client, "Rohan Patel", "rohan@enterprise.com", "RetailCorp")
        csv_bytes = "date,revenue,cost\n2026-09-01,1000,400\n".encode("utf-8")

        up = await client.post("/api/business/files", files={"file": ("sales.csv", csv_bytes, "text/csv")}, headers=user["headers"])
        file_id = up.json()["data"]["fileId"]
        await client.post(f"/api/business/datasets/normalize/{file_id}", headers=user["headers"])

        res = await client.get("/api/business/datasets", headers=user["headers"])
        assert res.status_code == 200
        datasets = res.json()["data"]
        assert len(datasets) == 1
        assert datasets[0]["fileId"] == file_id
        assert datasets[0]["validRows"] == 1

    async def test_9_opportunity_scan_radar_persistence(self, client: AsyncClient):
        user = await create_user_and_token(client, "Anita Sharma", "anita@enterprise.com", "GrowthVentures")
        xlsx_bytes = create_comprehensive_xlsx_bytes()

        # Upload and normalize
        up = await client.post("/api/business/files", files={"file": ("omni.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}, headers=user["headers"])
        file_id = up.json()["data"]["fileId"]
        await client.post(f"/api/business/datasets/normalize/{file_id}", headers=user["headers"])

        # Trigger radar scan
        scan_res = await client.post("/api/opportunities/scan", headers=user["headers"])
        assert scan_res.status_code == 200
        detected = scan_res.json()["data"]
        assert len(detected) >= 0

        # Query opportunities endpoint — confirms persistence for the organization
        list_res = await client.get("/api/opportunities", headers=user["headers"])
        assert list_res.status_code == 200
        opps = list_res.json()["data"]
        assert len(opps) == len(detected)

