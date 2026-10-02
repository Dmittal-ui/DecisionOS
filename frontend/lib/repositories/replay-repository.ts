import type {
  HistoricalDecisionOption,
  ReplayWorkspaceData,
} from "@/types/replay-workspace";

export interface ReplayRepository {
  getHistoricalDecisions(): Promise<HistoricalDecisionOption[]>;
  getReplayWorkspace(decisionId: string): Promise<ReplayWorkspaceData | null>;
  runReplaySimulation(decisionId: string, branchId: string): Promise<ReplayWorkspaceData>;
}
