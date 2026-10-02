import type {
  DecisionItem,
  DecisionSummaryStats,
  DecisionFilterState,
  ModifiedConfiguration,
  RejectionDetails,
} from "@/types/decision-registry";

export interface DecisionRepository {
  getDecisions(filters?: Partial<DecisionFilterState>): Promise<DecisionItem[]>;
  getDecisionById(id: string): Promise<DecisionItem | null>;
  getDecisionSummaryStats(): Promise<DecisionSummaryStats>;
  approveDecision(id: string, approverName: string): Promise<DecisionItem>;
  modifyDecision(id: string, modifiedConfig: ModifiedConfiguration): Promise<DecisionItem>;
  rejectDecision(id: string, rejectionDetails: RejectionDetails): Promise<DecisionItem>;
}
