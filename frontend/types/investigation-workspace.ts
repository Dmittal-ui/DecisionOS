// ─── Phase 6 Investigation UI Types ──────────────────────────────────────────
// Separate from the Phase 1 Investigation scaffold in investigation.ts.
// These types are specifically designed for the visual Investigation workspace.

export type InvestigationEvidenceStrength = "high" | "medium" | "low";
export type InvestigationEvidenceDirection = "supporting" | "contradicting" | "neutral";

export type InvestigationHypothesisStatus =
  | "leading"
  | "strong_evidence"
  | "moderate_evidence"
  | "weak_evidence"
  | "under_investigation";

export type InvestigationTreeNodeStatus =
  | "root"
  | "active"
  | "supporting"
  | "conflicting"
  | "neutral"
  | "root_cause_candidate";

export type InvestigationSignalDirection = "positive" | "negative" | "neutral";
export type InvestigationSignalGroup = "positive" | "negative" | "monitoring";

// ─── Signal ──────────────────────────────────────────────────────────────────

export interface InvestigationWorkspaceSignal {
  id: string;
  label: string;
  metric: string;
  value: string;
  direction: InvestigationSignalDirection;
  group: InvestigationSignalGroup;
  description?: string;
}

// ─── Evidence Item ────────────────────────────────────────────────────────────

export interface InvestigationWorkspaceEvidence {
  id: string;
  description: string;
  metric?: string;
  value?: string;
  direction: InvestigationEvidenceDirection;
  strength: InvestigationEvidenceStrength;
  source?: string;
}

// ─── Hypothesis ───────────────────────────────────────────────────────────────

export interface InvestigationWorkspaceHypothesis {
  id: string;
  label: string; // "A", "B", "C"
  title: string;
  description: string;
  confidenceScore: number; // 0-100
  status: InvestigationHypothesisStatus;
  evidenceItems: InvestigationWorkspaceEvidence[];
  affectedMetrics: string[];
  supportingSignals: string[];
  contradictingSignals: string[];
}

// ─── Decision Tree Node ───────────────────────────────────────────────────────

export interface InvestigationTreeNode {
  id: string;
  label: string;
  metric?: string;
  value?: string;
  status: InvestigationTreeNodeStatus;
  confidenceScore?: number;
  hypothesisId?: string;
  evidenceIds?: string[];
  description?: string;
  children?: InvestigationTreeNode[];
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

export type InvestigationTimelineEventType =
  | "detection"
  | "signal"
  | "hypothesis"
  | "comparison"
  | "ready";

export interface InvestigationTimelineEvent {
  id: string;
  time: string;
  label: string;
  description?: string;
  type: InvestigationTimelineEventType;
}

// ─── Investigation Workspace ──────────────────────────────────────────────────

export interface InvestigationWorkspace {
  id: string;
  opportunityCode: string;
  opportunityId: string;
  overallConfidence: number;
  summary: string;
  leadingHypothesisId: string;
  signals: InvestigationWorkspaceSignal[];
  hypotheses: InvestigationWorkspaceHypothesis[];
  treeRoot: InvestigationTreeNode;
  timeline: InvestigationTimelineEvent[];
  startedAt: string;
  updatedAt: string;
}
