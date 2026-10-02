// ─── Phase 9 Constraint-Aware Optimizer Types ───────────────────────────────
// Schema representing optimization objectives, decision variables, constraints,
// feasible solutions, Pareto frontier, and optimizer workspace state.
// Compatible with future POST /api/optimizer contract.

export type OptimizerObjectiveKey = "maximize_gross_profit" | "maximize_revenue" | "maximize_operating_margin" | "minimize_inventory";

export type OptimizerRunStatus = "idle" | "running" | "complete" | "error";

export type OptimizerRunStep =
  | "validating_constraints"
  | "evaluating_configurations"
  | "comparing_objectives"
  | "selecting_recommendation";

export interface OptimizerObjectiveOption {
  key: OptimizerObjectiveKey;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface OptimizerDecisionVariable {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  optimizedValue: number;
  description: string;
}

export interface OptimizerHardConstraint {
  id: string;
  name: string;
  rule: string;
  operator: "lte" | "gte";
  thresholdValue: number;
  thresholdDisplay: string;
  projectedValue: number;
  projectedDisplay: string;
  status: "satisfied" | "violated" | "binding";
  slackValue: number;
  slackDisplay: string;
  slackPercent: number; // 0-100, how much room before violation
}

export interface FeasibleSolution {
  id: string;
  x: number; // normalized 0-100 for scatter chart
  y: number; // normalized 0-100 for scatter chart
  feasible: boolean;
  isRecommended: boolean;
  isCurrent: boolean;
  label?: string;
  grossProfit?: number;
  operatingMargin?: number;
}

export interface OptimizerSearchSummary {
  totalCandidates: number;
  feasibleCount: number;
  infeasibleCount: number;
  bestConfigId: string;
  bestConfigLabel: string;
  bindingConstraint: string;
  solverTimeMs: number;
}

export interface OptimizerResultRow {
  id: string;
  label: string;
  grossProfit: string;
  grossProfitNum: number;
  revenue: string;
  revenueNum: number;
  margin: string;
  marginNum: number;
  budget: string;
  budgetNum: number;
  status: "recommended" | "feasible" | "suboptimal";
  rank: number;
}

export interface RecommendedConfiguration {
  marketingBudget: string;
  marketingBudgetNum: number;
  workingInventory: string;
  workingInventoryNum: number;
  unitPrice: string;
  unitPriceNum: number;
  projectedGrossProfit: string;
  projectedRevenue: string;
  projectedMargin: string;
  projectedMarginNum: number;
  improvementVsCurrent: string;
}

export interface OptimizerSensitivityDriver {
  variableKey: string;
  variableLabel: string;
  sensitivityLevel: "High" | "Medium" | "Low";
  impactScore: number; // 0 to 10
  barFillPercent: number; // 0 to 100
  explanation: string;
}

export interface OptimizerTradeoff {
  title: string;
  metric1: { label: string; value: string; direction: "positive" | "negative" };
  metric2: { label: string; value: string; direction: "positive" | "negative" };
  insight: string;
}

export interface ParetoPoint {
  id: string;
  x: number; // Operating Margin (min-max normalized 0-100)
  y: number; // Gross Profit (min-max normalized 0-100)
  label: string;
  type: "feasible" | "dominated" | "pareto_efficient" | "recommended";
  onFrontier?: boolean;
  grossProfit?: number;
  operatingMargin?: number;
}

export interface OptimizerConfidence {
  available: boolean;
  score: number; // 0-100; unused when available is false
  explanation: string;
  ranges: Array<{
    metric: string;
    range: string;
  }>;
  disclaimer: string;
}

export interface OptimizationHistoryEntry {
  id: string;
  timestamp: string;
  objective: string;
  result: string;
  status: "optimal" | "feasible" | "infeasible";
}

export interface SavedOptimizerConfig {
  id: string;
  name: string;
  createdAt: string;
  objective: OptimizerObjectiveKey;
  marketingBudget: string;
  inventory: string;
  unitPrice: string;
  projectedProfit: string;
}

export interface OptimizerWorkspaceData {
  selectedObjective: OptimizerObjectiveKey;
  runStatus: OptimizerRunStatus;
  currentStep: OptimizerRunStep | null;
  objectives: OptimizerObjectiveOption[];
  decisionVariables: OptimizerDecisionVariable[];
  hardConstraints: OptimizerHardConstraint[];
  feasibleSolutions: FeasibleSolution[];
  searchSummary: OptimizerSearchSummary;
  results: OptimizerResultRow[];
  recommendation: RecommendedConfiguration | null;
  sensitivity: OptimizerSensitivityDriver[];
  tradeoffs: OptimizerTradeoff[];
  paretoFrontier: ParetoPoint[];
  confidence: OptimizerConfidence;
  history: OptimizationHistoryEntry[];
}
