import type {
  OptimizerRepository,
  OptimizerRunRequest,
} from "../optimizer-repository";
import type {
  OptimizerWorkspaceData,
  OptimizerResultRow,
  RecommendedConfiguration,
  OptimizerSearchSummary,
  SavedOptimizerConfig,
  OptimizerObjectiveKey,
  OptimizerConfidence,
} from "@/types/optimizer-workspace";
import { apiFetch } from "./api-client";

const OBJECTIVE_KEYS: OptimizerObjectiveKey[] = [
  "maximize_gross_profit",
  "maximize_revenue",
  "maximize_operating_margin",
  "minimize_inventory",
];

const CONFIDENCE_NOT_CALCULATED: OptimizerConfidence = {
  available: false,
  score: 0,
  explanation: "Confidence interval not calculated",
  ranges: [],
  disclaimer:
    "The optimizer is a deterministic discrete grid search. No probabilistic confidence interval is computed.",
};

const EMPTY_SEARCH_SUMMARY: OptimizerSearchSummary = {
  totalCandidates: 0,
  feasibleCount: 0,
  infeasibleCount: 0,
  bestConfigId: "",
  bestConfigLabel: "—",
  bindingConstraint: "",
  solverTimeMs: 0,
};

function mapObjective(raw: unknown): OptimizerObjectiveKey {
  if (typeof raw === "string" && (OBJECTIVE_KEYS as string[]).includes(raw)) {
    return raw as OptimizerObjectiveKey;
  }
  return "maximize_gross_profit";
}

function mapSearchSummary(summary: Record<string, unknown> | null | undefined): OptimizerSearchSummary {
  if (!summary || typeof summary !== "object") {
    return { ...EMPTY_SEARCH_SUMMARY };
  }
  const id = typeof summary.optimalConfigId === "string" ? summary.optimalConfigId : "";
  return {
    totalCandidates: Number(summary.totalConfigurationsEvaluated ?? 0),
    feasibleCount: Number(summary.feasibleConfigurations ?? 0),
    infeasibleCount: Number(summary.infeasibleConfigurations ?? 0),
    bestConfigId: id,
    bestConfigLabel: id || "—",
    bindingConstraint: typeof summary.bindingConstraint === "string" ? summary.bindingConstraint : "",
    solverTimeMs: Number(summary.solverDurationMs ?? 0),
  };
}

function mapHistory(raw: unknown[]): OptimizerWorkspaceData["history"] {
  return (raw || []).map((entry: any) => ({
    id: String(entry?.id ?? ""),
    timestamp: String(entry?.timestamp ?? ""),
    objective: String(entry?.objective ?? ""),
    result: String(entry?.result ?? ""),
    status: entry?.status === "infeasible" ? "infeasible" : entry?.status === "feasible" ? "feasible" : "optimal",
  }));
}

function mapWorkspace(backendData: any): OptimizerWorkspaceData {
  return {
    selectedObjective: mapObjective(backendData?.objective),
    runStatus: "complete",
    currentStep: null,
    objectives: Array.isArray(backendData?.objectives) ? backendData.objectives : [],
    decisionVariables: Array.isArray(backendData?.decisionVariables) ? backendData.decisionVariables : [],
    hardConstraints: Array.isArray(backendData?.hardConstraints) ? backendData.hardConstraints : [],
    feasibleSolutions: Array.isArray(backendData?.feasibleSolutions) ? backendData.feasibleSolutions : [],
    searchSummary: mapSearchSummary(backendData?.summary),
    results: Array.isArray(backendData?.results) ? backendData.results : [],
    recommendation: backendData?.recommendation ?? backendData?.recommendedConfiguration ?? null,
    sensitivity: Array.isArray(backendData?.sensitivity) ? backendData.sensitivity : [],
    tradeoffs: Array.isArray(backendData?.tradeoffs) ? backendData.tradeoffs : [],
    paretoFrontier: Array.isArray(backendData?.paretoFrontier) ? backendData.paretoFrontier : [],
    confidence: CONFIDENCE_NOT_CALCULATED,
    history: mapHistory(Array.isArray(backendData?.history) ? backendData.history : []),
  };
}

export class ApiOptimizerRepository implements OptimizerRepository {
  private savedConfigs: SavedOptimizerConfig[] = [];

  async getOptimizerWorkspace(): Promise<OptimizerWorkspaceData> {
    const data = await apiFetch<any>("/api/optimizer");
    return mapWorkspace(data);
  }

  async runOptimization(request: OptimizerRunRequest): Promise<{
    results: OptimizerResultRow[];
    recommendation: RecommendedConfiguration | null;
    summary: OptimizerSearchSummary;
  }> {
    const data = await apiFetch<any>("/api/optimizer", {
      method: "POST",
      body: JSON.stringify({
        objective: request.objective,
        hardConstraints: request.customConstraints,
      }),
    });

    return {
      results: Array.isArray(data?.results) ? data.results : [],
      recommendation: data?.recommendation ?? data?.recommendedConfiguration ?? null,
      summary: mapSearchSummary(data?.summary),
    };
  }

  async getSavedConfigurations(): Promise<SavedOptimizerConfig[]> {
    return [...this.savedConfigs];
  }

  async saveConfiguration(
    config: Omit<SavedOptimizerConfig, "id" | "createdAt">
  ): Promise<SavedOptimizerConfig> {
    const saved: SavedOptimizerConfig = {
      ...config,
      id: `saved-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.savedConfigs.unshift(saved);
    return saved;
  }
}
