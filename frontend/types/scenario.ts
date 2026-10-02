export interface ScenarioVariable {
  key: string;
  label: string;
  baseValue: number;
  simulatedValue: number;
  unit: string;
  sensitivityWeight: number; // 0 - 1
}

export interface ScenarioSensitivityDriver {
  parameterName: string;
  elasticity: number;
  downsideRisk: number;
  upsidePotential: number;
}

export interface ScenarioSimulationRun {
  runId: string;
  iteration: number;
  projectedRevenue: number;
  projectedEbitdaMargin: number;
  failureRiskProbability: number;
}

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  baselineScenarioName: string;
  variables: ScenarioVariable[];
  monteCarloSimulationsCount: number;
  expectedOutcome: {
    mean: number;
    p10: number; // 10th percentile (bearish)
    p50: number; // median
    p90: number; // 90th percentile (bullish)
    stdDev: number;
  };
  sensitivityDrivers: ScenarioSensitivityDriver[];
  simulations: ScenarioSimulationRun[];
  recommendedMitigationStrategy: string;
  createdAt: string;
}
