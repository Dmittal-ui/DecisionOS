// ─── Centralized Repository Factory ─────────────────────────────────────────
// Centralized provider for all domain repositories.
// Returns mock implementations when NEXT_PUBLIC_USE_MOCK_DATA is true (or unset);
// switches to live FastAPI API repositories when NEXT_PUBLIC_USE_MOCK_DATA is "false".

import { MockOpportunityRepository } from "./mock/mock-opportunity-repository";
import { MockInvestigationRepository } from "./mock/mock-investigation-repository";
import { MockReplayRepository } from "./mock/mock-replay-repository";
import { MockScenarioRepository } from "./mock/mock-scenario-repository";
import { MockOptimizerRepository } from "./mock/mock-optimizer-repository";
import { MockDecisionRepository } from "./mock/mock-decision-repository";
import { MockDecisionDNARepository } from "./mock/mock-decision-dna-repository";
import { MockDashboardRepository } from "./mock/mock-dashboard-repository";
import { MockBusinessRepository } from "./mock/mock-business-repository";

import { ApiOpportunityRepository } from "./api/api-opportunity-repository";
import { ApiInvestigationRepository } from "./api/api-investigation-repository";
import { ApiReplayRepository } from "./api/api-replay-repository";
import { ApiScenarioRepository } from "./api/api-scenario-repository";
import { ApiOptimizerRepository } from "./api/api-optimizer-repository";
import { ApiDecisionRepository } from "./api/api-decision-repository";
import { ApiDecisionDNARepository } from "./api/api-decision-dna-repository";
import { ApiDashboardRepository } from "./api/api-dashboard-repository";
import { ApiBusinessRepository } from "./api/api-business-repository";

import type { OpportunityRepository } from "./opportunity-repository";
import type { InvestigationRepository } from "./investigation-repository";
import type { ReplayRepository } from "./replay-repository";
import type { ScenarioRepository } from "./scenario-repository";
import type { OptimizerRepository } from "./optimizer-repository";
import type { DecisionRepository } from "./decision-repository";
import type { DecisionDNARepository } from "./decision-dna-repository";
import type { DashboardRepository } from "./dashboard-repository";
import type { BusinessRepository } from "./business-repository";

// Singleton instances for mock repositories to maintain stateful updates in demo mode
const mockOpportunityRepoInstance = new MockOpportunityRepository();
const mockInvestigationRepoInstance = new MockInvestigationRepository();
const mockReplayRepoInstance = new MockReplayRepository();
const mockScenarioRepoInstance = new MockScenarioRepository();
const mockOptimizerRepoInstance = new MockOptimizerRepository();
const mockDecisionRepoInstance = new MockDecisionRepository();
const mockDecisionDNARepoInstance = new MockDecisionDNARepository();
const mockDashboardRepoInstance = new MockDashboardRepository();
const mockBusinessRepoInstance = new MockBusinessRepository();

// Singleton instances for live API repositories connecting to FastAPI backend
const apiOpportunityRepoInstance = new ApiOpportunityRepository();
const apiInvestigationRepoInstance = new ApiInvestigationRepository();
const apiReplayRepoInstance = new ApiReplayRepository();
const apiScenarioRepoInstance = new ApiScenarioRepository();
const apiOptimizerRepoInstance = new ApiOptimizerRepository();
const apiDecisionRepoInstance = new ApiDecisionRepository();
const apiDecisionDNARepoInstance = new ApiDecisionDNARepository();
const apiDashboardRepoInstance = new ApiDashboardRepository();
const apiBusinessRepoInstance = new ApiBusinessRepository();

export function isMockMode(): boolean {
  if (typeof window !== "undefined") {
    const explicit = localStorage.getItem("decisionos_use_mock_data");
    if (explicit !== null) {
      return explicit === "true";
    }
  }
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

export function setMockMode(useMock: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("decisionos_use_mock_data", useMock ? "true" : "false");
  }
}

export function getOpportunityRepository(): OpportunityRepository {
  return isMockMode() ? mockOpportunityRepoInstance : apiOpportunityRepoInstance;
}

export function getInvestigationRepository(): InvestigationRepository {
  return isMockMode() ? mockInvestigationRepoInstance : apiInvestigationRepoInstance;
}

export function getReplayRepository(): ReplayRepository {
  return isMockMode() ? mockReplayRepoInstance : apiReplayRepoInstance;
}

export function getScenarioRepository(): ScenarioRepository {
  return isMockMode() ? mockScenarioRepoInstance : apiScenarioRepoInstance;
}

export function getOptimizerRepository(): OptimizerRepository {
  return isMockMode() ? mockOptimizerRepoInstance : apiOptimizerRepoInstance;
}

export function getDecisionRepository(): DecisionRepository {
  return isMockMode() ? mockDecisionRepoInstance : apiDecisionRepoInstance;
}

export function getDecisionDNARepository(): DecisionDNARepository {
  return isMockMode() ? mockDecisionDNARepoInstance : apiDecisionDNARepoInstance;
}

export function getDashboardRepository(): DashboardRepository {
  return isMockMode() ? mockDashboardRepoInstance : apiDashboardRepoInstance;
}

export function getBusinessRepository(): BusinessRepository {
  return isMockMode() ? mockBusinessRepoInstance : apiBusinessRepoInstance;
}

// Re-export repository interfaces
export type { OpportunityRepository, OpportunityFilterParams } from "./opportunity-repository";
export type { InvestigationRepository } from "./investigation-repository";
export type { ReplayRepository } from "./replay-repository";
export type { ScenarioRepository } from "./scenario-repository";
export type { OptimizerRepository, OptimizerRunRequest } from "./optimizer-repository";
export type { DecisionRepository } from "./decision-repository";
export type { DecisionDNARepository } from "./decision-dna-repository";
export type { DashboardRepository } from "./dashboard-repository";
export type { BusinessRepository } from "./business-repository";
