import type { DashboardData } from "@/types/dashboard";
import type { Opportunity } from "@/types/opportunity";
import type { Decision } from "@/types/decision";

export interface DashboardRepository {
  getDashboardData(): Promise<DashboardData>;
  getTopOpportunities(limit?: number): Promise<Opportunity[]>;
  getRecentDecisions(limit?: number): Promise<Decision[]>;
}
