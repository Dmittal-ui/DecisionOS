import type {
  OptimizerWorkspaceData,
  OptimizerObjectiveKey,
  OptimizerResultRow,
  RecommendedConfiguration,
  OptimizerSearchSummary,
  SavedOptimizerConfig,
} from "@/types/optimizer-workspace";

export interface OptimizerRunRequest {
  objective: OptimizerObjectiveKey;
  customConstraints?: Record<string, number>;
}

export interface OptimizerRepository {
  getOptimizerWorkspace(): Promise<OptimizerWorkspaceData>;
  runOptimization(request: OptimizerRunRequest): Promise<{
    results: OptimizerResultRow[];
    recommendation: RecommendedConfiguration | null;
    summary: OptimizerSearchSummary;
  }>;
  getSavedConfigurations(): Promise<SavedOptimizerConfig[]>;
  saveConfiguration(config: Omit<SavedOptimizerConfig, "id" | "createdAt">): Promise<SavedOptimizerConfig>;
}
