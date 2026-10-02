"""
DecisionOS Backend — FastAPI Application Entry Point

Architecture:
    Next.js (port 3000)
        ↓ HTTP / Bearer Auth
    FastAPI (port 8000)          ← this file
        ↓
    Decision Engine (engine/)
        ↓
    MongoDB (decisionos database)

Key design decisions:
- Lifespan context manager handles MongoDB startup/shutdown cleanly.
- CORS is configured for the Next.js frontend origin.
- All errors are converted to the standard ApiErrorBody envelope —
  raw database or internal exceptions never reach the client.
- LLM is NOT used here. All numerical results come from deterministic Python.
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.business import router as business_router
from app.routes.digital_twin import router as digital_twin_router
from app.routes.dashboard import router as dashboard_router
from app.routes.opportunities import router as opportunities_router
from app.routes.investigations import router as investigations_router
from app.routes.replay import router as replay_router
from app.routes.scenarios import router as scenarios_router
from app.routes.optimizer import router as optimizer_router
from app.routes.decisions import router as decisions_router
from app.routes.decision_dna import router as decision_dna_router
from app.schemas.common import ErrorCode

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Application Lifespan ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Replaces the deprecated @app.on_event("startup") pattern.

    Startup:  establish MongoDB connection, fail fast if unreachable.
    Shutdown: close Motor client gracefully.
    """
    settings = get_settings()
    logger.info(
        "Starting DecisionOS API v%s [env=%s]",
        settings.app_version,
        settings.app_env,
    )

    # ── Startup ───────────────────────────────────────────────────────────────
    try:
        await connect_to_mongo()
    except RuntimeError as exc:
        # Log the error but allow the app to start in degraded mode.
        # The /health endpoint will surface the MongoDB issue.
        logger.error("Startup warning: %s", exc)

    logger.info("DecisionOS API is ready. Swagger UI: http://localhost:8000/docs")

    yield  # Application runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await close_mongo_connection()
    logger.info("DecisionOS API shutdown complete.")


# ── Application Factory ───────────────────────────────────────────────────────

def create_application() -> FastAPI:
    """
    Creates and configures the FastAPI application.
    Returns the configured app instance.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_title,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Allows the Next.js frontend (localhost:3000) to communicate with this API.
    # In production, replace with the actual deployed frontend domain.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Global Exception Handlers ─────────────────────────────────────────────
    # These ensure raw exceptions never leak internal details to clients.

    @app.exception_handler(RuntimeError)
    async def runtime_error_handler(request: Request, exc: RuntimeError) -> JSONResponse:
        """Catches internal runtime errors (e.g., DB failures) and wraps them safely."""
        logger.error("RuntimeError on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.INTERNAL_SERVER_ERROR,
                    "message": "An internal server error occurred. Please try again.",
                },
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
        """Catches validation / business rule errors."""
        logger.warning("ValueError on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.BAD_REQUEST,
                    "message": str(exc),
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all handler. Logs full traceback but returns a safe message."""
        logger.exception("Unhandled exception on %s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.INTERNAL_SERVER_ERROR,
                    "message": "An unexpected error occurred.",
                },
            },
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    # Phase 1: health check
    app.include_router(health_router)
    # Phase 2: authentication + org isolation
    app.include_router(auth_router)
    # Phase 3: business workspace + file upload
    app.include_router(business_router)
    # Phase 4: digital twin & normalization
    app.include_router(digital_twin_router)
    # Phase 5: dashboard & real metrics
    app.include_router(dashboard_router)
    # Phase 6: opportunities & investigations
    app.include_router(opportunities_router)
    app.include_router(investigations_router)
    # Phase 7: decision replay & scenario engine
    app.include_router(replay_router)
    app.include_router(scenarios_router)
    # Phase 8: constraint-aware optimizer
    app.include_router(optimizer_router)
    # Phase 9: decision registry & decision dna governance
    app.include_router(decisions_router)
    app.include_router(decision_dna_router)

    return app


# ── Application instance ──────────────────────────────────────────────────────
app = create_application()
