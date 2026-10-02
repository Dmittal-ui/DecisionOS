"""
DecisionOS — Optimizer API Schemas

Pydantic schemas conforming to docs/API_CONTRACT.md section 7, frontend
types/optimizer-workspace.ts, and Phase 8 deterministic optimizer specifications.
"""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class OptimizerDecisionVariableSchema(BaseModel):
    """Decision variable configuration."""
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    unit: str
    min: float
    max: float
    step: float
    currentValue: float
    optimizedValue: float
    description: str


class ConstraintStatusSchema(BaseModel):
    """Status of an individual operational constraint."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    rule: str
    status: Optional[str] = None  # "satisfied" | "violated" | "binding"
    operator: Optional[str] = None  # "lte" | "gte"
    thresholdValue: float
    thresholdDisplay: str
    projectedValue: float
    projectedDisplay: str


class SlackItemSchema(BaseModel):
    """Numerical slack between constraint threshold and projected value."""
    model_config = ConfigDict(populate_by_name=True)

    constraintId: str
    name: str
    slackValue: float
    slackDisplay: str
    slackPercent: float
    isBinding: bool


class RecommendedConfigurationSchema(BaseModel):
    """Optimal feasible configuration recommended by the solver."""
    model_config = ConfigDict(populate_by_name=True)

    marketingBudget: str
    marketingBudgetNum: int
    workingInventory: str
    workingInventoryNum: int
    unitPrice: str
    unitPriceNum: float
    projectedGrossProfit: str
    projectedRevenue: str
    projectedMargin: str
    projectedMarginNum: float
    projectedOperatingMargin: Optional[str] = None
    projectedOrders: Optional[float] = None
    projectedInventory: Optional[float] = None
    improvementVsCurrent: str


class ProjectedOutcomesSchema(BaseModel):
    """Projected business outcomes for the recommended configuration."""
    model_config = ConfigDict(populate_by_name=True)

    revenue: float
    grossProfit: float
    operatingMargin: float
    orders: float
    inventory: float
    grossMargin: float
    annualChurn: Optional[float] = None


class FeasibleCandidateSchema(BaseModel):
    """Feasible candidate summary row."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    rank: int
    marketingBudget: float
    workingInventory: float
    unitPrice: float
    revenue: float
    grossProfit: float
    operatingMargin: float
    isRecommended: bool


class OptimizerResultRowSchema(BaseModel):
    """Top solution table row."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    grossProfit: str
    grossProfitNum: float
    revenue: str
    revenueNum: float
    margin: str
    marginNum: float
    budget: str
    budgetNum: float
    status: str
    rank: int


class OptimizerSearchSummarySchema(BaseModel):
    """Solver execution diagnostics."""
    model_config = ConfigDict(populate_by_name=True)

    totalConfigurationsEvaluated: int
    feasibleConfigurations: int
    infeasibleConfigurations: int
    optimalConfigId: Optional[str] = None
    bindingConstraint: str
    solverDurationMs: float
    algorithm: str = "Deterministic Discrete Grid Search Solver"


class OptimizerSolveRequest(BaseModel):
    """Request payload to invoke the mathematical solver."""
    model_config = ConfigDict(populate_by_name=True)

    objective: str = Field(
        default="maximize_gross_profit",
        description="Target objective: 'maximize_gross_profit', 'maximize_revenue', 'maximize_operating_margin', 'minimize_inventory'",
    )
    hardConstraints: Optional[dict[str, Any]] = Field(
        default=None,
        description="Hard operational constraints (e.g. maxMarketingBudget, minMarginPercent, minInventory, maxInventory, maxAnnualChurn)",
    )
    allowedRanges: Optional[Any] = Field(
        default=None,
        description="Allowed parameter search ranges for marketingBudget, workingInventory, unitPrice",
    )
    decisionVariables: Optional[list[Any]] = Field(
        default=None,
        description="Alternative format for allowed parameter ranges",
    )


class OptimizerSolveResponse(BaseModel):
    """Response payload returned by the deterministic constraint-aware solver."""
    model_config = ConfigDict(populate_by_name=True)

    status: str = Field(..., description="'optimal' or 'infeasible'")
    objective: str
    recommendedConfiguration: Optional[dict[str, Any]] = None
    recommendation: Optional[dict[str, Any]] = None
    projectedOutcomes: Optional[dict[str, Any]] = None
    constraintStatus: list[dict[str, Any]] = Field(default_factory=list)
    slack: list[dict[str, Any]] = Field(default_factory=list)
    feasibleCandidates: list[dict[str, Any]] = Field(default_factory=list)
    feasibleSolutions: list[dict[str, Any]] = Field(default_factory=list)
    paretoFrontier: list[dict[str, Any]] = Field(default_factory=list)
    results: list[dict[str, Any]] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)
    sensitivity: list[dict[str, Any]] = Field(default_factory=list)
    tradeoffs: list[dict[str, Any]] = Field(default_factory=list)
    message: Optional[str] = None
    disclaimer: Optional[str] = None


class OptimizerWorkspaceResponse(BaseModel):
    """Full optimizer workspace state for the frontend."""
    model_config = ConfigDict(populate_by_name=True)

    objective: str
    status: str
    objectives: list[dict[str, Any]] = Field(default_factory=list)
    decisionVariables: list[dict[str, Any]] = Field(default_factory=list)
    hardConstraints: list[dict[str, Any]] = Field(default_factory=list)
    results: list[dict[str, Any]] = Field(default_factory=list)
    recommendation: Optional[dict[str, Any]] = None
    recommendedConfiguration: Optional[dict[str, Any]] = None
    projectedOutcomes: Optional[dict[str, Any]] = None
    slack: list[dict[str, Any]] = Field(default_factory=list)
    feasibleCandidates: list[dict[str, Any]] = Field(default_factory=list)
    feasibleSolutions: list[dict[str, Any]] = Field(default_factory=list)
    paretoFrontier: list[dict[str, Any]] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)
    sensitivity: list[dict[str, Any]] = Field(default_factory=list)
    tradeoffs: list[dict[str, Any]] = Field(default_factory=list)
    history: list[dict[str, Any]] = Field(default_factory=list)
