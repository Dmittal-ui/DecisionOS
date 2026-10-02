import type {
  OptimizerObjectiveOption,
  OptimizerDecisionVariable,
  OptimizerHardConstraint,
  FeasibleSolution,
  OptimizerSearchSummary,
  OptimizerResultRow,
  RecommendedConfiguration,
  OptimizerSensitivityDriver,
  OptimizerTradeoff,
  ParetoPoint,
  OptimizerConfidence,
  OptimizationHistoryEntry,
  OptimizerWorkspaceData,
} from "@/types/optimizer-workspace";

// ─── Objective Options ──────────────────────────────────────────────────────

export const OPTIMIZER_OBJECTIVES: OptimizerObjectiveOption[] = [
  {
    key: "maximize_gross_profit",
    label: "Maximize Gross Profit",
    description: "Optimize for highest absolute gross profit across all business units",
    icon: "TrendingUp",
  },
  {
    key: "maximize_revenue",
    label: "Maximize Revenue",
    description: "Optimize for maximum top-line revenue growth",
    icon: "DollarSign",
  },
  {
    key: "maximize_operating_margin",
    label: "Maximize Operating Margin",
    description: "Optimize for highest operating margin percentage",
    icon: "Percent",
  },
  {
    key: "minimize_inventory",
    label: "Minimize Inventory",
    description: "Reduce working inventory while maintaining service levels",
    icon: "Package",
  },
];

// ─── Decision Variables ─────────────────────────────────────────────────────

export const OPTIMIZER_DECISION_VARIABLES: OptimizerDecisionVariable[] = [
  {
    key: "marketing_budget",
    label: "Marketing Budget",
    unit: "₹ Cr",
    min: 1.0,
    max: 2.0,
    step: 0.05,
    currentValue: 1.40,
    optimizedValue: 1.65,
    description: "Total marketing and acquisition spend allocation",
  },
  {
    key: "working_inventory",
    label: "Working Inventory",
    unit: "units",
    min: 500,
    max: 1500,
    step: 50,
    currentValue: 900,
    optimizedValue: 1050,
    description: "Active working inventory level maintained in warehouses",
  },
  {
    key: "unit_price",
    label: "Unit Price",
    unit: "₹",
    min: 90,
    max: 120,
    step: 1,
    currentValue: 105,
    optimizedValue: 108,
    description: "Average selling price per unit across product lines",
  },
];

// ─── Hard Constraints ───────────────────────────────────────────────────────

export const OPTIMIZER_HARD_CONSTRAINTS: OptimizerHardConstraint[] = [
  {
    id: "budget_limit",
    name: "Marketing Budget Ceiling",
    rule: "Budget ≤ ₹2.0 Cr",
    operator: "lte",
    thresholdValue: 2.0,
    thresholdDisplay: "₹2.0 Cr",
    projectedValue: 1.65,
    projectedDisplay: "₹1.65 Cr",
    status: "satisfied",
    slackValue: 0.35,
    slackDisplay: "₹0.35 Cr remaining",
    slackPercent: 17.5,
  },
  {
    id: "margin_floor",
    name: "Minimum Operating Margin",
    rule: "Margin ≥ 25%",
    operator: "gte",
    thresholdValue: 25,
    thresholdDisplay: "25.0%",
    projectedValue: 34.6,
    projectedDisplay: "34.6%",
    status: "satisfied",
    slackValue: 9.6,
    slackDisplay: "9.6 pp above floor",
    slackPercent: 38.4,
  },
  {
    id: "inventory_limit",
    name: "Inventory Capacity Limit",
    rule: "Inventory ≤ 1,500 units",
    operator: "lte",
    thresholdValue: 1500,
    thresholdDisplay: "1,500 units",
    projectedValue: 1050,
    projectedDisplay: "1,050 units",
    status: "satisfied",
    slackValue: 450,
    slackDisplay: "450 units remaining",
    slackPercent: 30.0,
  },
  {
    id: "churn_limit",
    name: "Customer Churn Ceiling",
    rule: "Churn ≤ 3.5%",
    operator: "lte",
    thresholdValue: 3.5,
    thresholdDisplay: "3.5%",
    projectedValue: 3.2,
    projectedDisplay: "3.2%",
    status: "binding",
    slackValue: 0.3,
    slackDisplay: "0.3 pp remaining",
    slackPercent: 8.6,
  },
];

// ─── Feasible Solutions (scatter data) ──────────────────────────────────────

