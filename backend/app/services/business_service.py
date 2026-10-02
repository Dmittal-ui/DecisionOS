"""
DecisionOS — Business Workspace Service

Handles business logic for the Business Workspace:
- Creation
- Retrieval
- Updates

All operations are strictly tenant-isolated using the authenticated organization_id.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.business import BusinessDocument
from app.schemas.auth import AuthContext
from app.schemas.business import (
    BusinessResponse,
    CreateBusinessRequest,
    UpdateBusinessRequest,
)

logger = logging.getLogger(__name__)

BUSINESSES_COLLECTION = "businesses"


def _build_business_response(doc: BusinessDocument) -> BusinessResponse:
    """Helper to convert a BusinessDocument to the API response."""
    return BusinessResponse(
        id=doc.id,
        businessId=doc.id,
        business_id=doc.id,
        organizationId=doc.organization_id,
        organization_id=doc.organization_id,
        businessName=doc.business_name,
        business_name=doc.business_name,
        industry=doc.industry,
        currency=doc.currency,
        timezone=doc.timezone,
        createdAt=doc.created_at,
        created_at=doc.created_at,
        updatedAt=doc.updated_at,
        updated_at=doc.updated_at,
    )


async def create_business(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    request: CreateBusinessRequest,
) -> BusinessResponse:
    """
    Creates a new Business Workspace for the authenticated organization.

    Raises:
        ValueError: If a business workspace already exists for this organization.
    """
    existing = await db[BUSINESSES_COLLECTION].find_one({"organization_id": auth.org_id})
    if existing:
        raise ValueError(
            "A business workspace already exists for this organization. Use PUT /api/business to update it."
        )

    business_name = request.get_business_name()
    now = datetime.now(timezone.utc)
    business = BusinessDocument(
        id=str(uuid.uuid4()),
        organization_id=auth.org_id,
        business_name=business_name,
        industry=request.industry,
        currency=request.currency or "INR",
        timezone=request.timezone or "Asia/Kolkata",
        created_at=now,
        updated_at=now,
    )

    await db[BUSINESSES_COLLECTION].insert_one(business.to_mongo())
    logger.info("Business workspace created: id=%s org=%s name=%s", business.id, auth.org_id, business_name)

    return _build_business_response(business)


async def get_business(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> BusinessResponse:
    """
    Retrieves the Business Workspace for the authenticated organization.

    Raises:
        ValueError: If no business workspace exists.
    """
    doc = await db[BUSINESSES_COLLECTION].find_one({"organization_id": auth.org_id})
    if not doc:
        raise ValueError("No business workspace found for your organization. Create one using POST /api/business.")

    business = BusinessDocument.from_mongo(doc)
    return _build_business_response(business)


async def update_business(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    request: UpdateBusinessRequest,
) -> BusinessResponse:
    """
    Updates the existing Business Workspace for the authenticated organization.
    If no business workspace exists yet, initializes one (upsert).
    """
    doc = await db[BUSINESSES_COLLECTION].find_one({"organization_id": auth.org_id})
    now = datetime.now(timezone.utc)

    if not doc:
        # Initialize if not found
        business_name = request.get_business_name() or "Business Workspace"
        business = BusinessDocument(
            id=str(uuid.uuid4()),
            organization_id=auth.org_id,
            business_name=business_name,
            industry=request.industry or "General",
            currency=request.currency or "INR",
            timezone=request.timezone or "Asia/Kolkata",
            created_at=now,
            updated_at=now,
        )
        await db[BUSINESSES_COLLECTION].insert_one(business.to_mongo())
        return _build_business_response(business)

    business = BusinessDocument.from_mongo(doc)
    update_fields: dict = {"updated_at": now, "updatedAt": now}

    new_name = request.get_business_name()
    if new_name:
        update_fields["business_name"] = new_name
        update_fields["businessName"] = new_name
        business.business_name = new_name

    if request.industry:
        update_fields["industry"] = request.industry
        business.industry = request.industry

    if request.currency:
        update_fields["currency"] = request.currency
        business.currency = request.currency

    if request.timezone:
        update_fields["timezone"] = request.timezone
        business.timezone = request.timezone

    business.updated_at = now

    await db[BUSINESSES_COLLECTION].update_one(
        {"_id": business.id, "organization_id": auth.org_id},
        {"$set": update_fields},
    )
    logger.info("Business workspace updated: id=%s org=%s", business.id, auth.org_id)

    return _build_business_response(business)


async def get_or_create_default_business(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> BusinessDocument:
    """
    Ensures a business document exists for this organization.
    Used by file uploads to link datasets to a valid business workspace.
    """
    doc = await db[BUSINESSES_COLLECTION].find_one({"organization_id": auth.org_id})
    if doc:
        return BusinessDocument.from_mongo(doc)

    now = datetime.now(timezone.utc)
    business = BusinessDocument(
        id=str(uuid.uuid4()),
        organization_id=auth.org_id,
        business_name="Default Workspace",
        industry="E-Commerce",
        currency="INR",
        timezone="Asia/Kolkata",
        created_at=now,
        updated_at=now,
    )
    await db[BUSINESSES_COLLECTION].insert_one(business.to_mongo())
    return business
