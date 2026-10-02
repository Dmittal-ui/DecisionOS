import type { InvestigationRepository } from "../investigation-repository";
import type {
  InvestigationWorkspace,
  InvestigationWorkspaceHypothesis,
} from "@/types/investigation-workspace";
import {
  MOCK_INVESTIGATION_WORKSPACES,
  DEFAULT_INVESTIGATION_WORKSPACE,
  getInvestigationWorkspace,
} from "@/lib/mock-data/investigation-workspace.mock";

export class MockInvestigationRepository implements InvestigationRepository {
  private workspaces: InvestigationWorkspace[] = [...MOCK_INVESTIGATION_WORKSPACES];

  async getWorkspaceByOpportunityCode(code: string): Promise<InvestigationWorkspace | null> {
    const ws = getInvestigationWorkspace(code) ?? DEFAULT_INVESTIGATION_WORKSPACE;
    return ws ? { ...ws } : null;
  }

  async getWorkspaceById(id: string): Promise<InvestigationWorkspace | null> {
    const ws = this.workspaces.find((w) => w.id === id);
    return ws ? { ...ws } : null;
  }

  async getHypotheses(workspaceId: string): Promise<InvestigationWorkspaceHypothesis[]> {
    const ws = this.workspaces.find((w) => w.id === workspaceId);
    return ws ? [...ws.hypotheses] : [];
  }
}
