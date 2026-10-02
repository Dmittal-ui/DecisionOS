// ─── Phase 10 Decision Approval / Decision Registry Types ─────────────────────
// Schema representing decisions, human approvals, modifications, rejections,
// constraint verification, evidence chains, audit timelines, and provenance.
// Compatible with future GET /api/decisions and POST /api/decisions/:id/* contracts.

export type DecisionRegistryStatus =
  | "proposed"
  | "under_review"
  | "approved"
  | "modified"
  | "rejected"
  | "recorded";

// Alias for convenience within decision workspace
export type DecisionStatus = DecisionRegistryStatus;

export type DecisionType =
  | "optimization"
  | "scenario"
  | "replay"
  | "investigation"
  | "manual";

export type DecisionPriority = "critical" | "high" | "medium" | "low";

export interface DecisionVariableConfig {
  marketingBudget: string;
  workingInventory: string;
  unitPrice: string;
  [key: string]: string;
}

export interface DecisionProjectedOutcomes {
  grossProfit: string;
  revenue: string;
  operatingMargin: string;
  [key: string]: string;
}

export interface DecisionRecommendation {
  variables: DecisionVariableConfig;
  projectedOutcomes: DecisionProjectedOutcomes;
  constraintsSatisfied: boolean;
  statusNote: string;
}

export interface DecisionComparisonItem {
  metric: string;
  current: string;
  recommended: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface DecisionConstraint {
  id: string;
  name: string;
  limit: string;
  recommended: string;
  slack: string;
  status: "satisfied" | "violated" | "binding";
}

export interface DecisionEvidenceItem {
  title: string;
  signal: string;
  detail: string;
  type: "efficiency" | "margin" | "sensitivity" | "inventory" | "price";
}

export interface DecisionAuditTimelineItem {
  id: string;
  time: string;
  timestamp: string;
  event: string;
  actor: string;
  type: "generated" | "review" | "evidence" | "constraint" | "approved" | "modified" | "rejected" | "recorded";
}

export interface DecisionProvenance {
  opportunityId: string;
  investigationId: string;
  replayId: string;
  scenarioId: string;
  optimizerId: string;
}

export interface DecisionConfidenceDetails {
  score: number;
  highConfidenceSignals: number;
  supportingEvidence: number;
  constraintsVerified: number;
  totalConstraints: number;
  explanation: string;
  projectedProfitRange: string;
  projectedRevenueRange: string;
  uncertaintyExplanation: string;
}

export interface ModifiedConfiguration {
  marketingBudget: string;
  workingInventory: string;
  unitPrice: string;
  modifiedAt: string;
  modifiedBy: string;
  notes?: string;
}

export interface RejectionDetails {
  reason: string;
  notes?: string;
  rejectedAt: string;
  rejectedBy: string;
}

export interface DecisionItem {
  id: string;
  code: string; // e.g. "DEC-2026-MKT-018"
  title: string;
  source: DecisionType;
  objective: string;
  impact: string;
  impactNum: number;
  confidence: number;
  status: DecisionRegistryStatus;
  priority: DecisionPriority;
  owner: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  recommendation: DecisionRecommendation;
  comparisons: DecisionComparisonItem[];
  constraints: DecisionConstraint[];
  evidence: DecisionEvidenceItem[];
  confidenceDetails: DecisionConfidenceDetails;
  auditTimeline: DecisionAuditTimelineItem[];
  provenance: DecisionProvenance;
  modifiedConfig?: ModifiedConfiguration;
  rejectionDetails?: RejectionDetails;
}

export interface DecisionFilterState {
  status: string;
  type: string;
  priority: string;
  search: string;
  dateRange: string;
}

export interface DecisionSummaryStats {
  total: number;
  pending: number;
  approved: number;
  modified: number;
  rejected: number;
  lastUpdated: string;
}
