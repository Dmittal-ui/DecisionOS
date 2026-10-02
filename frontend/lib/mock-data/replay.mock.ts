import { ReplayResult } from "@/types/replay";

export const MOCK_REPLAY_RESULT: ReplayResult = {
  id: "rep_8012",
  replaySessionCode: "RPL-2026-Q2-APAC",
  targetHistoricalPeriod: {
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  originalDecisionId: "dec_hist_094",
  originalDecisionTitle: "APAC Cloud Infrastructure Procurement Contract Lock-in",
  actualRealizedValue: 12500000,
  counterfactualOptimizedValue: 15300000,
  potentialLiftPercentage: 22.4,
  timeline: [
    {
      stepIndex: 1,
      timestamp: "2026-04-05T10:00:00Z",
      eventDescription: "Spot instance spot pricing collapsed 38% due to Tokyo regional capacity surge.",
      contextStateSnapshot: { spotDiscountPercent: 38, reservedCommitment: "Fixed 3-Yr" },
      decisionTriggered: "Executed standard 3-year Reserved Instance contract.",
      wasOptimal: false,
    },
    {
      stepIndex: 2,
      timestamp: "2026-05-12T14:30:00Z",
      eventDescription: "Compute demand surged by 80% with sudden cross-border banking customer onboard.",
      contextStateSnapshot: { capacityUtilization: 98.4, overageCost: "$420,000" },
      wasOptimal: true,
    },
  ],
  branches: [
    {
      id: "br_1",
      actionTaken: "Fixed 3-Year Reserved Allocation (Actual)",
      historicalOutcomeValue: 12500000,
      counterfactualOutcomeValue: 12500000,
      deltaValue: 0,
      varianceExplanation: "High rigidity caused high overage costs when customer volume spiked unexpectedly.",
    },
    {
      id: "br_2",
      actionTaken: "Dynamic Hybrid Savings Plan + Auto-Spot Mix (Optimal Counterfactual)",
      historicalOutcomeValue: 12500000,
      counterfactualOutcomeValue: 15300000,
      deltaValue: 2800000,
      varianceExplanation: "Flexibility allowed instant absorption of burst workloads at 40% lower marginal unit cost.",
    },
  ],
  learningsIdentified: [
    "Fixed long-term commitments for variable cloud workloads reduced operational agility by 45%.",
    "Decision DNA exhibited status-quo bias and over-indexed on nominal upfront discount rates.",
    "Applying DecisionOS auto-hedging constraints would have saved $2.8M in Q2.",
  ],
  executedAt: "2026-09-28T16:30:00Z",
};
