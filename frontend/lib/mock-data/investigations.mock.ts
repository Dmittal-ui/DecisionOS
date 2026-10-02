import { Investigation } from "@/types/investigation";

export const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: "inv_1",
    code: "INV-4019",
    opportunityId: "opp_2",
    title: "Healthcare Cohort Churn Spike Telemetry & SLA Root Cause",
    hypothesis: "Recent v2.4 API latency degradation during peak batch sync hours caused critical workflow failures in healthcare accounts, triggering churn risk indicators.",
    severity: "high",
    status: "in_progress",
    leadInvestigator: "Dr. Ethan Ramos",
    rootCauses: [
      {
        id: "rc_1",
        name: "Peak API P99 Latency Breach",
        contributionWeight: 54,
        description: "P99 latency spiked from 180ms to 2,400ms during morning EHR batch synchronization windows.",
        evidenceDataPointsCount: 1420,
      },
      {
        id: "rc_2",
        name: "Account Manager Turnover",
        contributionWeight: 28,
        description: "4 key enterprise accounts experienced account executive transitions within the last 60 days.",
        evidenceDataPointsCount: 4,
      },
      {
        id: "rc_3",
        name: "Competitor Price Match Pressure",
        contributionWeight: 18,
        description: "Aggressive discount campaigns from competing vendors targeted mid-tier healthcare customers.",
        evidenceDataPointsCount: 12,
      },
    ],
    evidence: [
      {
        id: "ev_1",
        source: "APM Datadog Metrics",
        type: "metric_anomaly",
        description: "HTTP 504 gateway timeout rate increased by 420% between 08:00 - 10:00 EST.",
        significanceScore: 94,
        timestamp: "2026-09-28T09:30:00Z",
      },
      {
        id: "ev_2",
        source: "Zendesk Support Tickets",
        type: "behavioral_cluster",
        description: "19 high-priority tickets logged citing failed automated patient intake data imports.",
        significanceScore: 89,
        timestamp: "2026-09-28T11:15:00Z",
      },
    ],
    findingsSummary: "System latency is the primary trigger causing user frustration and churn probability. Reallocating dedicated Redis caching nodes resolves 91% of timeouts.",
    recommendedActionCount: 3,
    createdAt: "2026-09-28T12:00:00Z",
    updatedAt: "2026-09-29T09:00:00Z",
  },
];
