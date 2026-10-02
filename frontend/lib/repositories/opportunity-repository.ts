import type { Opportunity } from "@/types/opportunity";

export interface OpportunityFilterParams {
  search?: string;
  status?: string;
  category?: string;
  urgency?: string;
  timeframe?: string;
  assignee?: string;
}

export interface OpportunityRepository {
  getOpportunities(filters?: OpportunityFilterParams): Promise<Opportunity[]>;
  getOpportunityById(id: string): Promise<Opportunity | null>;
  getPriorityOpportunity(): Promise<Opportunity | null>;
  getFeaturedOpportunities(limit?: number): Promise<Opportunity[]>;
  refreshRadar(): Promise<Opportunity[]>;
}
