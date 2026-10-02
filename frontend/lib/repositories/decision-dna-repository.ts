import type {
  DecisionDNARecord,
  DecisionDNASummaryStats,
  DecisionDNAFilterState,
} from "@/types/decision-dna";

export interface DecisionDNARepository {
  getDecisionDNARecords(filters?: Partial<DecisionDNAFilterState>): Promise<DecisionDNARecord[]>;
  getDecisionDNAById(id: string): Promise<DecisionDNARecord | null>;
  getDecisionDNASummaryStats(): Promise<DecisionDNASummaryStats>;
}
