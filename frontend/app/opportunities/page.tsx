"use client";

import * as React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getOpportunityRepository } from "@/lib/repositories";
import { Opportunity, OpportunityStatus, OpportunityUrgency, OpportunityCategory } from "@/types/opportunity";
import {
  OpportunitySummaryCards,
  OpportunityFilters,
  OpportunityFiltersState,
  DEFAULT_FILTERS,
  PriorityOpportunitySpotlight,
  OpportunityTable,
  OpportunityCard,
} from "@/components/opportunities";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";
import { SortField } from "@/components/opportunities/opportunity-filters";

// ─── helpers ────────────────────────────────────────────────────────────────

function urgencyRank(u: OpportunityUrgency): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[u] ?? 0;
}

function applyFilters(
  opps: Opportunity[],
  filters: OpportunityFiltersState
): Opportunity[] {
  let result = [...opps];

  // Search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.summary.toLowerCase().includes(q)
    );
  }

  // Status
  if (filters.status !== "all") {
    result = result.filter((o) => o.status === filters.status);
  }

  // Urgency
  if (filters.urgency !== "all") {
    result = result.filter((o) => o.urgency === filters.urgency);
  }

  // Category
  if (filters.category !== "all") {
    result = result.filter((o) => o.category === filters.category);
  }

  // Confidence threshold
  if (filters.confidenceThreshold !== "all") {
    const min = parseInt(filters.confidenceThreshold, 10);
    result = result.filter((o) => o.impact.confidenceScore >= min);
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortBy) {
      case "impact":
        cmp = a.impact.netValue - b.impact.netValue;
        break;
      case "confidence":
        cmp = a.impact.confidenceScore - b.impact.confidenceScore;
        break;
      case "urgency":
        cmp = urgencyRank(a.urgency) - urgencyRank(b.urgency);
        break;
      case "detectedAt":
        cmp = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
        break;
    }
    return filters.sortDir === "desc" ? -cmp : cmp;
  });

  return result;
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const [filters, setFilters] = React.useState<OpportunityFiltersState>(DEFAULT_FILTERS);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);
  const [allOpportunities, setAllOpportunities] = React.useState<Opportunity[]>([]);

  const opportunityRepo = React.useMemo(() => getOpportunityRepository(), []);

  React.useEffect(() => {
    let isMounted = true;
    opportunityRepo.getOpportunities().then((data) => {
      if (isMounted) {
        setAllOpportunities(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [opportunityRepo]);

  const filtered = applyFilters(allOpportunities, filters);

  // Priority opportunity: highest-impact one from the real scan result (already sorted by impact desc)
  const priorityOpportunity = allOpportunities[0] ?? null;

  const handleSort = (field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "desc" ? "asc" : "desc",
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await opportunityRepo.refreshRadar();
      setAllOpportunities(refreshed);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calls POST /api/opportunities/scan then re-fetches the list
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const scanned = await opportunityRepo.refreshRadar();
      setAllOpportunities(scanned);
      setScanMessage(
        scanned.length > 0
          ? `Scan complete — ${scanned.length} opportunit${scanned.length === 1 ? "y" : "ies"} detected.`
          : "Scan complete — no opportunities detected in current business data."
      );
    } catch (err: any) {
      setScanMessage(err?.message ?? "Radar scan failed. Ensure a dataset has been uploaded and normalized.");
    } finally {
      setIsScanning(false);
      // Clear message after 6 s
      setTimeout(() => setScanMessage(null), 6000);
    }
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="full">
        <PageHeader
          title="Opportunity Center"
          description="Continuous algorithmic scanning across operational datasets, discovering margin expansion, churn prevention, and pricing leverage opportunities."
          badge={`${allOpportunities.length} Active`}
          badgeVariant="enterprise"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>{isRefreshing ? "Scanning..." : "Refresh Radar"}</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleTriggerScan} disabled={isScanning}>
            {isScanning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Scanning…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Trigger Radar Scan</span>
              </>
            )}
          </Button>
        </PageHeader>

        {/* Executive Workflow Guide */}
        <div className="mt-4">
          <WorkflowStepBanner
            currentStep={2}
            stageName="Decision Opportunity Radar"
            summary="Deterministic scanning algorithms analyze gross margin divergence, customer acquisition costs, and fulfillment stockouts."
            actionGuidance="Select a high-impact opportunity card to launch a deep root-cause diagnostic investigation."
          />
        </div>

        {/* Scan status message */}
        {scanMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Summary cards */}
          <OpportunitySummaryCards opportunities={allOpportunities} />

          {/* Priority spotlight */}
          {priorityOpportunity && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Highest Priority
              </p>
              <PriorityOpportunitySpotlight opportunity={priorityOpportunity} />
            </div>
          )}

          {/* Filter toolbar */}
          <OpportunityFilters
            filters={filters}
            onChange={setFilters}
            totalCount={allOpportunities.length}
            filteredCount={filtered.length}
          />

          {/* Data — desktop table + mobile cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All Opportunities
            </p>

            {/* Desktop: sortable table */}
            <OpportunityTable
              opportunities={filtered}
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onSort={handleSort}
            />

            {/* Mobile: card stack */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="sm:hidden flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    No opportunities match the current filters
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Adjust filters to see more results
                  </p>
                </div>
              ) : (
                filtered.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
