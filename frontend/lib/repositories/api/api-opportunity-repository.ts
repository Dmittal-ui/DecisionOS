import type {
  OpportunityRepository,
  OpportunityFilterParams,
} from "../opportunity-repository";
import type { Opportunity } from "@/types/opportunity";
import { apiFetch } from "./api-client";

export class ApiOpportunityRepository implements OpportunityRepository {
  async getOpportunities(filters?: OpportunityFilterParams): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters?.category && filters.category !== "all") {
      params.set("category", filters.category);
    }
    if (filters?.urgency && filters.urgency !== "all") {
      params.set("urgency", filters.urgency);
    }
    if (filters?.search) {
      params.set("search", filters.search);
    }

    const qs = params.toString();
    const endpoint = qs ? `/api/opportunities?${qs}` : "/api/opportunities";
    const data = await apiFetch<Opportunity[]>(endpoint);
    return Array.isArray(data) ? data : [];
  }

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    try {
      const opp = await apiFetch<Opportunity>(`/api/opportunities/${id}`);
      return opp || null;
    } catch {
      return null;
    }
  }

  async getPriorityOpportunity(): Promise<Opportunity | null> {
    const opps = await this.getOpportunities();
    if (!opps.length) return null;
    // Return the highest-impact opportunity from the real backend list.
    // The backend sorts by impact.net_value desc, so opps[0] is already the priority one.
    return opps[0];
  }

  async getFeaturedOpportunities(limit = 4): Promise<Opportunity[]> {
    const opps = await this.getOpportunities();
    return opps.slice(0, limit);
  }

  async refreshRadar(): Promise<Opportunity[]> {
    try {
      await apiFetch("/api/opportunities/scan", { method: "POST" });
    } catch {
      // Fallback to querying current list
    }
    return this.getOpportunities();
  }
}
