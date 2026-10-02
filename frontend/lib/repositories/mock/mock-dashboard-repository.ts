import type { DashboardRepository } from "../dashboard-repository";
import type { DashboardData } from "@/types/dashboard";
import type { Opportunity } from "@/types/opportunity";
import type { Decision } from "@/types/decision";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock-data/dashboard.mock";
import { MOCK_OPPORTUNITIES } from "@/lib/mock-data/opportunities.mock";
import { MOCK_DECISIONS } from "@/lib/mock-data/decisions.mock";

export class MockDashboardRepository implements DashboardRepository {
  async getDashboardData(): Promise<DashboardData> {
    return { ...MOCK_DASHBOARD_DATA };
  }

  async getTopOpportunities(limit = 3): Promise<Opportunity[]> {
    return MOCK_OPPORTUNITIES.slice(0, limit);
  }

  async getRecentDecisions(limit = 4): Promise<Decision[]> {
    return MOCK_DECISIONS.slice(0, limit);
  }
}
