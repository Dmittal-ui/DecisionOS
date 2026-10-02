import type { InvestigationRepository } from "../investigation-repository";
import type {
  InvestigationWorkspace,
  InvestigationWorkspaceHypothesis,
} from "@/types/investigation-workspace";
import { apiFetch } from "./api-client";

export class ApiInvestigationRepository implements InvestigationRepository {
  async getWorkspaceByOpportunityCode(code: string): Promise<InvestigationWorkspace | null> {
    try {
      const data = await apiFetch<InvestigationWorkspace>(`/api/v1/investigation/${encodeURIComponent(code)}`);
      return data || null;
    } catch {
      return null;
    }
  }

  async getWorkspaceById(id: string): Promise<InvestigationWorkspace | null> {
    try {
      const data = await apiFetch<InvestigationWorkspace>(`/api/investigations/${encodeURIComponent(id)}`);
      return data || null;
    } catch {
      return null;
    }
  }

  async getHypotheses(workspaceId: string): Promise<InvestigationWorkspaceHypothesis[]> {
    const ws = await this.getWorkspaceById(workspaceId);
    return ws?.hypotheses || [];
  }
}
