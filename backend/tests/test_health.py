"""
DecisionOS — Phase 1 Test Suite

Tests:
1. Application startup succeeds.
2. GET /health returns 200 with correct structure.
3. Health data contains all required fields.
4. MongoDB connection is verified through the health endpoint.
5. Settings load correctly from environment / defaults.
"""

import pytest
from httpx import AsyncClient

from app.config import get_settings


class TestApplicationStartup:
    """Verify the FastAPI application initializes correctly."""

    async def test_app_is_reachable(self, async_client: AsyncClient):
        """The test client can reach the app (lifespan startup completed)."""
        response = await async_client.get("/health")
        # Accept 200 (MongoDB up) or 200 with degraded (MongoDB down but app runs).
        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}. Response: {response.text}"
        )

    async def test_openapi_schema_is_available(self, async_client: AsyncClient):
        """FastAPI /openapi.json must be reachable (required for /docs to work)."""
        response = await async_client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema

    async def test_swagger_docs_redirect(self, async_client: AsyncClient):
        """GET /docs must return 200 (Swagger UI is served)."""
        response = await async_client.get("/docs")
        assert response.status_code == 200


class TestHealthEndpoint:
    """Test GET /health endpoint contract."""

    async def test_health_returns_200(self, async_client: AsyncClient):
        """Health endpoint always returns HTTP 200."""
        response = await async_client.get("/health")
        assert response.status_code == 200

    async def test_health_response_envelope(self, async_client: AsyncClient):
        """Response must have the standard ApiResponse envelope fields."""
        response = await async_client.get("/health")
        body = response.json()

        assert "success" in body, "Missing 'success' field"
        assert "data" in body, "Missing 'data' field"
        assert isinstance(body["success"], bool), "'success' must be a bool"

    async def test_health_data_fields(self, async_client: AsyncClient):
        """Health data must contain status, timestamp, version, environment, services."""
        response = await async_client.get("/health")
        data = response.json()["data"]

        assert "status" in data, "Missing 'status' in health data"
        assert "timestamp" in data, "Missing 'timestamp' in health data"
        assert "version" in data, "Missing 'version' in health data"
        assert "environment" in data, "Missing 'environment' in health data"
        assert "services" in data, "Missing 'services' in health data"

    async def test_health_status_is_ok_or_degraded(self, async_client: AsyncClient):
        """Status must be one of the two defined values."""
        response = await async_client.get("/health")
        status = response.json()["data"]["status"]
        assert status in ("ok", "degraded"), f"Unexpected status: {status}"

    async def test_health_services_has_api_and_mongodb(self, async_client: AsyncClient):
        """Services object must report both 'api' and 'mongodb'."""
        response = await async_client.get("/health")
        services = response.json()["data"]["services"]

        assert "api" in services, "Missing 'api' in services"
        assert "mongodb" in services, "Missing 'mongodb' in services"
        assert services["api"] == "running", f"API service not 'running': {services['api']}"

    async def test_health_version_matches_config(self, async_client: AsyncClient):
        """Version in health response must match settings."""
        settings = get_settings()
        response = await async_client.get("/health")
        version = response.json()["data"]["version"]
        assert version == settings.app_version

    async def test_health_has_message(self, async_client: AsyncClient):
        """Response should include a human-readable message."""
        response = await async_client.get("/health")
        body = response.json()
        assert "message" in body
        assert isinstance(body["message"], str)
        assert len(body["message"]) > 0


class TestConfiguration:
    """Verify settings load correctly (sync — no async needed)."""

    def test_settings_load_without_error(self):
        """Settings must load cleanly (no missing required fields)."""
        settings = get_settings()
        assert settings is not None

    def test_mongodb_uri_has_value(self):
        """MONGODB_URI must not be empty."""
        settings = get_settings()
        assert settings.mongodb_uri, "MONGODB_URI is empty"
        assert settings.mongodb_uri.startswith("mongodb"), (
            f"MONGODB_URI should start with 'mongodb', got: {settings.mongodb_uri}"
        )

    def test_mongodb_database_has_value(self):
        """MONGODB_DATABASE must not be empty."""
        settings = get_settings()
        assert settings.mongodb_database, "MONGODB_DATABASE is empty"

    def test_cors_origins_parses_correctly(self):
        """CORS origins must parse into a non-empty list."""
        settings = get_settings()
        origins = settings.cors_origins_list
        assert isinstance(origins, list), "cors_origins_list must return a list"
        assert len(origins) > 0, "No CORS origins configured"

    def test_app_version_is_set(self):
        """App version must be set."""
        settings = get_settings()
        assert settings.app_version, "App version is empty"


class TestMongoDBConnection:
    """Test MongoDB connectivity through the application."""

    async def test_mongodb_status_in_health(self, async_client: AsyncClient):
        """
        MongoDB status in health response must be either 'connected' or 'unreachable'.
        We accept both since MongoDB may not be running in CI.
        """
        response = await async_client.get("/health")
        services = response.json()["data"]["services"]
        assert services["mongodb"] in ("connected", "unreachable"), (
            f"Unexpected MongoDB status: {services['mongodb']}"
        )

    async def test_health_success_reflects_mongodb_state(self, async_client: AsyncClient):
        """
        'success' in the health response must be True only when MongoDB is connected.
        """
        response = await async_client.get("/health")
        body = response.json()
        mongodb_status = body["data"]["services"]["mongodb"]

        if mongodb_status == "connected":
            assert body["success"] is True, "success should be True when MongoDB is connected"
        else:
            assert body["success"] is False, "success should be False when MongoDB is unreachable"
