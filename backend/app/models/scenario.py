"""
DecisionOS — Scenario Lab MongoDB Document Models

Stores scenario presets, variable configurations, and saved simulation runs.
Conforms strictly to docs/API_CONTRACT.md section 6 and frontend types/scenario-workspace.ts.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScenarioVariablesModel(BaseModel):
    """Controllable business levers."""
    model_config = ConfigDict(populate_by_name=True)

    marketing_budget: float = Field(..., description="Marketing budget in currency units (or ₹ Cr)")
    working_inventory: float = Field(..., description="Target inventory in units")
    unit_price: float = Field(..., description="Average unit sales price")

    @property
    def marketingBudget(self) -> float:
        return self.marketing_budget

    @property
    def workingInventory(self) -> float:
        return self.working_inventory

    @property
    def unitPrice(self) -> float:
        return self.unit_price

    def to_dict(self) -> dict[str, Any]:
        return {
            "marketingBudget": self.marketing_budget,
            "marketing_budget": self.marketing_budget,
            "workingInventory": self.working_inventory,
            "working_inventory": self.working_inventory,
            "unitPrice": self.unit_price,
            "unit_price": self.unit_price,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ScenarioVariablesModel":
        mb = data.get("marketingBudget") or data.get("marketing_budget", 1.5)
        wi = data.get("workingInventory") or data.get("working_inventory", 1000)
        up = data.get("unitPrice") or data.get("unit_price", 100)
        return cls(
            marketing_budget=float(mb),
            working_inventory=float(wi),
            unit_price=float(up),
        )


class ScenarioPresetModel(BaseModel):
    """Pre-configured scenario lever preset."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    tagline: str
    description: str
    levers: ScenarioVariablesModel
    badge: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "tagline": self.tagline,
            "description": self.description,
            "levers": self.levers.to_dict(),
            "badge": self.badge,
        }


class SavedScenarioDocument(BaseModel):
    """
    Persisted scenario simulation run in 'scenarios'.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique scenario ID")
    organization_id: str
    business_id: str
    dataset_id: str = Field(default="", description="FK -> datasets._id. Scopes this scenario to the dataset it was simulated against.")
    preset_id: Optional[str] = None
    name: str
    variables: ScenarioVariablesModel
    projected_revenue: float
    projected_gross_profit: float
    projected_operating_margin: float
    projected_orders: float
    projected_inventory: float
    metrics: list[dict[str, Any]]
    constraints: list[dict[str, Any]]
    sensitivity: list[dict[str, Any]]
    uncertainty: dict[str, Any]
    tradeoffs: dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_mongo(self) -> dict[str, Any]:
        return {
            "_id": self.id,
            "scenarioId": self.id,
            "organization_id": self.organization_id,
            "organizationId": self.organization_id,
            "business_id": self.business_id,
            "businessId": self.business_id,
            "dataset_id": self.dataset_id,
            "datasetId": self.dataset_id,
            "preset_id": self.preset_id,
            "presetId": self.preset_id,
            "name": self.name,
            "variables": self.variables.to_dict(),
            "levers": self.variables.to_dict(),
            "projected_revenue": self.projected_revenue,
            "projectedRevenue": self.projected_revenue,
            "projected_gross_profit": self.projected_gross_profit,
            "projectedGrossProfit": self.projected_gross_profit,
            "projected_operating_margin": self.projected_operating_margin,
            "projectedOperatingMargin": self.projected_operating_margin,
            "projected_orders": self.projected_orders,
            "projectedOrders": self.projected_orders,
            "projected_inventory": self.projected_inventory,
            "projectedInventory": self.projected_inventory,
            "metrics": self.metrics,
            "constraints": self.constraints,
            "sensitivity": self.sensitivity,
            "uncertainty": self.uncertainty,
            "tradeoffs": self.tradeoffs,
            "created_at": self.created_at,
        }

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "SavedScenarioDocument":
        vars_raw = doc.get("variables") or doc.get("levers") or {}
        return cls(
            id=str(doc.get("_id") or doc.get("scenarioId")),
            organization_id=str(doc.get("organization_id") or doc.get("organizationId")),
            business_id=str(doc.get("business_id") or doc.get("businessId")),
            dataset_id=str(doc.get("dataset_id") or doc.get("datasetId") or ""),
            preset_id=doc.get("preset_id") or doc.get("presetId"),
            name=str(doc.get("name", "Untitled Scenario")),
            variables=ScenarioVariablesModel.from_dict(vars_raw) if isinstance(vars_raw, dict) else ScenarioVariablesModel(marketing_budget=1.5, working_inventory=1000, unit_price=100),
            projected_revenue=float(doc.get("projected_revenue") or doc.get("projectedRevenue", 0.0)),
            projected_gross_profit=float(doc.get("projected_gross_profit") or doc.get("projectedGrossProfit", 0.0)),
            projected_operating_margin=float(doc.get("projected_operating_margin") or doc.get("projectedOperatingMargin", 0.0)),
            projected_orders=float(doc.get("projected_orders") or doc.get("projectedOrders", 0.0)),
            projected_inventory=float(doc.get("projected_inventory") or doc.get("projectedInventory", 0.0)),
            metrics=doc.get("metrics") or [],
            constraints=doc.get("constraints") or [],
            sensitivity=doc.get("sensitivity") or [],
            uncertainty=doc.get("uncertainty") or {},
            tradeoffs=doc.get("tradeoffs") or {},
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
        )
