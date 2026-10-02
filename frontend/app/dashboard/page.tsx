"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  DashboardHeader,
  ExecutiveKpiStrip,
  PerformanceChart,
  BusinessHealthPanel,
  ActiveOpportunitiesPanel,
  OpportunityRadarWidget,
  DecisionIntelligenceSignal,
  RecommendedActionsPanel,
  QuickEngineNavigation,
  RecentDecisionsPanel,
  DecisionAuditFeed,
} from "@/components/dashboard";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";
import {
  getDashboardRepository,
  getOpportunityRepository,
  getBusinessRepository,
  isMockMode,
} from "@/lib/repositories";
import type { DashboardData } from "@/types/dashboard";
import type { Opportunity } from "@/types/opportunity";
import type { Decision } from "@/types/decision";

export default function DashboardPage() {
  const [timeframe, setTimeframe] = React.useState<"7D" | "30D" | "90D">("30D");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState("Live Telemetry (Just now)");
  const [hasError, setHasError] = React.useState(false);
  // In live mode only: flag when the user has no business workspace yet
  const [hasNoBusinessSetup, setHasNoBusinessSetup] = React.useState(false);

  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [decisions, setDecisions] = React.useState<Decision[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const dashboardRepo = getDashboardRepository();
        const opportunityRepo = getOpportunityRepository();

        const [data, opps, decs] = await Promise.all([
          dashboardRepo.getDashboardData(),
          opportunityRepo.getOpportunities(),
          dashboardRepo.getRecentDecisions(),
        ]);

        setDashboardData(data);
        setOpportunities(opps);
        setDecisions(decs);

        // Check whether the user has set up a business workspace.
        // Only relevant in live mode — mock always has a business.
        if (!isMockMode()) {
          try {
            await getBusinessRepository().getBusiness();
            setHasNoBusinessSetup(false);
          } catch {
            // 404 = no business yet — show the onboarding banner
            setHasNoBusinessSetup(true);
          }
        }
      } catch (err) {
        setHasError(true);
      }
    }
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const dashboardRepo = getDashboardRepository();
      const opportunityRepo = getOpportunityRepository();

      const [data, opps, decs] = await Promise.all([
        dashboardRepo.getDashboardData(),
        opportunityRepo.getOpportunities(),
        dashboardRepo.getRecentDecisions(),
      ]);

      setDashboardData(data);
      setOpportunities(opps);
      setDecisions(decs);
      setLastRefresh(`Updated at ${new Date().toLocaleTimeString()}`);
    } catch {
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (hasError) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <ErrorState
            title="Telemetry Synchronization Error"
            description="Unable to stream real-time metrics from the decision telemetry gateway. Please retry or check cluster status."
            onRetry={() => {
              setHasError(false);
              handleRefresh();
            }}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full" className="py-12">
          <LoadingState message="Loading command center telemetry..." />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer maxWidth="full" className="space-y-6 pb-12">
        {/* 1. Page Header with Business Health Status & Timeframe Controls */}
        <DashboardHeader
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
        />

        {/* Executive Workflow Guide */}
        <WorkflowStepBanner
          currentStep={1}
          stageName="Continuous Business Monitoring"
          summary="Real-time commercial telemetry streamed from your business Digital Twin. Review core metrics and detected alerts."
          actionGuidance="Review KPI variances and explore detected opportunities on the Radar."
        />

        {/* ── First-login onboarding banner (live mode only, shown when no business exists) ── */}
        {hasNoBusinessSetup && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Welcome to DecisionOS</p>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Set up your business workspace and upload your operational dataset to activate real-time metrics, Opportunity Radar, and the full decision pipeline.
                </p>
              </div>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" asChild>
              <Link href="/business">
                Set Up Business
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* 2. Executive KPI Strip (6 Key Operational Metrics) */}
        <ExecutiveKpiStrip kpis={dashboardData.kpis} />

        {/* 3. Decision Intelligence Signal (Structured Business Signal Banner) */}
        <DecisionIntelligenceSignal signal={dashboardData.intelligenceSignal} />

        {/* 4. Financial Performance & Business Health (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
          <div className="min-w-0">
            <PerformanceChart
              series={dashboardData.performanceSeries}
              currentTimeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>
          <div className="min-w-0">
            <BusinessHealthPanel health={dashboardData.health} />
          </div>
        </div>

        {/* 5. Active Opportunities & Radar Matrix (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ActiveOpportunitiesPanel opportunities={opportunities} />
          </div>
          <div className="lg:col-span-5">
            <OpportunityRadarWidget points={dashboardData.radarPoints} />
          </div>
        </div>

        {/* 6. Recommended Next Actions Workflow Playbook */}
        <RecommendedActionsPanel steps={dashboardData.recommendedSteps} />

        {/* 7. Quick Decision Engine Navigation Launchers */}
        <QuickEngineNavigation />

        {/* 8. Recent Governed Decisions & Live Audit Feed (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <RecentDecisionsPanel decisions={decisions} />
          </div>
          <div className="lg:col-span-5">
            <DecisionAuditFeed activities={dashboardData.recentActivities} />
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
