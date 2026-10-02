import type { ScenarioRepository } from "../scenario-repository";
import type {
  ScenarioWorkspaceData,
  DecisionLeverValues,
  SavedScenario,
  ScenarioPreset,
  DecisionLeverConfig,
  SimulationHistoryEntry,
} from "@/types/scenario-workspace";
import { apiFetch } from "./api-client";

// ─── Static lever UI configuration ────────────────────────────────────────────
// These are global UI parameters (min/max/step/label) for the scenario sliders.
// They are NOT business data and do NOT come from the tenant's dataset.
// They are defined here rather than imported from mock-data so the live API
// repository has zero dependency on any mock workspace file.
const LIVE_LEVER_CONFIGS: DecisionLeverConfig[] = [
  {
    key: "marketingBudget",
    label: "Marketing Budget",
    min: 1.0,
    max: 2.5,
    step: 0.05,
    unit: "₹ Cr",
    baseline: 1.4,
    description: "Total discretionary digital acquisition and brand spend.",
  },
  {
    key: "workingInventory",
    label: "Working Inventory",
    min: 500,
    max: 1500,
    step: 25,
    unit: "units",
    baseline: 1000,
    description: "Base active inventory held in fulfillment centers.",
  },
  {
    key: "unitPrice",
    label: "Unit Price",
    min: 90,
    max: 120,
    step: 1,
    unit: "₹",
    baseline: 100,
    description: "Average retail unit sales price.",
  },
];

export class ApiScenarioRepository implements ScenarioRepository {
  private savedScenarios: SavedScenario[] = [];
  private simulationHistory: SimulationHistoryEntry[] = [];

  async getPresets(): Promise<ScenarioPreset[]> {
    const data = await apiFetch<ScenarioPreset[]>("/api/scenarios");
    return Array.isArray(data) ? data : [];
  }

  async getLeverConfigs(): Promise<DecisionLeverConfig[]> {
    return [...LIVE_LEVER_CONFIGS];
  }

  async runSimulation(presetId: string, levers: DecisionLeverValues): Promise<ScenarioWorkspaceData> {
    const raw = await apiFetch<any>("/api/scenarios", {
      method: "POST",
      body: JSON.stringify({
        presetId,
        levers,
      }),
    });

    // Backend returns tradeoffs as dict[str, Any] which may not have the
    // shape { categories, summary } the ScenarioPage expects. Normalize here
    // so the UI never crashes with "Cannot read properties of undefined".
    const data: ScenarioWorkspaceData = {
      ...raw,
      tradeoffs: {
        categories: Array.isArray(raw?.tradeoffs?.categories)
          ? raw.tradeoffs.categories
          : [],
        summary: typeof raw?.tradeoffs?.summary === "string"
          ? raw.tradeoffs.summary
          : "",
      },
      // history is a UI-only field accumulated in this repo instance
      history: raw?.history ?? [],
    };

    const revOutcome = data?.metrics?.find((m) => m.key === "gross_revenue" || m.key === "revenue")?.simulatedValue ?? (data?.metrics?.[0]?.simulatedValue || "Simulated");
    const historyEntry: SimulationHistoryEntry = {
      id: `sim_hist_${Date.now()}`,
      timeframe: "30D",
      scenarioName: data?.scenarioName || "Custom Simulation",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      levers: {
        marketing: `₹${levers.marketingBudget.toFixed(2)} Cr`,
        inventory: `${Math.round(levers.workingInventory).toLocaleString()} units`,
        price: `₹${Math.round(levers.unitPrice)}`,
      },
      highlightResult: `Projected Revenue: ${revOutcome}`,
    };
    this.simulationHistory.unshift(historyEntry);

    return data;
  }

  async getWorkspaceByPresetId(presetId: string): Promise<ScenarioWorkspaceData | null> {
    try {
      const presets = await this.getPresets();
      const preset = presets.find((p) => p.id === presetId) || presets[0];
      if (!preset) {
        return null;
      }
      return await this.runSimulation(preset.id, preset.levers);
    } catch {
      return null;
    }
  }

  async getAllWorkspaces(): Promise<Record<string, ScenarioWorkspaceData>> {
    const presets = await this.getPresets();
    const result: Record<string, ScenarioWorkspaceData> = {};
    for (const p of presets) {
      const ws = await this.getWorkspaceByPresetId(p.id);
      if (ws) {
        result[p.id] = ws;
      }
    }
    return result;
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
    return newScenario;
  }

  async getSimulationHistory(): Promise<SimulationHistoryEntry[]> {
    return [...this.simulationHistory];
  }
}
