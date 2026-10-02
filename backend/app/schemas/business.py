"""
DecisionOS — Business Workspace Schemas

Defines API request and response models for Business Workspace endpoints:
- POST /api/business
- GET /api/business
- PUT /api/business

Supports both camelCase and snake_case for full compatibility.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class CreateBusinessRequest(BaseModel):
    """
    POST /api/business

    Request payload to initialize a business workspace.
    Accepts businessName or business_name.
    """
    businessName: Optional[str] = None
    business_name: Optional[str] = None
    industry: str = Field(..., min_length=2, max_length=100, description="Industry sector, e.g. E-Commerce")
    currency: str = Field(default="INR", max_length=10, description="Currency code, e.g. INR, USD")
    timezone: str = Field(default="Asia/Kolkata", max_length=50, description="Timezone, e.g. Asia/Kolkata")

    @model_validator(mode="before")
    @classmethod
    def resolve_business_name(cls, data: dict) -> dict:
        if isinstance(data, dict):
            name = data.get("businessName") or data.get("business_name")
            if not name or len(str(name).strip()) < 2:
                raise ValueError("businessName or business_name is required (at least 2 characters)")
            data["businessName"] = str(name).strip()
            data["business_name"] = str(name).strip()
        return data

    def get_business_name(self) -> str:
        return self.businessName or self.business_name or ""


class UpdateBusinessRequest(BaseModel):
    """
    PUT /api/business

    Payload to update an existing business workspace.
    All fields are optional.
    """
    businessName: Optional[str] = None
    business_name: Optional[str] = None
    industry: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None

    def get_business_name(self) -> Optional[str]:
        name = self.businessName or self.business_name
        return str(name).strip() if name else None


class BusinessResponse(BaseModel):
    """
    Safe API response representing the business workspace.
    Supports both camelCase and snake_case.
    """
    id: str
    businessId: str
    business_id: str
    organizationId: str
    organization_id: str
    businessName: str
    business_name: str
    industry: str
    currency: str
    timezone: str
    createdAt: datetime
    created_at: datetime
    updatedAt: datetime
    updated_at: datetime
