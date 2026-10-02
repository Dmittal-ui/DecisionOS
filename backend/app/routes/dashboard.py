"""
DecisionOS — Executive Dashboard & Metric Engine Routes

Endpoints:
- GET /api/dashboard
  Complete executive dashboard populated from authenticated organization's real business data.
- GET /api/dashboard/metrics
  The 10 grounded deterministic commercial metrics:
  Revenue, Gross Profit, Gross Margin, Operating Margin, Orders, AOV, Inventory Value, Marketing Spend, Conversion Rate, CAC.
- GET /api/v1/dashboard/summary
  Direct alias conforming to docs/API_CONTRACT.md section 2.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import AuthContext, get_current_user
from app.database.mongodb import get_database
from app.schemas.common import ApiResponse
from app.schemas.dashboard import (
    DashboardMetricsResponse,
    DashboardSummaryResponse,
)
from app.services import dashboard_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Executive Dashboard & Real Metrics"])


@router.get(
    "/api/dashboard",
    response_model=ApiResponse[DashboardSummaryResponse],
    summary="Get Executive Dashboard",
    description="Returns the executive dashboard populated directly from the authenticated organization's real business data.",
)
@router.get(
    "/api/dashboard/summary",
    response_model=ApiResponse[DashboardSummaryResponse],
    include_in_schema=False,
)
async def get_dashboard(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DashboardSummaryResponse]:
    data = await dashboard_service.get_dashboard_summary(db, auth)
    return ApiResponse(
        success=True,
        data=data,
        message="Dashboard retrieved successfully from real business data.",
    )


@router.get(
    "/api/dashboard/metrics",
    response_model=ApiResponse[DashboardMetricsResponse],
    summary="Get Deterministic Commercial Metrics",
    description=(
        "Returns the 10 grounded commercial metrics: "
        "Revenue, Gross Profit, Gross Margin, Operating Margin, Orders, AOV, "
        "Inventory Value, Marketing Spend, Conversion Rate, CAC. "
        "Missing dimensions return available=false with reasons. Never fabricates data."
    ),
)
async def get_dashboard_metrics(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DashboardMetricsResponse]:
    data = await dashboard_service.get_dashboard_metrics(db, auth)
    return ApiResponse(
        success=True,
        data=data,
        message="Commercial metrics computed deterministically from real business data.",
    )


@router.get(
    "/api/v1/dashboard/summary",
    response_model=ApiResponse[DashboardSummaryResponse],
    summary="Get Executive Dashboard Summary (Contract Alias)",
    description="Contract alias for GET /api/v1/dashboard/summary per docs/API_CONTRACT.md.",
)
async def get_dashboard_contract_alias(
    auth: AuthContext = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ApiResponse[DashboardSummaryResponse]:
    data = await dashboard_service.get_dashboard_summary(db, auth)
    return ApiResponse(
        success=True,
        data=data,
        message="Dashboard summary retrieved successfully.",
    )
