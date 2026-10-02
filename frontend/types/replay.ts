export interface CounterfactualBranch {
  id: string;
  actionTaken: string;
  historicalOutcomeValue: number;
  counterfactualOutcomeValue: number;
  deltaValue: number;
  varianceExplanation: string;
}

export interface ReplayTimelineStep {
  stepIndex: number;
  timestamp: string;
  eventDescription: string;
  contextStateSnapshot: Record<string, string | number>;
  decisionTriggered?: string;
  wasOptimal: boolean;
}

export interface ReplayResult {
  id: string;
  replaySessionCode: string;
  targetHistoricalPeriod: {
    startDate: string;
    endDate: string;
  };
  originalDecisionId: string;
  originalDecisionTitle: string;
  actualRealizedValue: number;
  counterfactualOptimizedValue: number;
  potentialLiftPercentage: number;
  timeline: ReplayTimelineStep[];
  branches: CounterfactualBranch[];
  learningsIdentified: string[];
  executedAt: string;
}
