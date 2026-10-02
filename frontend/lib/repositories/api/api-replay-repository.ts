import type { ReplayRepository } from "../replay-repository";
import type {
  HistoricalDecisionOption,
  ReplayWorkspaceData,
} from "@/types/replay-workspace";
import { apiFetch } from "./api-client";

// ─── Normalize replay workspace from backend ──────────────────────────────────
// Backend ReplayWorkspaceResponse does NOT return:
//   - evidenceProgression  (UI-only field, always missing)
//   - evidence.supportingSignals / constraintsPreserved / evidenceSources
//     may be absent if backend returns evidence as an empty dict {}
//
// The ReplayEvidence component calls .map() on all three evidence arrays and
// .map() on progression — any undefined value crashes immediately.
//
// We normalize here in the repository layer so the UI never sees undefined.
function normalizeReplayWorkspace(raw: any): ReplayWorkspaceData {
  const rawEvidence = raw?.evidence ?? {};
  return {
    ...raw,
    evidence: {
      supportingSignals: Array.isArray(rawEvidence.supportingSignals)
        ? rawEvidence.supportingSignals
        : [],
      constraintsPreserved: Array.isArray(rawEvidence.constraintsPreserved)
        ? rawEvidence.constraintsPreserved
        : [],
      evidenceSources: Array.isArray(rawEvidence.evidenceSources)
        ? rawEvidence.evidenceSources
        : [],
    },
    // Backend never returns evidenceProgression — default to empty array so
    // the ReplayEvidence component's .map() call doesn't crash.
    evidenceProgression: Array.isArray(raw?.evidenceProgression)
      ? raw.evidenceProgression
      : [],
  };
}

export class ApiReplayRepository implements ReplayRepository {
  async getHistoricalDecisions(): Promise<HistoricalDecisionOption[]> {
    // Let backend errors propagate so the page can show the correct error state.
    // A legitimate empty list (no decisions seeded yet) is returned as [] by the
    // backend with HTTP 200, which apiFetch unwraps normally — no catch needed.
    const data = await apiFetch<HistoricalDecisionOption[]>("/api/replay");
    return Array.isArray(data) ? data : [];
  }

  async getReplayWorkspace(decisionId: string): Promise<ReplayWorkspaceData | null> {
    try {
      const raw = await apiFetch<any>(`/api/replay/${encodeURIComponent(decisionId)}`);
      if (!raw) return null;
      return normalizeReplayWorkspace(raw);
    } catch {
      return null;
    }
  }

  async runReplaySimulation(
    decisionId: string,
    branchId: string
  ): Promise<ReplayWorkspaceData> {
    const raw = await apiFetch<any>("/api/replay", {
      method: "POST",
      body: JSON.stringify({
        decisionId,
        branchId,
      }),
    });
    return normalizeReplayWorkspace(raw);
  }
}
