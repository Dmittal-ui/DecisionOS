// ─── Phase 7 Decision Replay UI Types ─────────────────────────────────────────
// Clean typed schema designed to cleanly map to future POST /api/replay contract.

export type ReplayStatus = "idle" | "running" | "complete" | "error";

export interface HistoricalDecisionOption {
  id: string;
  code: string;
  title: string;
  date: string;
  actionTaken: string;
  owner: string;
  approvers: string[];
  constraint: string;
  reason: string;
  status: string;
  availableBranches: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export interface TimelineMetricChange {
  label: string;
  value: string;
  direction: "positive" | "negative" | "neutral";
}

export interface TimelineBranchStep {
  id: string;
  periodLabel: string; // e.g. "Week 1", "Week 2", "Week 4"
  date: string;
  eventTitle: string;
  explanation: string;
  metricChanges: TimelineMetricChange[];
  statusVariant: "neutral" | "warning" | "positive" | "critical";
}

export interface ReplayMetricComparison {
  key: string;
  label: string;
  actualValue: string;
  counterfactualValue: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  actualNum: number;
  counterfactualNum: number;
  unit: string;
  explanation?: string;
}

export interface CounterfactualInsight {
  headline: string;
  summary: string;
  revenueDiff: string;
  profitDiff: string;
  marginDiff: string;
  whatChangedExplanation: string;
}

export interface ReplayEvidence {
  supportingSignals: string[];
  constraintsPreserved: string[];
  evidenceSources: string[];
}

export interface ReplayUncertainty {
  confidenceScore: number;
  explanation: string;
  ranges: Array<{
    metric: string;
    range: string;
  }>;
}

export interface ReplayEvidenceProgressionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  timestamp: string;
  metricLabel?: string;
  metricValue?: string;
}

export interface ReplayWorkspaceData {
  decision: HistoricalDecisionOption;
  selectedBranchId: string;
  decisionPoint: {
    date: string;
    title: string;
    originalAction: string;
    description: string;
  };
  actualTimeline: TimelineBranchStep[];
  counterfactualTimeline: TimelineBranchStep[];
  metrics: ReplayMetricComparison[];
  insight: CounterfactualInsight;
  evidence: ReplayEvidence;
  uncertainty: ReplayUncertainty;
  evidenceProgression: ReplayEvidenceProgressionStep[];
}
