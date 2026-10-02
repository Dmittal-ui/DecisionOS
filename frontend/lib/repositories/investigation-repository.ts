import type {
  InvestigationWorkspace,
  InvestigationWorkspaceHypothesis,
} from "@/types/investigation-workspace";

export interface InvestigationRepository {
  getWorkspaceByOpportunityCode(code: string): Promise<InvestigationWorkspace | null>;
  getWorkspaceById(id: string): Promise<InvestigationWorkspace | null>;
  getHypotheses(workspaceId: string): Promise<InvestigationWorkspaceHypothesis[]>;
}
