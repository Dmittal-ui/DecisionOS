export type OpportunityUrgency = "critical" | "high" | "medium" | "low";
export type OpportunityStatus = "detected" | "in_investigation" | "decision_ready" | "executed" | "dismissed";
export type OpportunityCategory =
  | "pricing_optimization"
  | "churn_prevention"
  | "supply_chain"
  | "inventory_rebalance"
  | "cross_sell"
  | "operational_efficiency"
  | "revenue"
  | "growth"
  | "cost_reduction"
  | (string & {});

export interface OpportunityImpact {
  projectedRevenue: number;
  costReduction: number;
  netValue: number;
  confidenceScore: number; // 0 - 100
  timeToRealizationDays: number;
}

export interface Opportunity {
  id: string;
  code: string; // e.g. "OPP-8921"
  title: string;
  summary: string;
  category: OpportunityCategory;
  urgency: OpportunityUrgency;
  status: OpportunityStatus;
  impact: OpportunityImpact;
  affectedSegments: string[];
  detectedAt: string;
  expiresAt?: string;
  ownerId?: string;
  ownerName?: string;
  tags: string[];
}
