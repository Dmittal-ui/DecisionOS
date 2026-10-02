import type { DecisionRepository } from "../decision-repository";
import type {
  DecisionItem,
  DecisionSummaryStats,
  DecisionFilterState,
  ModifiedConfiguration,
  RejectionDetails,
} from "@/types/decision-registry";
import { apiFetch } from "./api-client";

export class ApiDecisionRepository implements DecisionRepository {
  async getDecisions(filters?: Partial<DecisionFilterState>): Promise<DecisionItem[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    const qs = params.toString();
    const endpoint = qs ? `/api/decisions?${qs}` : "/api/decisions";
    let items = await apiFetch<DecisionItem[]>(endpoint);
    if (!Array.isArray(items)) return [];

    if (filters) {
      if (filters.type && filters.type !== "all") {
        items = items.filter((d) => d.source === filters.type);
      }
      if (filters.priority && filters.priority !== "all") {
        items = items.filter((d) => d.priority === filters.priority);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (d) =>
            d.code.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            d.owner.toLowerCase().includes(q)
        );
      }
    }

    return items;
  }

  async getDecisionById(id: string): Promise<DecisionItem | null> {
    try {
      const data = await apiFetch<DecisionItem>(`/api/decisions/${encodeURIComponent(id)}`);
      return data || null;
    } catch {
      return null;
    }
  }

  async getDecisionSummaryStats(): Promise<DecisionSummaryStats> {
    const decisions = await this.getDecisions();
    const pending = decisions.filter((d) =>
      ["under_review", "proposed"].includes(d.status)
    ).length;
    const approved = decisions.filter((d) => d.status === "approved").length;
    const modified = decisions.filter((d) => d.status === "modified").length;
    const rejected = decisions.filter((d) => d.status === "rejected").length;

    return {
      total: decisions.length,
      pending,
      approved,
      modified,
      rejected,
      lastUpdated: "Live",
    };
  }

  async approveDecision(id: string, approverName: string): Promise<DecisionItem> {
    const data = await apiFetch<DecisionItem>(`/api/decisions/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({
        approverName,
        approverRole: "Authorized Stakeholder",
        notes: "Approved via Decision Registry command center.",
      }),
    });
    return data;
  }

  async modifyDecision(
    id: string,
    modifiedConfig: ModifiedConfiguration
  ): Promise<DecisionItem> {
    const data = await apiFetch<DecisionItem>(`/api/decisions/${encodeURIComponent(id)}/modify`, {
      method: "POST",
      body: JSON.stringify(modifiedConfig),
    });
    return data;
  }

  async rejectDecision(
    id: string,
    rejectionDetails: RejectionDetails
  ): Promise<DecisionItem> {
    const data = await apiFetch<DecisionItem>(`/api/decisions/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: JSON.stringify(rejectionDetails),
    });
    return data;
  }
}
