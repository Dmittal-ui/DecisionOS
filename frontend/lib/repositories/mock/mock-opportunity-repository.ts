import type {
  OpportunityRepository,
  OpportunityFilterParams,
} from "../opportunity-repository";
import type { Opportunity } from "@/types/opportunity";
import { MOCK_OPPORTUNITIES } from "@/lib/mock-data/opportunities.mock";

export class MockOpportunityRepository implements OpportunityRepository {
  private opportunities: Opportunity[] = [...MOCK_OPPORTUNITIES];

  async getOpportunities(filters?: OpportunityFilterParams): Promise<Opportunity[]> {
    if (!filters) {
      return [...this.opportunities];
    }

    return this.opportunities.filter((opp) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesCode = opp.code.toLowerCase().includes(q);
        const matchesDesc = opp.summary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDesc) return false;
      }
      if (filters.status && filters.status !== "all" && opp.status !== filters.status) {
        return false;
      }
      if (filters.category && filters.category !== "all" && opp.category !== filters.category) {
        return false;
      }
      if (filters.urgency && filters.urgency !== "all" && opp.urgency !== filters.urgency) {
        return false;
      }
      return true;
    });
  }

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const opp = this.opportunities.find((o) => o.id === id || o.code === id);
    return opp ? { ...opp } : null;
  }

  async getPriorityOpportunity(): Promise<Opportunity | null> {
    const opp = this.opportunities.find((o) => o.code === "OPP-9021") ?? this.opportunities[0];
    return opp ? { ...opp } : null;
  }

  async getFeaturedOpportunities(limit = 4): Promise<Opportunity[]> {
    return this.opportunities.slice(0, limit);
  }

  async refreshRadar(): Promise<Opportunity[]> {
    return [...this.opportunities];
  }
}
