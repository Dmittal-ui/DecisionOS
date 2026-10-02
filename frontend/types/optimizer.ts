export type OptimizationObjective = "maximize_profit" | "minimize_churn" | "maximize_ltv" | "balance_risk_yield";

export interface OptimizationConstraint {
  id: string;
  name: string;
  metricKey: string;
  operator: "lte" | "gte" | "eq" | "between";
  targetValue: number;
  upperBound?: number;
  isHardConstraint: boolean;
  status: "satisfied" | "violated" | "binding";
}

export interface OptimizationParameterAllocation {
  id: string;
  segmentName: string;
  currentAllocation: number;
  optimizedAllocation: number;
  recommendedDelta: number;
  expectedContribution: number;
}

export interface OptimizationResult {
  id: string;
  optimizerRunCode: string;
  objective: OptimizationObjective;
  status: "optimal" | "feasible_suboptimal" | "infeasible" | "computing";
  targetMetricProjectedLift: number;
  baselineObjectiveValue: number;
  optimizedObjectiveValue: number;
  constraints: OptimizationConstraint[];
  allocations: OptimizationParameterAllocation[];
  solverTimeMs: number;
  iterationsCount: number;
  createdAt: string;
}
