"""
DecisionOS — Optimizer MongoDB Document Models

Stores optimization run records, objectives, constraints, feasible solutions,
slacks, and recommended configurations with strict multi-tenant organization isolation.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class OptimizerRunDocument(BaseModel):
    """Represents a persisted deterministic optimization solver run."""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id", description="Unique optimization run ID")
    organization_id: str = Field(..., description="Multi-tenant organization boundary")
    business_id: str = Field(..., description="Business workspace ID")
    dataset_id: str = Field(default="", description="FK -> datasets._id. Scopes this run to the dataset it was calibrated against.")
    objective: str = Field(default="maximize_gross_profit", description="Target objective function")
    status: str = Field(default="optimal", description="'optimal' or 'infeasible'")
    hard_constraints: dict[str, Any] = Field(default_factory=dict)
    allowed_ranges: Optional[Any] = None
    recommended_configuration: Optional[dict[str, Any]] = None
    projected_outcomes: Optional[dict[str, Any]] = None
    constraint_status: list[dict[str, Any]] = Field(default_factory=list)
    slack: list[dict[str, Any]] = Field(default_factory=list)
    feasible_candidates: list[dict[str, Any]] = Field(default_factory=list)
    feasible_solutions: list[dict[str, Any]] = Field(default_factory=list)
    pareto_frontier: list[dict[str, Any]] = Field(default_factory=list)
    results: list[dict[str, Any]] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)
    sensitivity: list[dict[str, Any]] = Field(default_factory=list)
    tradeoffs: list[dict[str, Any]] = Field(default_factory=list)
    disclaimer: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def organizationId(self) -> str:
        return self.organization_id

    @property
    def businessId(self) -> str:
        return self.business_id

    @property
    def recommendedConfiguration(self) -> Optional[dict[str, Any]]:
        return self.recommended_configuration

    @property
    def projectedOutcomes(self) -> Optional[dict[str, Any]]:
        return self.projected_outcomes

    @property
    def constraintStatus(self) -> list[dict[str, Any]]:
        return self.constraint_status

    @property
    def feasibleCandidates(self) -> list[dict[str, Any]]:
        return self.feasible_candidates

    def to_mongo(self) -> dict[str, Any]:
        """Serializes document to MongoDB BSON dict."""
        d = self.model_dump(by_alias=False)
        d["_id"] = self.id
        return d

    @classmethod
    def from_mongo(cls, data: dict[str, Any]) -> "OptimizerRunDocument":
        """Deserializes document from MongoDB BSON dict."""
        d = dict(data)
        if "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        return cls(**d)
