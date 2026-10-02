export type DecisionStatus = "draft" | "pending_approval" | "approved" | "executing" | "executed" | "rejected" | "rolled_back";
export type DecisionImpactLevel = "enterprise" | "departmental" | "operational" | "tactical";

export interface DecisionStakeholderApproval {
  userId: string;
  userName: string;
  role: string;
  status: "approved" | "pending" | "rejected";
  timestamp?: string;
  notes?: string;
}

export interface DecisionAuditTrailEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
  previousState?: string;
  newState?: string;
}

export interface Decision {
  id: string;
  code: string; // e.g. "DEC-2026-0042"
  title: string;
  executiveSummary: string;
  rationale: string;
  impactLevel: DecisionImpactLevel;
  status: DecisionStatus;
  opportunityId?: string;
  estimatedValue: number;
  confidenceScore: number;
  ownerId: string;
  ownerName: string;
  approvals: DecisionStakeholderApproval[];
  executionDeadline?: string;
  auditTrail: DecisionAuditTrailEntry[];
  dnaSignatureId?: string;
  createdAt: string;
  updatedAt: string;
}
