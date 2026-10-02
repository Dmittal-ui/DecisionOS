import type { ReplayRepository } from "../replay-repository";
import type {
  HistoricalDecisionOption,
  ReplayWorkspaceData,
} from "@/types/replay-workspace";
import {
  MOCK_HISTORICAL_DECISIONS,
  MOCK_REPLAY_WORKSPACES,
  DEFAULT_REPLAY_DECISION_ID,
} from "@/lib/mock-data/replay-workspace.mock";

export class MockReplayRepository implements ReplayRepository {
  private historicalDecisions: HistoricalDecisionOption[] = [...MOCK_HISTORICAL_DECISIONS];
  private workspaces: Record<string, ReplayWorkspaceData> = { ...MOCK_REPLAY_WORKSPACES };

  async getHistoricalDecisions(): Promise<HistoricalDecisionOption[]> {
    return [...this.historicalDecisions];
  }

  async getReplayWorkspace(decisionId: string): Promise<ReplayWorkspaceData | null> {
    const ws = this.workspaces[decisionId] ?? this.workspaces[DEFAULT_REPLAY_DECISION_ID];
    return ws ? { ...ws } : null;
  }

  async runReplaySimulation(
    decisionId: string,
    branchId: string
  ): Promise<ReplayWorkspaceData> {
    const baseWs = this.workspaces[decisionId] ?? this.workspaces[DEFAULT_REPLAY_DECISION_ID];
    return {
      ...baseWs,
      selectedBranchId: branchId,
    };
  }
}
