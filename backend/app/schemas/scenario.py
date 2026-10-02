"""
DecisionOS — Scenario Lab API Schemas

Pydantic schemas conforming to docs/API_CONTRACT.md section 6 and
frontend types/scenario-workspace.ts.

Calculates real projected outcomes from grounded commercial business models.
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScenarioVariablesSchema(BaseModel):
    """Controllable business levers."""
    model_config = ConfigDict(populate_by_name=True)

    marketingBudget: float = Field(..., description="Marketing budget (₹ Cr or currency amount)")
    workingInventory: float = Field(..., description="Target working inventory units")
    unitPrice: float = Field(..., description="Average unit sales price")


class ScenarioPresetSchema(BaseModel):
    """Pre-configured scenario preset."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    tagline: str
    description: str
    levers: ScenarioVariablesSchema
    badge: Optional[str] = None


class StateMetricComparisonSchema(BaseModel):
    """Before vs After projection comparison for a single metric."""
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    currentValue: str
    simulatedValue: str
    change: str
    changeType: str = "positive"  # positive | negative | neutral
    currentNum: float
    simulatedNum: float
    unit: str


class ScenarioConstraintSchema(BaseModel):
    """Operational constraint check."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    rule: str
    thresholdValue: str
    projectedValue: str
    status: str = "within_constraint"  # within_constraint | warning | breached
    statusLabel: str


class SensitivityDriverSchema(BaseModel):
    """Parameter sensitivity analysis."""
    model_config = ConfigDict(populate_by_name=True)

    leverKey: str
    leverLabel: str
    sensitivityLevel: str = "High"  # High | Medium | Low
    impactScore: float
    barFillPercent: int
    explanation: str


class ScenarioUncertaintySchema(BaseModel):
    """Probabilistic confidence & ranges."""
    model_config = ConfigDict(populate_by_name=True)

    confidenceScore: float
    explanation: str
    ranges: list[dict[str, str]] = Field(default_factory=list)


class ScenarioSimulationRequest(BaseModel):
    """Simulation input body."""
    model_config = ConfigDict(populate_by_name=True)

    baselineId: Optional[str] = None
    baseline_id: Optional[str] = None
    presetId: Optional[str] = "preset_growth"
    preset_id: Optional[str] = None
    scenarioName: Optional[str] = None
    variables: Optional[ScenarioVariablesSchema] = None
    levers: Optional[ScenarioVariablesSchema] = None


class ScenarioSimulationResponse(BaseModel):
    """
    Projected outcomes calculated by the deterministic business simulation engine.
    """
    model_config = ConfigDict(populate_by_name=True)

    presetId: str
    scenarioName: str
    lastSimulatedAt: str
    levers: ScenarioVariablesSchema
    variables: ScenarioVariablesSchema
    metrics: list[StateMetricComparisonSchema]
    projectedRevenue: float
    projectedGrossProfit: float
    projectedOperatingMargin: float
    projectedOrders: float
    projectedInventory: float
    constraints: list[ScenarioConstraintSchema] = Field(default_factory=list)
    sensitivity: list[SensitivityDriverSchema] = Field(default_factory=list)
    uncertainty: ScenarioUncertaintySchema
    tradeoffs: dict[str, Any] = Field(default_factory=dict)
    realPriceBaseline: float = 0.0
    opexSource: str = "UNAVAILABLE"
    opexDisclosure: str = ""
