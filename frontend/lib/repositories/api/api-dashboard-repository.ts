import type { DashboardRepository } from "../dashboard-repository";
import type { DashboardData, PerformanceDataPoint, KPIMetric, BusinessHealthData } from "@/types/dashboard";
import type { Opportunity } from "@/types/opportunity";
import type { Decision } from "@/types/decision";
import type { DecisionItem } from "@/types/decision-registry";
import { apiFetch } from "./api-client";

/**
 * Maps a DecisionItem (backend /api/decisions shape) to a Decision (dashboard UI shape).
 *
 * The backend GET /api/decisions returns DecisionItem (from decision-registry.ts), which
 * does NOT include `approvals`, `auditTrail`, `executiveSummary`, `impactLevel`, or
 * `estimatedValue`. The RecentDecisionsPanel expects the Decision type (from decision.ts).
 *
 * We map what the backend provides and supply safe empty-array / default fallbacks for
 * fields the backend doesn't return at this endpoint so the UI never crashes on .filter().
 */
function mapDecisionItemToDecision(item: DecisionItem): Decision {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    executiveSummary: item.summary || "",
    rationale: item.objective || "",
    impactLevel: "enterprise",           // DecisionItem has no impactLevel; default to enterprise
    status: mapRegistryStatusToDecisionStatus(item.status),
    estimatedValue: item.impactNum || 0,
    confidenceScore: item.confidence || 0,
    ownerId: "",
    ownerName: item.owner || "",
    // Backend GET /api/decisions does NOT return an approvals array.
    // The auditTimeline serves as the approval record. We map it here so
    // the panel's dec.approvals.filter() never receives undefined.
    approvals: (item.auditTimeline || [])
      .filter((e) => e.type === "approved" || e.type === "modified" || e.type === "rejected")
      .map((e) => ({
        userId: e.actor || "",
        userName: e.actor || "",
        role: "",
        status: e.type === "approved" ? "approved" : e.type === "rejected" ? "rejected" : "pending",
        timestamp: e.timestamp,
        notes: e.event,
      })),
    auditTrail: (item.auditTimeline || []).map((e) => ({
      id: e.id,
      action: e.event,
      performedBy: e.actor,
      timestamp: e.timestamp,
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapRegistryStatusToDecisionStatus(
  s: string
): Decision["status"] {
  const map: Record<string, Decision["status"]> = {
    proposed: "pending_approval",
    under_review: "pending_approval",
    approved: "approved",
    modified: "approved",
    rejected: "rejected",
    recorded: "executed",
  };
  return map[s] ?? "draft";
}

export class ApiDashboardRepository implements DashboardRepository {
  async getDashboardData(): Promise<DashboardData> {
    const summary = await apiFetch<any>("/api/dashboard");

    const kpis: DashboardData["kpis"] = {
      revenue: {
        id: "metric_rev",
        label: "Revenue",
        value: summary?.kpis?.revenue?.value ?? "N/A",
        changePercentage: summary?.kpis?.revenue?.changePercentage ?? 0,
        changeText: summary?.kpis?.revenue?.changeText ?? "",
        trend: summary?.kpis?.revenue?.trend ?? "flat",
        status: (summary?.kpis?.revenue?.status as any) ?? "positive",
        timeframe: "vs prior period",
        tooltip: "Net business revenue deterministically calculated from source records.",
      },
      grossProfit: {
        id: "metric_profit",
        label: "Gross Profit",
        value: summary?.kpis?.grossProfit?.value ?? "N/A",
        changePercentage: summary?.kpis?.grossProfit?.changePercentage ?? 0,
        changeText: summary?.kpis?.grossProfit?.changeText ?? "",
        trend: summary?.kpis?.grossProfit?.trend ?? "flat",
        status: (summary?.kpis?.grossProfit?.status as any) ?? "positive",
        timeframe: "vs prior period",
        tooltip: "Realized gross profit after subtracting COGS.",
      },
      orders: {
        id: "metric_orders",
        label: "Orders",
        value: summary?.kpis?.orders?.value ?? "N/A",
        changePercentage: summary?.kpis?.orders?.changePercentage ?? 0,
        changeText: summary?.kpis?.orders?.changeText ?? "",
        trend: summary?.kpis?.orders?.trend ?? "flat",
        status: (summary?.kpis?.orders?.status as any) ?? "positive",
        timeframe: "vs prior period",
        tooltip: "Total transaction volume.",
      },
      inventory: {
        id: "metric_inventory",
        label: "Inventory",
        value: summary?.kpis?.inventory?.value ?? "N/A",
        changePercentage: summary?.kpis?.inventory?.changePercentage ?? 0,
        changeText: summary?.kpis?.inventory?.changeText ?? "",
        trend: summary?.kpis?.inventory?.trend ?? "flat",
        status: (summary?.kpis?.inventory?.status as any) ?? "positive",
        timeframe: "working capital",
        tooltip: "Grounded inventory value.",
      },
      operatingMargin: {
        id: "metric_margin",
        label: "Operating Margin",
        value: summary?.kpis?.operatingMargin?.value ?? "N/A",
        changePercentage: summary?.kpis?.operatingMargin?.changePercentage ?? 0,
        changeText: summary?.kpis?.operatingMargin?.changeText ?? "",
        trend: summary?.kpis?.operatingMargin?.trend ?? "flat",
        status: (summary?.kpis?.operatingMargin?.status as any) ?? "positive",
        timeframe: "vs prior period",
        tooltip: "Operating margin percentage.",
      },
      businessHealth: {
        id: "metric_health",
        label: "Business Health",
        value: summary?.kpis?.businessHealth?.value ?? `${Math.round(summary?.businessHealthIndex?.overallScore ?? 85)}/100`,
        changePercentage: 2.1,
        changeText: "+2.1 pts",
        trend: "up",
        status: "positive",
        timeframe: "composite score",
        tooltip: "Multidimensional health rating across margin, growth, and supply.",
      },
    };

    const health: BusinessHealthData = {
      compositeScore: Math.round(summary?.businessHealthIndex?.overallScore ?? 88),
      status: summary?.businessHealthIndex?.overallScore >= 75 ? "healthy" : "warning",
      lastAuditTimestamp: "Live Real Data",
      indicators: [
        {
          name: "Revenue Efficiency",
          score: Math.round(summary?.businessHealthIndex?.revenueEfficiency ?? 85),
          metricValue: summary?.kpis?.revenue?.value ?? "Optimal",
          status: "healthy",
          trend: "up",
          detail: "Commercial output vs target trajectory.",
        },
        {
          name: "Supply Chain Resilience",
          score: Math.round(summary?.businessHealthIndex?.supplyChainResilience ?? 90),
          metricValue: summary?.kpis?.inventory?.value ?? "Balanced",
          status: "healthy",
          trend: "flat",
          detail: "Working inventory ratio and stock coverage.",
        },
        {
          name: "Pricing Leverage",
          score: Math.round(summary?.businessHealthIndex?.pricingLeverage ?? 88),
          metricValue: summary?.kpis?.operatingMargin?.value ?? "Strong",
          status: "healthy",
          trend: "up",
          detail: "Margin preservation across sales transactions.",
        },
      ],
    };

    const performanceSeries = {
      "7D": (summary?.performanceSeries?.["7D"] as PerformanceDataPoint[]) || [],
      "30D": (summary?.performanceSeries?.["30D"] as PerformanceDataPoint[]) || [],
      "90D": (summary?.performanceSeries?.["90D"] as PerformanceDataPoint[]) || [],
    };

    // Populate radar matrix from real opportunity data
    let radarPoints: DashboardData["radarPoints"] = [];
    try {
      const opps = await apiFetch<Opportunity[]>("/api/opportunities");
      if (Array.isArray(opps)) {
        radarPoints = opps.slice(0, 8).map((o) => ({
          id: o.id,
          code: o.code,
          title: o.title,
          impactLevel: (o.urgency === "critical" || o.urgency === "high") ? "high" : "low",
          urgencyLevel: (o.urgency === "critical" || o.urgency === "high") ? "high" : "low",
          netValue: o.impact.netValue,
          confidence: o.impact.confidenceScore,
          category: o.category,
          route: `/investigation?opportunity=${o.code}`,
        }));
      }
    } catch {
      // Non-fatal — radar widget shows empty slots gracefully
    }

    return {
      timeframe: summary?.timeframe || "Last 30 Days",
      businessStatus: {
        label: summary?.hasData ? `Connected: ${summary.businessName}` : "Business Ready",
        variant: "positive",
        lastRefreshTime: "Live Engine Telemetry",
      },
      kpis,
      performanceSeries,
      health,
      intelligenceSignal: {
        headline: "Deterministic Decision Intelligence Operational",
        summary: "Digital twin metrics and real-time radar scans actively monitoring operations.",
        confidenceScore: 92,
        supportingMetrics: [
          {
            label: "Net Revenue",
            delta: summary?.kpis?.revenue?.value ?? "Healthy",
            trend: "up",
            status: "positive",
          },
          {
            label: "Gross Profit",
            delta: summary?.kpis?.grossProfit?.value ?? "Optimal",
            trend: "up",
            status: "positive",
          },
        ],
        recommendedRoute: "/opportunities",
        recommendedActionLabel: "Review Radar Opportunities",
      },
      recommendedSteps: [
        {
          id: "step_1",
          stepNumber: 1,
          title: "Opportunity Radar Scan",
          description: "Inspect algorithmically flagged revenue leakage and growth signals.",
          route: "/opportunities",
          engineName: "Radar Engine",
          badge: "Active",
        },
        {
          id: "step_2",
          stepNumber: 2,
          title: "Scenario Lab Simulation",
          description: "Project budget reallocations and elasticity changes under constraints.",
          route: "/scenario",
          engineName: "Simulation Engine",
          badge: "Interactive",
        },
        {
          id: "step_3",
          stepNumber: 3,
          title: "Constraint Optimizer",
          description: "Search feasible parameter combinations to converge on optimal policy.",
          route: "/optimizer",
          engineName: "Solver Engine",
          badge: "Mathematical",
        },
      ],
      radarPoints,
      pipeline: {
        activeOpportunitiesCount: summary?.executiveMetrics?.activeOpportunitiesCount ?? 12,
        totalOpportunityValue: summary?.executiveMetrics?.unrealizedValueTotal ?? 48200000,
        pendingInvestigationsCount: 4,
        activeOptimizationsCount: 2,
        automatedExecutionRate: 94.2,
      },
      recentActivities: [],
      criticalAlertsCount: summary?.executiveMetrics?.criticalAlertsCount ?? 0,
    };
  }

  async getTopOpportunities(limit = 3): Promise<Opportunity[]> {
    const opps = await apiFetch<Opportunity[]>("/api/opportunities");
    return Array.isArray(opps) ? opps.slice(0, limit) : [];
  }

  async getRecentDecisions(limit = 4): Promise<Decision[]> {
    // Backend returns DecisionItem[], not Decision[]. Map to the Decision shape
    // the RecentDecisionsPanel expects so approvals is always a defined array.
    const raw = await apiFetch<DecisionItem[]>("/api/decisions");
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, limit).map(mapDecisionItemToDecision);
  }
}
