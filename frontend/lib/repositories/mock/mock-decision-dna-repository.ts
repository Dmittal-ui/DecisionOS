import type { DecisionDNARepository } from "../decision-dna-repository";
import type {
  DecisionDNARecord,
  DecisionDNASummaryStats,
  DecisionDNAFilterState,
} from "@/types/decision-dna";
import {
  MOCK_DECISION_DNA_RECORDS,
  MOCK_DECISION_DNA_STATS,
} from "@/lib/mock-data/decision-dna.mock";

export class MockDecisionDNARepository implements DecisionDNARepository {
  private records: DecisionDNARecord[] = [...MOCK_DECISION_DNA_RECORDS];

  async getDecisionDNARecords(
    filters?: Partial<DecisionDNAFilterState>
  ): Promise<DecisionDNARecord[]> {
    if (!filters) {
      return [...this.records];
    }

    return this.records.filter((r) => {
      if (filters.status && filters.status !== "all" && r.status !== filters.status) {
        return false;
      }
      if (filters.type && filters.type !== "all" && r.type !== filters.type) {
        return false;
      }
      if (filters.owner && filters.owner !== "all" && r.owner !== filters.owner) {
        return false;
      }
      if (filters.outcomeStatus && filters.outcomeStatus !== "all" && r.actualOutcome.status !== filters.outcomeStatus) {
        return false;
      }
      if (filters.opportunity && filters.opportunity !== "all" && r.opportunityId !== filters.opportunity) {
        return false;
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesDecId = r.decisionId.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesTrigger = r.trigger.problemTitle.toLowerCase().includes(q);
        const matchesOwner = r.owner.toLowerCase().includes(q);
        if (!matchesId && !matchesDecId && !matchesTitle && !matchesTrigger && !matchesOwner) {
          return false;
        }
      }
      return true;
    });
  }

  async getDecisionDNAById(id: string): Promise<DecisionDNARecord | null> {
    const item = this.records.find((r) => r.id === id || r.decisionId === id);
    return item ? { ...item } : null;
  }

  async getDecisionDNASummaryStats(): Promise<DecisionDNASummaryStats> {
    const approved = this.records.filter((r) => r.status === "approved").length;
    const modified = this.records.filter((r) => r.status === "modified").length;
    const rejected = this.records.filter((r) => r.status === "rejected").length;
    const avgConfidence = Math.round(
      this.records.reduce((acc, r) => acc + r.confidence, 0) / (this.records.length || 1)
    );
    const withOutcomes = this.records.filter((r) => r.actualOutcome.status !== "pending").length;

    return {
      totalDecisions: this.records.length,
      approved,
      modified,
      rejected,
      averageConfidence: avgConfidence,
      decisionsWithOutcomes: withOutcomes,
    };
  }
}
