export type InvestigationStatus = "open" | "in_progress" | "synthesizing" | "completed" | "archived";
export type AnomalySeverity = "critical" | "high" | "moderate" | "low";

export interface RootCauseFactor {
  id: string;
  name: string;
  contributionWeight: number; // 0 - 100 percentage
  description: string;
  evidenceDataPointsCount: number;
}

export interface InvestigationEvidence {
  id: string;
  source: string;
  type: "metric_anomaly" | "correlation_shift" | "external_benchmark" | "behavioral_cluster";
  description: string;
  significanceScore: number;
  timestamp: string;
}

export interface Investigation {
  id: string;
  code: string; // e.g. "INV-4019"
  opportunityId?: string;
  title: string;
  hypothesis: string;
  severity: AnomalySeverity;
  status: InvestigationStatus;
  leadInvestigator: string;
  rootCauses: RootCauseFactor[];
  evidence: InvestigationEvidence[];
  findingsSummary: string;
  recommendedActionCount: number;
  createdAt: string;
  updatedAt: string;
}
