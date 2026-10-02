// ─── Phase 8 Scenario Lab Types ───────────────────────────────────────────────
// Schema representing controllable business levers, simulation state,
// projected outcomes, sensitivity, trade-offs, and constraints.
// Compatible with future POST /api/scenario contract.

export type SimulationStatus = "ready" | "running" | "complete" | "error";

export interface DecisionLeverValues {
  marketingBudget: number; // in ₹ Cr (e.g. 1.40)
  workingInventory: number; // in units (e.g. 900)
  unitPrice: number; // in ₹ (e.g. 105)
}

export interface DecisionLeverConfig {
  key: keyof DecisionLeverValues;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  baseline: number;
  description: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  levers: DecisionLeverValues;
  badge?: string;
}

export interface StateMetricComparison {
  key: string;
  label: string;
  currentValue: string;
  simulatedValue: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  currentNum: number;
  simulatedNum: number;
  unit: string;
}

export interface SensitivityDriver {
  leverKey: keyof DecisionLeverValues;
  leverLabel: string;
  sensitivityLevel: "High" | "Medium" | "Low";
  impactScore: number; // 0 to 10
  barFillPercent: number; // 0 to 100
  explanation: string;
}

export interface TradeoffCategory {
  title: string;
  metric1: { label: string; value: string; positive: boolean };
  metric2: { label: string; value: string; positive: boolean };
}

export interface ScenarioConstraint {
  id: string;
  name: string;
  rule: string;
  thresholdValue: string;
  projectedValue: string;
  status: "within_constraint" | "warning" | "breached";
  statusLabel: string;
}

export interface ScenarioUncertainty {
  confidenceScore: number;
  explanation: string;
  ranges: Array<{
    metric: string;
    range: string;
  }>;
}

export interface SimulationHistoryEntry {
  id: string;
  timeframe: string;
  scenarioName: string;
  timestamp: string;
  levers: {
    marketing: string;
    inventory: string;
    price: string;
  };
  highlightResult: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  levers: DecisionLeverValues;
  projectedRevenue: string;
  projectedProfit: string;
  projectedMargin: string;
}

export interface ScenarioWorkspaceData {
  presetId: string;
  scenarioName: string;
  lastSimulatedAt: string;
  levers: DecisionLeverValues;
  metrics: StateMetricComparison[];
  sensitivity: SensitivityDriver[];
  tradeoffs: {
    categories: TradeoffCategory[];
    summary: string;
  };
  constraints: ScenarioConstraint[];
  uncertainty: ScenarioUncertainty;
  history: SimulationHistoryEntry[];
}
