"""
DecisionOS — Test Configuration

Provides shared fixtures for all test modules:
- async_client: TestClient over the FastAPI app
- Configures pytest-asyncio for async test functions
"""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
async def async_client() -> AsyncClient:
    """
    Async HTTP test client for the FastAPI app.
    Handles lifespan (startup/shutdown) automatically.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        yield client
