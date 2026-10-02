// ─── Phase 11 Decision DNA Types ───────────────────────────────────────────
// Schema representing the persistent, auditable Decision DNA record of a business decision.
// Answers: What was decided, why, triggers, evidence, alternatives, constraints,
// human action, expected vs actual outcomes, uncertainty, learning, lineage, and provenance.

export type DecisionDNAStatus =
  | "approved"
  | "modified"
  | "rejected"
  | "outcome_pending"
  | "recorded";

export type DecisionType =
  | "optimization"
  | "scenario"
  | "replay"
  | "investigation"
  | "manual";

export type DecisionOutcomeStatus =
  | "achieved"
  | "partially_achieved"
  | "missed"
  | "pending";

export type AlternativeStatus =
  | "selected"
  | "not_selected"
  | "rejected"
  | "considered";

export interface DecisionTrigger {
  problemTitle: string;
  description: string;
  detectedAt: string;
  metricAlert: string;
  opportunityId: string;
}

export interface DecisionDNAEvidence {
  id: string;
  signal: string;
  detail: string;
  metricImpact: string;
  confidenceContribution: number; // e.g. +14%
  source: string;
  timestamp: string;
  type: "efficiency" | "margin" | "sensitivity" | "inventory" | "price" | "telemetry";
}

export interface DecisionAlternative {
  id: string;
  name: string;
  description: string;
  marketingBudget: string;
  workingInventory: string;
  unitPrice: string;
  expectedRevenue: string;
  expectedProfit: string;
  expectedMargin: string;
  constraintsSatisfied: boolean;
  confidence: number;
  status: AlternativeStatus;
  rejectionReason?: string;
}

export interface DecisionDNAConstraint {
  id: string;
  name: string;
  rule: string;
  requiredLimit: string;
  selectedValue: string;
  status: "satisfied" | "violated" | "binding";
  slack: string;
}

export interface DecisionDNAConfiguration {
  marketingBudget: string;
  workingInventory: string;
  unitPrice: string;
  expectedRevenue: string;
  expectedProfit: string;
  expectedMargin: string;
  orders?: string;
  inventoryLevels?: string;
}

export interface ModificationDiff {
  originalMarketing: string;
  modifiedMarketing: string;
  originalInventory: string;
  modifiedInventory: string;
  originalPrice: string;
  modifiedPrice: string;
  rationale: string;
}

export interface HumanDecisionRecord {
  decisionMaker: string;
  role: string;
  action: "approved" | "modified" | "rejected" | "pending_review";
  decidedAt: string;
  reason: string;
  modificationDetails?: ModificationDiff;
}

export interface DecisionMetricOutcome {
  metric: string;
  expected: string;
  actual: string;
  variance: string;
  varianceType: "positive" | "negative" | "neutral";
}

export interface DecisionDNAOutcome {
  status: DecisionOutcomeStatus;
  recordedAt?: string;
  explanation: string;
  metrics: DecisionMetricOutcome[];
  summary: string;
}

export interface DecisionUncertaintyDetails {
  confidence: number;
  baseCaseProfit: string;
  downsideProfit: string;
  upsideProfit: string;
  revenueRange: string;
  grossProfitRange: string;
  keyDrivers: string[];
}

export interface DecisionDNALearning {
  isAvailable: boolean;
  whatWeExpected: string;
  whatHappened: string;
  whatWeLearned: string;
  nextTimeConsideration: string;
}

export interface DecisionLineageNode {
  stage: string;
  id: string;
  status: "completed" | "active" | "bypassed";
  timestamp: string;
  route: string;
  description: string;
}

export interface DecisionDNAProvenance {
  dnaId: string;
  decisionId: string;
  opportunityId: string;
  investigationId: string;
  replayId: string;
  scenarioId: string;
  optimizationId: string;
  verifiedBy: string;
  recordedAt: string;
}

export interface DecisionDNAAuditEvent {
  id: string;
  timestamp: string;
  time: string;
  actor: string;
  event: string;
  description: string;
  type:
    | "detected"
    | "investigated"
    | "simulated"
    | "optimized"
    | "reviewed"
    | "authorized"
    | "recorded"
    | "outcome_tracked"
    | "learning_updated";
}

export interface DecisionDNARecord {
  id: string; // e.g. "DNA-2026-001"
  decisionId: string; // e.g. "DEC-2026-REV-021"
  title: string;
  type: DecisionType;
  status: DecisionDNAStatus;
  createdAt: string;
  decisionDate: string;
  owner: string;
  organization: string;
  opportunityId: string;
  trigger: DecisionTrigger;
  businessQuestion: string;
  summary: string;
  currentConfiguration: DecisionDNAConfiguration;
  recommendedConfiguration: DecisionDNAConfiguration;
  selectedConfiguration: DecisionDNAConfiguration;
  evidence: DecisionDNAEvidence[];
  alternatives: DecisionAlternative[];
  constraints: DecisionDNAConstraint[];
  humanDecision: HumanDecisionRecord;
  expectedOutcome: DecisionDNAConfiguration;
  actualOutcome: DecisionDNAOutcome;
  uncertainty: DecisionUncertaintyDetails;
  learning: DecisionDNALearning;
  lineage: DecisionLineageNode[];
  provenance: DecisionDNAProvenance;
  auditEvents: DecisionDNAAuditEvent[];
  confidence: number;
}

export interface DecisionDNAFilterState {
  search: string;
  status: string;
  type: string;
  owner: string;
  outcomeStatus: string;
  opportunity: string;
  dateRange: string;
}

export interface DecisionDNASummaryStats {
  totalDecisions: number;
  approved: number;
  modified: number;
  rejected: number;
  averageConfidence: number;
  decisionsWithOutcomes: number;
}

// Preserve backward-compatible organizational traits if referenced elsewhere
export type BiasTendency = "loss_aversion" | "recency_bias" | "overconfidence" | "anchoring" | "status_quo" | "balanced";

export interface DecisionTrait {
  name: string;
  score: number;
  benchmarkAverage: number;
  interpretation: string;
}

export interface BiasProfile {
  detectedBias: BiasTendency;
  severityLevel: "low" | "moderate" | "high";
  affectedDecisionCount: number;
  remedyRecommendation: string;
}

export interface DecisionPatternCluster {
  id: string;
  clusterName: string;
  frequencyPercentage: number;
  successRatePercentage: number;
  averageDecisionCycleHours: number;
  keyCharacteristics: string[];
}

export interface DecisionDNA {
  organizationId: string;
  organizationName: string;
  dnaHealthScore: number;
  overallRiskTolerance: "risk_averse" | "moderate" | "growth_oriented" | "aggressive";
  traits: DecisionTrait[];
  biasProfiles: BiasProfile[];
  patternClusters: DecisionPatternCluster[];
  governanceComplianceScore: number;
  lastSynthesizedAt: string;
}
