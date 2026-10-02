import type { DecisionDNARepository } from "../decision-dna-repository";
import type {
  DecisionDNARecord,
  DecisionDNASummaryStats,
  DecisionDNAFilterState,
} from "@/types/decision-dna";
import { apiFetch } from "./api-client";

export class ApiDecisionDNARepository implements DecisionDNARepository {
  async getDecisionDNARecords(
    filters?: Partial<DecisionDNAFilterState>
  ): Promise<DecisionDNARecord[]> {
    let records = await apiFetch<DecisionDNARecord[]>("/api/decision-dna");
    if (!Array.isArray(records)) return [];

    if (filters) {
      if (filters.status && filters.status !== "all") {
        records = records.filter((r) => r.status === filters.status);
      }
      if (filters.type && filters.type !== "all") {
        records = records.filter((r) => r.type === filters.type);
      }
      if (filters.owner && filters.owner !== "all") {
        records = records.filter((r) => r.owner === filters.owner);
      }
      if (filters.outcomeStatus && filters.outcomeStatus !== "all") {
        records = records.filter((r) => r.actualOutcome?.status === filters.outcomeStatus);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        records = records.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.decisionId.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.trigger.problemTitle.toLowerCase().includes(q) ||
            r.owner.toLowerCase().includes(q)
        );
      }
    }

    return records;
  }

  async getDecisionDNAById(id: string): Promise<DecisionDNARecord | null> {
    try {
      const data = await apiFetch<DecisionDNARecord>(`/api/decision-dna/${encodeURIComponent(id)}`);
      return data || null;
    } catch {
      return null;
    }
  }

  async getDecisionDNASummaryStats(): Promise<DecisionDNASummaryStats> {
    const records = await this.getDecisionDNARecords();
    const approved = records.filter((r) => r.status === "approved").length;
    const modified = records.filter((r) => r.status === "modified").length;
    const rejected = records.filter((r) => r.status === "rejected").length;
    const decisionsWithOutcomes = records.filter(
      (r) => r.actualOutcome?.status && r.actualOutcome?.status !== "pending"
    ).length;

    const validConfidenceScores = records
      .map((r) => r.confidence)
      .filter((c) => typeof c === "number" && !isNaN(c) && c > 0);

    const averageConfidence = validConfidenceScores.length > 0
      ? Math.round((validConfidenceScores.reduce((sum, score) => sum + score, 0) / validConfidenceScores.length) * 10) / 10
      : 0;

    return {
      totalDecisions: records.length,
      approved,
      modified,
      rejected,
      averageConfidence,
      decisionsWithOutcomes,
    };
  }
}