export const OPTIMIZER_FEASIBLE_SOLUTIONS: FeasibleSolution[] = [
  { id: "cfg-current", x: 22, y: 28, feasible: true, isRecommended: false, isCurrent: true, label: "Current" },
  { id: "cfg-742", x: 78, y: 85, feasible: true, isRecommended: true, isCurrent: false, label: "Config #742" },
  { id: "fs-3", x: 18, y: 32, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-4", x: 25, y: 15, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-5", x: 30, y: 42, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-6", x: 35, y: 38, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-7", x: 40, y: 55, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-8", x: 45, y: 48, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-9", x: 50, y: 60, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-10", x: 55, y: 22, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-11", x: 58, y: 68, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-12", x: 62, y: 72, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-13", x: 66, y: 58, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-14", x: 70, y: 78, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-15", x: 74, y: 30, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-16", x: 82, y: 80, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-17", x: 15, y: 12, feasible: false, isRecommended: false, isCurrent: false },
  { id: "fs-18", x: 42, y: 50, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-19", x: 88, y: 76, feasible: true, isRecommended: false, isCurrent: false },
  { id: "fs-20", x: 48, y: 35, feasible: false, isRecommended: false, isCurrent: false },
];

// ─── Search Summary ─────────────────────────────────────────────────────────

export const OPTIMIZER_SEARCH_SUMMARY: OptimizerSearchSummary = {
  totalCandidates: 1260,
  feasibleCount: 842,
  infeasibleCount: 418,
  bestConfigId: "cfg-742",
  bestConfigLabel: "Config #742",
  bindingConstraint: "Customer Churn ≤ 3.5%",
  solverTimeMs: 1420,
};

// ─── Results Table ──────────────────────────────────────────────────────────

export const OPTIMIZER_RESULTS: OptimizerResultRow[] = [
  {
    id: "cfg-A",
    label: "Config A",
    grossProfit: "₹22.4 Cr",
    grossProfitNum: 22.4,
    revenue: "₹53.1 Cr",
    revenueNum: 53.1,
    margin: "34.6%",
    marginNum: 34.6,
    budget: "₹1.65 Cr",
    budgetNum: 1.65,
    status: "recommended",
    rank: 1,
  },
  {
    id: "cfg-B",
    label: "Config B",
    grossProfit: "₹21.8 Cr",
    grossProfitNum: 21.8,
    revenue: "₹51.9 Cr",
    revenueNum: 51.9,
    margin: "33.2%",
    marginNum: 33.2,
    budget: "₹1.72 Cr",
    budgetNum: 1.72,
    status: "feasible",
    rank: 2,
  },
  {
    id: "cfg-C",
    label: "Config C",
    grossProfit: "₹20.1 Cr",
    grossProfitNum: 20.1,
    revenue: "₹49.5 Cr",
    revenueNum: 49.5,
    margin: "30.8%",
    marginNum: 30.8,
    budget: "₹1.88 Cr",
    budgetNum: 1.88,
    status: "suboptimal",
    rank: 3,
  },
];

// ─── Recommended Configuration ──────────────────────────────────────────────

export const OPTIMIZER_RECOMMENDATION: RecommendedConfiguration = {
  marketingBudget: "₹1.65 Cr",
  marketingBudgetNum: 16500000,
  workingInventory: "1,050 units",
  workingInventoryNum: 1050,
  unitPrice: "₹108",
  unitPriceNum: 108,
  projectedGrossProfit: "₹22.4 Cr",
  projectedRevenue: "₹53.1 Cr",
  projectedMargin: "34.6%",
  projectedMarginNum: 34.6,
  improvementVsCurrent: "+18.4% vs. current configuration",
};

// ─── Sensitivity Drivers ────────────────────────────────────────────────────

export const OPTIMIZER_SENSITIVITY: OptimizerSensitivityDriver[] = [
  {
    variableKey: "marketing_budget",
    variableLabel: "Marketing Budget",
    sensitivityLevel: "High",
    impactScore: 9.2,
    barFillPercent: 92,
    explanation:
      "Strong positive elasticity observed for budget increases in this range. Revenue growth significantly outpaces incremental spend.",
  },
  {
    variableKey: "unit_price",
    variableLabel: "Unit Price",
    sensitivityLevel: "High",
    impactScore: 8.1,
    barFillPercent: 81,
    explanation:
      "Margin is highly sensitive to unit price changes. The suggested ₹108 maximizes margin without triggering volume collapse.",
  },
  {
    variableKey: "working_inventory",
    variableLabel: "Working Inventory",
    sensitivityLevel: "Medium",
    impactScore: 5.4,
    barFillPercent: 54,
    explanation:
      "Moderate inventory sensitivity. Reduction beyond 1,050 units begins to negatively impact fill rate and service levels.",
  },
];

// ─── Trade-offs ─────────────────────────────────────────────────────────────

export const OPTIMIZER_TRADEOFFS: OptimizerTradeoff[] = [
  {
    title: "Revenue vs Margin",
    metric1: { label: "Revenue", value: "+18.4%", direction: "positive" },
    metric2: { label: "Margin", value: "-2.1pp under max", direction: "negative" },
    insight:
      "Maximizing gross profit requires trading off peak margin percentages for higher total revenue volume.",
  },
  {
    title: "Marketing vs Profit",
    metric1: { label: "Budget", value: "+₹0.25 Cr", direction: "negative" },
    metric2: { label: "Profit", value: "+₹3.4 Cr", direction: "positive" },
    insight:
      "The increased marketing spend yields strong ROI, generating ₹3.4 Cr additional profit for ₹0.25 Cr cost.",
  },
  {
    title: "Inventory vs Service Level",
    metric1: { label: "Inventory", value: "+150 units", direction: "negative" },
    metric2: { label: "Fill Rate", value: "98.2%", direction: "positive" },
    insight:
      "Accepting slightly higher working inventory ensures service levels remain above the critical 98% threshold.",
  },
];

// ─── Pareto Frontier ────────────────────────────────────────────────────────

export const OPTIMIZER_PARETO_FRONTIER: ParetoPoint[] = [
  { id: "p1", x: 12, y: 18, label: "C-1", type: "feasible" },
  { id: "p2", x: 18, y: 25, label: "C-2", type: "dominated" },
  { id: "p3", x: 24, y: 38, label: "C-3", type: "pareto_efficient" },
  { id: "p4", x: 30, y: 32, label: "C-4", type: "dominated" },
  { id: "p5", x: 36, y: 48, label: "C-5", type: "pareto_efficient" },
  { id: "p6", x: 42, y: 42, label: "C-6", type: "feasible" },
  { id: "p7", x: 48, y: 58, label: "C-7", type: "pareto_efficient" },
  { id: "p8", x: 54, y: 52, label: "C-8", type: "dominated" },
  { id: "p9", x: 60, y: 68, label: "C-9", type: "pareto_efficient" },
  { id: "p10", x: 66, y: 62, label: "C-10", type: "feasible" },
  { id: "p11", x: 72, y: 78, label: "C-11", type: "pareto_efficient" },
  { id: "p12", x: 78, y: 85, label: "Recommended", type: "recommended" },
  { id: "p13", x: 84, y: 82, label: "C-13", type: "dominated" },
  { id: "p14", x: 90, y: 92, label: "C-14", type: "pareto_efficient" },
  { id: "p15", x: 96, y: 88, label: "C-15", type: "feasible" },
];

// ─── Confidence ─────────────────────────────────────────────────────────────

export const OPTIMIZER_CONFIDENCE: OptimizerConfidence = {
  available: true,
  score: 84,
  explanation:
    "Model calibration suggests high confidence in revenue projections, with moderate uncertainty in churn predictions at higher price points.",
  ranges: [
    { metric: "Gross Profit", range: "₹20.8 – ₹24.1 Cr" },
    { metric: "Revenue", range: "₹50.2 – ₹56.0 Cr" },
    { metric: "Operating Margin", range: "32.1% – 37.2%" },
  ],
  disclaimer:
    "Projected outcomes are based on mock calibration data. Real-world results require integration with the Decision Engine.",
};

// ─── History ────────────────────────────────────────────────────────────────

export const OPTIMIZER_HISTORY: OptimizationHistoryEntry[] = [
  {
    id: "hist-1",
    timestamp: "2026-09-29T10:00:00Z",
    objective: "Maximize Gross Profit",
    result: "₹22.4 Cr projected profit — Config #742",
    status: "optimal",
  },
  {
    id: "hist-2",
    timestamp: "2026-09-28T14:30:00Z",
    objective: "Maximize Revenue",
    result: "₹54.8 Cr projected revenue — suboptimal, time limit",
    status: "feasible",
  },
  {
    id: "hist-3",
    timestamp: "2026-09-27T09:15:00Z",
    objective: "Maximize Operating Margin",
    result: "No feasible solution found — Churn ≤ 3.0% too tight",
    status: "infeasible",
  },
  {
    id: "hist-4",
    timestamp: "2026-09-26T16:45:00Z",
    objective: "Minimize Inventory",
    result: "850 units optimal inventory profile established",
    status: "optimal",
  },
];

// ─── Composed Workspace ─────────────────────────────────────────────────────

export const MOCK_OPTIMIZER_WORKSPACE: OptimizerWorkspaceData = {
  selectedObjective: "maximize_gross_profit",
  runStatus: "complete",
  currentStep: null,
  objectives: OPTIMIZER_OBJECTIVES,
  decisionVariables: OPTIMIZER_DECISION_VARIABLES,
  hardConstraints: OPTIMIZER_HARD_CONSTRAINTS,
  feasibleSolutions: OPTIMIZER_FEASIBLE_SOLUTIONS,
  searchSummary: OPTIMIZER_SEARCH_SUMMARY,
  results: OPTIMIZER_RESULTS,
  recommendation: OPTIMIZER_RECOMMENDATION,
  sensitivity: OPTIMIZER_SENSITIVITY,
  tradeoffs: OPTIMIZER_TRADEOFFS,
  paretoFrontier: OPTIMIZER_PARETO_FRONTIER,
  confidence: OPTIMIZER_CONFIDENCE,
  history: OPTIMIZER_HISTORY,
};
