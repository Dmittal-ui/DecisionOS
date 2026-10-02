import type {
  ScenarioWorkspaceData,
  DecisionLeverValues,
  SavedScenario,
  ScenarioPreset,
  DecisionLeverConfig,
  SimulationHistoryEntry,
} from "@/types/scenario-workspace";

export interface ScenarioRepository {
  getPresets(): Promise<ScenarioPreset[]>;
  getLeverConfigs(): Promise<DecisionLeverConfig[]>;
  getWorkspaceByPresetId(presetId: string): Promise<ScenarioWorkspaceData | null>;
  getAllWorkspaces(): Promise<Record<string, ScenarioWorkspaceData>>;
  runSimulation(presetId: string, levers: DecisionLeverValues): Promise<ScenarioWorkspaceData>;
  getSavedScenarios(): Promise<SavedScenario[]>;
  saveScenario(scenario: Omit<SavedScenario, "id" | "createdAt">): Promise<SavedScenario>;
  getSimulationHistory(): Promise<SimulationHistoryEntry[]>;
}
