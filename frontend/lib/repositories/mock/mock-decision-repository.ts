import type { DecisionRepository } from "../decision-repository";
import type {
  DecisionItem,
  DecisionSummaryStats,
  DecisionFilterState,
  ModifiedConfiguration,
  RejectionDetails,
} from "@/types/decision-registry";
import {
  MOCK_DECISION_REGISTRY_ITEMS,
  MOCK_DECISION_SUMMARY_STATS,
} from "@/lib/mock-data/decision-registry.mock";

export class MockDecisionRepository implements DecisionRepository {
  private decisions: DecisionItem[] = [...MOCK_DECISION_REGISTRY_ITEMS];

  async getDecisions(filters?: Partial<DecisionFilterState>): Promise<DecisionItem[]> {
    if (!filters) {
      return [...this.decisions];
    }

    return this.decisions.filter((item) => {
      if (filters.status && filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      if (filters.type && filters.type !== "all" && item.source !== filters.type) {
        return false;
      }
      if (filters.priority && filters.priority !== "all" && item.priority !== filters.priority) {
        return false;
      }
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesOwner = item.owner.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesOwner) return false;
      }
      return true;
    });
  }

  async getDecisionById(id: string): Promise<DecisionItem | null> {
    const item = this.decisions.find((d) => d.id === id || d.code === id);
    return item ? { ...item } : null;
  }

  async getDecisionSummaryStats(): Promise<DecisionSummaryStats> {
    const pending = this.decisions.filter((d) =>
      ["under_review", "proposed"].includes(d.status)
    ).length;
    const approved = this.decisions.filter((d) => d.status === "approved").length;
    const modified = this.decisions.filter((d) => d.status === "modified").length;
    const rejected = this.decisions.filter((d) => d.status === "rejected").length;

    return {
      total: this.decisions.length,
      pending,
      approved,
      modified,
      rejected,
      lastUpdated: "Just now",
    };
  }

  async approveDecision(id: string, approverName: string): Promise<DecisionItem> {
    const decision = this.decisions.find((d) => d.id === id || d.code === id);
    if (!decision) {
      throw new Error(`Decision with id ${id} not found`);
    }

    decision.status = "approved";
    decision.updatedAt = new Date().toISOString();
    decision.auditTimeline.push({
      id: `aud-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
      event: "Decision approved without modifications",
      actor: approverName,
      type: "approved",
    });

    return { ...decision };
  }

  async modifyDecision(
    id: string,
    modifiedConfig: ModifiedConfiguration
  ): Promise<DecisionItem> {
    const decision = this.decisions.find((d) => d.id === id || d.code === id);
    if (!decision) {
      throw new Error(`Decision with id ${id} not found`);
    }

    decision.status = "modified";
    decision.modifiedConfig = modifiedConfig;
    decision.updatedAt = new Date().toISOString();
    decision.auditTimeline.push({
      id: `aud-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
      event: `Human-modified configuration authorized (${modifiedConfig.marketingBudget} Mktg, ${modifiedConfig.workingInventory} Inv, ${modifiedConfig.unitPrice} Price)`,
      actor: modifiedConfig.modifiedBy,
      type: "modified",
    });

    return { ...decision };
  }

  async rejectDecision(
    id: string,
    rejectionDetails: RejectionDetails
  ): Promise<DecisionItem> {
    const decision = this.decisions.find((d) => d.id === id || d.code === id);
    if (!decision) {
      throw new Error(`Decision with id ${id} not found`);
    }

    decision.status = "rejected";
    decision.rejectionDetails = rejectionDetails;
    decision.updatedAt = new Date().toISOString();
    decision.auditTimeline.push({
      id: `aud-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
      event: `Decision rejected: "${rejectionDetails.reason}"`,
      actor: rejectionDetails.rejectedBy,
      type: "rejected",
    });

    return { ...decision };
  }
}
