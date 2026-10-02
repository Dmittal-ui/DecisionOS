import type { ScenarioRepository } from "../scenario-repository";
import type {
  ScenarioWorkspaceData,
  DecisionLeverValues,
  SavedScenario,
  ScenarioPreset,
  DecisionLeverConfig,
  SimulationHistoryEntry,
} from "@/types/scenario-workspace";
import {
  DECISION_LEVER_CONFIGS,
  SCENARIO_PRESETS,
  MOCK_SCENARIO_WORKSPACES,
  MOCK_SIMULATION_HISTORY,
  INITIAL_SAVED_SCENARIOS,
  DEFAULT_PRESET_ID,
} from "@/lib/mock-data/scenario-workspace.mock";

export class MockScenarioRepository implements ScenarioRepository {
  private savedScenarios: SavedScenario[] = [...INITIAL_SAVED_SCENARIOS];

  async getPresets(): Promise<ScenarioPreset[]> {
    return [...SCENARIO_PRESETS];
  }

  async getLeverConfigs(): Promise<DecisionLeverConfig[]> {
    return [...DECISION_LEVER_CONFIGS];
  }

  async getWorkspaceByPresetId(presetId: string): Promise<ScenarioWorkspaceData | null> {
    const ws = MOCK_SCENARIO_WORKSPACES[presetId] ?? MOCK_SCENARIO_WORKSPACES[DEFAULT_PRESET_ID];
    return ws ? { ...ws } : null;
  }

  async getAllWorkspaces(): Promise<Record<string, ScenarioWorkspaceData>> {
    return { ...MOCK_SCENARIO_WORKSPACES };
  }

  async runSimulation(presetId: string, levers: DecisionLeverValues): Promise<ScenarioWorkspaceData> {
    const baseWs = MOCK_SCENARIO_WORKSPACES[presetId] ?? MOCK_SCENARIO_WORKSPACES[DEFAULT_PRESET_ID];
    return {
      ...baseWs,
      levers: { ...levers },
      lastSimulatedAt: "Just now",
    };
  }

  async getSavedScenarios(): Promise<SavedScenario[]> {
    return [...this.savedScenarios];
  }

  async saveScenario(scenario: Omit<SavedScenario, "id" | "createdAt">): Promise<SavedScenario> {
    const newScenario: SavedScenario = {
      ...scenario,
      id: `saved_${Date.now()}`,
      createdAt: "Today",
    };
    this.savedScenarios.unshift(newScenario);
    return { ...newScenario };
  }

  async getSimulationHistory(): Promise<SimulationHistoryEntry[]> {
    return [...MOCK_SIMULATION_HISTORY];
  }
}
