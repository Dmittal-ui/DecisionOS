"""
DecisionOS Backend — MongoDB Connection Layer

Provides:
- Async Motor client lifecycle (startup / shutdown)
- get_database() dependency for FastAPI routes
- ping_database() for health checks

Rule: Raw pymongo/motor exceptions never escape this module.
All errors are converted to application-level exceptions.
"""

import logging
from typing import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── Module-level client singleton ─────────────────────────────────────────────
# Initialized by lifespan; None until startup completes.
_client: AsyncIOMotorClient | None = None


def _get_client() -> AsyncIOMotorClient:
    """Returns the active Motor client or raises if not initialized."""
    if _client is None:
        raise RuntimeError(
            "MongoDB client is not initialized. "
            "Ensure the FastAPI lifespan has completed startup."
        )
    return _client


# ── Lifecycle helpers (called by FastAPI lifespan) ────────────────────────────

async def connect_to_mongo() -> None:
    """
    Creates the Motor client and verifies connectivity via a ping command.
    Called once at application startup.
    Raises RuntimeError if MongoDB is unreachable.
    """
    global _client
    settings = get_settings()

    logger.info("Connecting to MongoDB at %s ...", settings.mongodb_uri)

    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,   # fail fast if unreachable
            connectTimeoutMS=5000,
        )
        # Verify the connection is live before accepting requests.
        await ping_database()
        logger.info(
            "MongoDB connected successfully. Database: '%s'",
            settings.mongodb_database,
        )
    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        _client = None
        raise RuntimeError(
            f"Failed to connect to MongoDB: {exc}. "
            "Check MONGODB_URI in your .env file."
        ) from exc


async def close_mongo_connection() -> None:
    """
    Closes the Motor client.
    Called once at application shutdown.
    """
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


# ── Health check helper ───────────────────────────────────────────────────────

async def ping_database() -> bool:
    """
    Sends a lightweight 'ping' command to MongoDB.
    Returns True on success, raises RuntimeError on failure.
    Used by the /health endpoint and startup verification.
    """
    try:
        client = _get_client()
        settings = get_settings()
        await client[settings.mongodb_database].command("ping")
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        raise RuntimeError(f"MongoDB ping failed: {exc}") from exc


# ── FastAPI dependency ─────────────────────────────────────────────────────────

async def get_database() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """
    FastAPI dependency that yields the active database handle.

    Usage in a route:
        async def my_route(db: AsyncIOMotorDatabase = Depends(get_database)):
            ...
    """
    settings = get_settings()
    yield _get_client()[settings.mongodb_database]
