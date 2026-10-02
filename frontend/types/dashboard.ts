export type MetricTrend = "up" | "down" | "flat";
export type MetricStatus = "positive" | "negative" | "neutral" | "warning";

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  changePercentage?: number;
  changeText?: string;
  trend: MetricTrend;
  status: MetricStatus;
  unit?: string;
  tooltip?: string;
  timeframe?: string;
}

export interface PerformanceDataPoint {
  date: string;
  revenue: number; // In ₹ Crores or thousands
  grossProfit: number; // In ₹ Crores or thousands
  ordersCount: number;
}

export interface HealthIndicator {
  name: string;
  score: number; // 0 - 100
  metricValue: string;
  status: "healthy" | "warning" | "critical";
  trend: MetricTrend;
  detail: string;
}

export interface BusinessHealthData {
  compositeScore: number;
  status: "healthy" | "warning" | "critical";
  lastAuditTimestamp: string;
  indicators: HealthIndicator[];
}

export interface IntelligenceSignal {
  headline: string;
  summary: string;
  confidenceScore: number;
  supportingMetrics: {
    label: string;
    delta: string;
    trend: MetricTrend;
    status: MetricStatus;
  }[];
  recommendedRoute: string;
  recommendedActionLabel: string;
}

export interface RecommendedStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  route: string;
  engineName: string;
  badge: string;
}

export interface OpportunityRadarPoint {
  id: string;
  code: string;
  title: string;
  impactLevel: "high" | "low";
  urgencyLevel: "high" | "low";
  netValue: number;
  confidence: number;
  category: string;
  route: string;
}

export interface PipelineSummary {
  activeOpportunitiesCount: number;
  totalOpportunityValue: number;
  pendingInvestigationsCount: number;
  activeOptimizationsCount: number;
  automatedExecutionRate: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  type: "decision" | "investigation" | "scenario" | "optimizer" | "alert";
  severity?: "low" | "medium" | "high" | "critical";
  actor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface DashboardData {
  timeframe: string;
  businessStatus: {
    label: string;
    variant: "positive" | "warning" | "critical";
    lastRefreshTime: string;
  };
  kpis: {
    revenue: KPIMetric;
    grossProfit: KPIMetric;
    orders: KPIMetric;
    inventory: KPIMetric;
    operatingMargin: KPIMetric;
    businessHealth: KPIMetric;
  };
  performanceSeries: {
    "7D": PerformanceDataPoint[];
    "30D": PerformanceDataPoint[];
    "90D": PerformanceDataPoint[];
  };
  health: BusinessHealthData;
  intelligenceSignal: IntelligenceSignal;
  recommendedSteps: RecommendedStep[];
  radarPoints: OpportunityRadarPoint[];
  pipeline: PipelineSummary;
  recentActivities: RecentActivityItem[];
  criticalAlertsCount: number;
}
