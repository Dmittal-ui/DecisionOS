"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import {
  DecisionDNASummaryCards,
  DecisionDNAFilters,
  DecisionDNAList,
  DecisionDNAHeader,
  DecisionSummary,
  DecisionLineage,
  DecisionEvidence,
  DecisionAlternatives,
  DecisionConstraints,
  DecisionConfiguration,
  DecisionHumanAction,
  DecisionOutcome,
  DecisionUncertainty,
  DecisionLearning,
  DecisionAuditTimeline,
  DecisionProvenance,
  DecisionDNAActions,
  NextDecisionActions,
} from "@/components/decision-dna";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";
// Repositories & Types
import { getDecisionDNARepository } from "@/lib/repositories";
import type {
  DecisionDNARecord,
  DecisionDNAFilterState,
  DecisionDNASummaryStats,
} from "@/types/decision-dna";

export default function DecisionDNAPage() {
  const dnaRepo = React.useMemo(() => getDecisionDNARepository(), []);

  const [records, setRecords] = React.useState<DecisionDNARecord[]>([]);
  const [selectedRecord, setSelectedRecord] = React.useState<DecisionDNARecord | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    dnaRepo.getDecisionDNARecords().then((loaded) => {
      if (isMounted) {
        setRecords(loaded);
        setSelectedRecord(loaded[0] ?? null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [dnaRepo]);

  const [filters, setFilters] = React.useState<DecisionDNAFilterState>({
    search: "",
    status: "all",
    type: "all",
    owner: "all",
    outcomeStatus: "all",
    opportunity: "all",
    dateRange: "all",
  });

  // Calculate dynamic stats
  const stats: DecisionDNASummaryStats = React.useMemo(() => {
    const approved = records.filter((r) => r.status === "approved").length;
    const modified = records.filter((r) => r.status === "modified").length;
    const rejected = records.filter((r) => r.status === "rejected").length;
    const avgConfidence = Math.round(
      records.reduce((acc, r) => acc + r.confidence, 0) / (records.length || 1)
    );
    const withOutcomes = records.filter((r) => r.actualOutcome.status !== "pending").length;

    return {
      totalDecisions: records.length,
      approved,
      modified,
      rejected,
      averageConfidence: avgConfidence,
      decisionsWithOutcomes: withOutcomes,
    };
  }, [records]);

  // Filter records
  const filteredRecords = React.useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      // Status
      if (filters.status !== "all" && r.status !== filters.status) {
        return false;
      }
      // Type
      if (filters.type !== "all" && r.type !== filters.type) {
        return false;
      }
      // Owner
      if (filters.owner !== "all" && r.owner !== filters.owner) {
        return false;
      }
      // Outcome status
      if (filters.outcomeStatus !== "all" && r.actualOutcome.status !== filters.outcomeStatus) {
        return false;
      }
      // Opportunity
      if (filters.opportunity !== "all" && r.opportunityId !== filters.opportunity) {
        return false;
      }
      // Date range (Fix 5) — applied against r.decisionDate ISO timestamp
      if (filters.dateRange !== "all" && r.decisionDate) {
        const decDate = new Date(r.decisionDate);
        if (filters.dateRange === "today") {
          if (decDate.toDateString() !== now.toDateString()) return false;
        } else if (filters.dateRange === "this_week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          if (decDate < weekAgo) return false;
        } else if (filters.dateRange === "this_month") {
          if (
            decDate.getFullYear() !== now.getFullYear() ||
            decDate.getMonth() !== now.getMonth()
          ) return false;
        }
      }
      // Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(query);
        const matchesDecId = r.decisionId.toLowerCase().includes(query);
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesTrigger = r.trigger.problemTitle.toLowerCase().includes(query);
        const matchesOwner = r.owner.toLowerCase().includes(query);
        const matchesOpp = r.opportunityId.toLowerCase().includes(query);

        if (!matchesId && !matchesDecId && !matchesTitle && !matchesTrigger && !matchesOwner && !matchesOpp) {
          return false;
        }
      }
      return true;
    });
  }, [records, filters]);

  const handleFilterChange = (newFilters: Partial<DecisionDNAFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      type: "all",
      owner: "all",
      outcomeStatus: "all",
      opportunity: "all",
      dateRange: "all",
    });
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="full" className="space-y-8 pb-16">
        {/* 1. Page Header & Summary Cards */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Decision DNA Repository
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Auditable institutional decision record preserving triggers, evidence, alternatives, human actions, realized outcomes, and retrospective learning.
            </p>
          </div>

          {/* Executive Workflow Guide */}
          <WorkflowStepBanner
            currentStep={8}
            stageName="Decision DNA Knowledge Artifact"
            summary="Immutable institutional decision memory preserving causal triggers, constraints, human authorizations, and verifiable cryptographic hashes."
            actionGuidance="Inspect end-to-end decision lineage or track post-execution outcome telemetry."
          />

          <DecisionDNASummaryCards
            stats={stats}
            selectedStatusFilter={filters.status}
            onSelectStatusFilter={(status) => handleFilterChange({ status })}
          />
        </div>

        {/* 2. Selected Decision DNA Detailed Workspace */}
        {selectedRecord && (
          <div id="dna-detail-workspace" className="space-y-6 pt-2">
            {/* Detail Header with Cross-Workspace Links */}
            <DecisionDNAHeader record={selectedRecord} />

            {/* Actions Bar (Copy ID, Export DNA Brief, View in Registry) */}
            <DecisionDNAActions record={selectedRecord} />

            {/* Business Question, Trigger, & Decision Made */}
            <DecisionSummary record={selectedRecord} />

            {/* 8-Stage End-to-End Decision Lineage */}
            <DecisionLineage lineage={selectedRecord.lineage} />

            {/* Human Governance Authorization */}
            <DecisionHumanAction humanDecision={selectedRecord.humanDecision} />

            {/* 3-Way Configuration Comparison (Current vs Recommended vs Selected) */}
            <DecisionConfiguration
              current={selectedRecord.currentConfiguration}
              recommended={selectedRecord.recommendedConfiguration}
              selected={selectedRecord.selectedConfiguration}
              action={selectedRecord.humanDecision.action}
            />

            {/* Expected vs Actual Realized Outcomes */}
            <DecisionOutcome outcome={selectedRecord.actualOutcome} />

            {/* Retrospective Organizational Learning */}
            <DecisionLearning learning={selectedRecord.learning} />

            {/* Alternatives Considered */}
            <DecisionAlternatives alternatives={selectedRecord.alternatives} />

            {/* Enforced Business Constraints */}
            <DecisionConstraints constraints={selectedRecord.constraints} />

            {/* Supporting Empirical Evidence */}
            <DecisionEvidence evidence={selectedRecord.evidence} />

            {/* Uncertainty Intervals & Audit Timeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DecisionUncertainty uncertainty={selectedRecord.uncertainty} />
              <DecisionAuditTimeline auditEvents={selectedRecord.auditEvents} />
            </div>

            {/* Provenance & Cryptographic Lineage */}
            <DecisionProvenance provenance={selectedRecord.provenance} />
          </div>
        )}

        {/* 3. Decision DNA Record List & Filters Section */}
        <div id="dna-list-section" className="space-y-4 pt-6 border-t border-border/60">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              All Decision DNA Records
            </h3>
            <p className="text-xs text-muted-foreground">
              Browse, filter, and inspect historical institutional decision signatures.
            </p>
          </div>

          <DecisionDNAFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            totalFiltered={filteredRecords.length}
            records={records}
          />

          <DecisionDNAList
            records={filteredRecords}
            selectedRecordId={selectedRecord?.id}
            onSelectRecord={(rec) => {
              setSelectedRecord(rec);
              const el = document.getElementById("dna-detail-workspace");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>

        {/* 4. Contextual DecisionOS Workspace Navigation */}
        <div className="pt-4 border-t border-border/60">
          <NextDecisionActions />
        </div>
      </PageContainer>
    </AppLayout>
  );
}
