"""
DecisionOS Backend — /health Route

Returns a structured health check response confirming:
- FastAPI is running
- MongoDB is reachable
- Application version and environment

Endpoint: GET /health
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import get_settings
from app.database.mongodb import ping_database
from app.schemas.common import ApiResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=ApiResponse[dict],
    summary="Backend Health Check",
    description=(
        "Returns the operational status of the DecisionOS backend, "
        "including MongoDB connectivity and application metadata. "
        "This endpoint does NOT require authentication."
    ),
)
async def health_check() -> ApiResponse[dict]:
    """
    Health check endpoint.

    Checks:
    1. FastAPI application is running.
    2. MongoDB is reachable (live ping).

    Returns a structured ApiResponse matching the frontend envelope contract.
    """
    settings = get_settings()

    # ── MongoDB connectivity check ────────────────────────────────────────────
    mongo_status = "unreachable"
    mongo_error: str | None = None

    try:
        await ping_database()
        mongo_status = "connected"
    except RuntimeError as exc:
        mongo_error = str(exc)
        logger.warning("Health check: MongoDB ping failed — %s", exc)

    # ── Compose response ──────────────────────────────────────────────────────
    health_data = {
        "status": "ok" if mongo_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.app_version,
        "environment": settings.app_env,
        "services": {
            "api": "running",
            "mongodb": mongo_status,
        },
    }

    if mongo_error:
        health_data["mongodb_error"] = mongo_error

    return ApiResponse(
        success=mongo_status == "connected",
        data=health_data,
        message=(
            "DecisionOS backend is operational."
            if mongo_status == "connected"
            else "DecisionOS backend is running but MongoDB is unreachable."
        ),
    )
