import { ScenarioResult } from "@/types/scenario";

export const MOCK_SCENARIO_RESULT: ScenarioResult = {
  id: "scen_5501",
  name: "FY27 Macro Inflation & Energy Cost Shock Stress-Test",
  description: "Simulating enterprise resilience against a 15% raw material cost spike coupled with a 5% GDP deceleration in core European markets.",
  baselineScenarioName: "2027 Strategic Financial Plan Base Case",
  variables: [
    { key: "inflation_rate", label: "Global Headline CPI", baseValue: 2.8, simulatedValue: 5.6, unit: "%", sensitivityWeight: 0.85 },
    { key: "freight_cost_index", label: "Container Shipping Rate", baseValue: 2400, simulatedValue: 3800, unit: "$/FEU", sensitivityWeight: 0.72 },
    { key: "eur_usd_rate", label: "EUR / USD FX Rate", baseValue: 1.08, simulatedValue: 0.98, unit: "FX", sensitivityWeight: 0.65 },
    { key: "customer_churn_delta", label: "Enterprise Churn Rate", baseValue: 4.2, simulatedValue: 6.8, unit: "%", sensitivityWeight: 0.90 },
  ],
  monteCarloSimulationsCount: 10000,
  expectedOutcome: {
    mean: 48200000,
    p10: 39100000,
    p50: 47900000,
    p90: 56400000,
    stdDev: 6200000,
  },
  sensitivityDrivers: [
    { parameterName: "Enterprise Churn Elasticity", elasticity: -0.68, downsideRisk: 4800000, upsidePotential: 1200000 },
    { parameterName: "Freight Index Inflation", elasticity: -0.42, downsideRisk: 2900000, upsidePotential: 800000 },
    { parameterName: "FX Hedging Coverage", elasticity: 0.35, downsideRisk: 1400000, upsidePotential: 2100000 },
  ],
  simulations: [
    { runId: "sim_1", iteration: 1, projectedRevenue: 49200000, projectedEbitdaMargin: 24.2, failureRiskProbability: 0.04 },
    { runId: "sim_2", iteration: 2, projectedRevenue: 44100000, projectedEbitdaMargin: 21.0, failureRiskProbability: 0.12 },
    { runId: "sim_3", iteration: 3, projectedRevenue: 52800000, projectedEbitdaMargin: 26.5, failureRiskProbability: 0.02 },
  ],
  recommendedMitigationStrategy: "Execute immediate dynamic price pass-through clauses on all contracts exceeding $250K ARR to hedge EBITDA compression.",
  createdAt: "2026-09-29T08:45:00Z",
};
