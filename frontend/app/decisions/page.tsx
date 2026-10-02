"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import {
  DecisionHeader,
  DecisionSummaryCards,
  DecisionFilters,
  DecisionTable,
  DecisionReviewWorkspace,
  ApprovalDialog,
  ModificationDialog,
  RejectionDialog,
  DecisionHistory,
  NextDecisionActions,
} from "@/components/decisions";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";
// Repositories & Types
import { getDecisionRepository } from "@/lib/repositories";
import { useAuth } from "@/lib/auth/auth-context";
import type {
  DecisionItem,
  DecisionFilterState,
  DecisionSummaryStats,
  ModifiedConfiguration,
  RejectionDetails,
} from "@/types/decision-registry";

export default function DecisionsPage() {
  const { user } = useAuth();
  const decisionRepo = React.useMemo(() => getDecisionRepository(), []);

  // In-memory state for decisions
  const [decisions, setDecisions] = React.useState<DecisionItem[]>([]);
  const [selectedDecision, setSelectedDecision] = React.useState<DecisionItem | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    decisionRepo.getDecisions().then((loaded) => {
      if (isMounted) {
        setDecisions(loaded);
        setSelectedDecision(loaded[0] ?? null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [decisionRepo]);

  // Filters state
  const [filters, setFilters] = React.useState<DecisionFilterState>({
    status: "all",
    type: "all",
    priority: "all",
    search: "",
    dateRange: "all",
  });

  // Dialog states
  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isModifyOpen, setIsModifyOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);

  // Compute dynamic stats based on in-memory decisions
  const stats: DecisionSummaryStats = React.useMemo(() => {
    const pending = decisions.filter((d) =>
      ["under_review", "proposed"].includes(d.status)
    ).length;
    const approved = decisions.filter((d) => d.status === "approved").length;
    const modified = decisions.filter((d) => d.status === "modified").length;
    const rejected = decisions.filter((d) => d.status === "rejected").length;

    return {
      total: decisions.length,
      pending,
      approved,
      modified,
      rejected,
      lastUpdated: "Just now",
    };
  }, [decisions]);

  // Filtered decisions list
  const filteredDecisions = React.useMemo(() => {
    return decisions.filter((item) => {
      // Status filter
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      // Type filter
      if (filters.type !== "all" && item.source !== filters.type) {
        return false;
      }
      // Priority filter
      if (filters.priority !== "all" && item.priority !== filters.priority) {
        return false;
      }
      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesOwner = item.owner.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesObjective = item.objective.toLowerCase().includes(query);

        if (!matchesCode && !matchesTitle && !matchesOwner && !matchesSummary && !matchesObjective) {
          return false;
        }
      }
      return true;
    });
  }, [decisions, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<DecisionFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      type: "all",
      priority: "all",
      search: "",
      dateRange: "all",
    });
  };

  // Human Action: Approve Decision
  const handleConfirmApproval = async () => {
    if (!selectedDecision) return;
    const approverIdentity = user?.fullName
      ? `${user.fullName}${user.role ? ` (${user.role})` : ""}`
      : "Authorized Stakeholder";
    const updatedDecision = await decisionRepo.approveDecision(
      selectedDecision.id,
      approverIdentity
    );
    setDecisions((prev) =>
      prev.map((d) => (d.id === selectedDecision.id ? updatedDecision : d))
    );
    setSelectedDecision(updatedDecision);
  };

  // Human Action: Modify Configuration
  const handleSubmitModified = async (modifiedConfig: ModifiedConfiguration) => {
    if (!selectedDecision) return;
    const updatedDecision = await decisionRepo.modifyDecision(
      selectedDecision.id,
      modifiedConfig
    );
    setDecisions((prev) =>
      prev.map((d) => (d.id === selectedDecision.id ? updatedDecision : d))
    );
    setSelectedDecision(updatedDecision);
  };

  // Human Action: Reject Decision
  const handleConfirmRejection = async (rejectionDetails: RejectionDetails) => {
    if (!selectedDecision) return;
    const updatedDecision = await decisionRepo.rejectDecision(
      selectedDecision.id,
      rejectionDetails
    );
    setDecisions((prev) =>
      prev.map((d) => (d.id === selectedDecision.id ? updatedDecision : d))
    );
    setSelectedDecision(updatedDecision);
  };

  const handleReviewPendingClick = () => {
    setFilters((prev) => ({ ...prev, status: "under_review" }));
    const firstPending = decisions.find((d) =>
      ["under_review", "proposed"].includes(d.status)
    );
    if (firstPending) {
      setSelectedDecision(firstPending);
    }
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="full" className="space-y-8 pb-16">
        {/* 1. Header with governance warning & CTAs */}
        <DecisionHeader
          stats={stats}
          onReviewPendingClick={handleReviewPendingClick}
        />

        {/* Executive Workflow Guide */}
        <WorkflowStepBanner
          currentStep={7}
          stageName="Human-in-the-Loop Decision Governance"
          summary="High-impact commercial decisions strictly require authorized human stakeholder sign-off. Never auto-approved."
          actionGuidance="Review recommended lever configuration and authorize approval, parameter modification, or reasoned rejection."
        />

        {/* 2. Summary Metric Cards */}
        <DecisionSummaryCards
          stats={stats}
          selectedFilterStatus={filters.status}
          onSelectStatus={(statusKey) => handleFilterChange({ status: statusKey })}
        />

        {/* 3. Decision Review Workspace (When a decision is selected for in-depth review) */}
        {selectedDecision && (
          <div className="space-y-6 pt-2">
            <DecisionReviewWorkspace
              decision={selectedDecision}
              onBackToList={() => {
                const el = document.getElementById("decisions-list-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              onOpenApprove={() => setIsApproveOpen(true)}
              onOpenModify={() => setIsModifyOpen(true)}
              onOpenReject={() => setIsRejectOpen(true)}
            />
          </div>
        )}

        {/* 4. Filter Bar & Decision Registry Table */}
        <div id="decisions-list-section" className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Decision Register & Execution Governance
              </h3>
              <p className="text-xs text-muted-foreground">
                All business decisions registered across Optimizer, Scenario Lab, Replay, and Investigations.
              </p>
            </div>
          </div>

          <DecisionFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            totalFiltered={filteredDecisions.length}
          />

          <DecisionTable
            decisions={filteredDecisions}
            selectedDecisionId={selectedDecision?.id}
            onSelectDecision={(dec) => {
              setSelectedDecision(dec);
              window.scrollTo({ top: 320, behavior: "smooth" });
            }}
          />
        </div>

        {/* 5. Complete Decision History Registry */}
        <DecisionHistory
          historyItems={decisions}
          onSelectDecision={(dec) => {
            setSelectedDecision(dec);
            window.scrollTo({ top: 320, behavior: "smooth" });
          }}
        />

        {/* 6. Decision DNA Handoff Banner & Workspace Navigation Links */}
        <NextDecisionActions />

        {/* Human Decision Dialogs */}
        {selectedDecision && (
          <>
            <ApprovalDialog
              decision={selectedDecision}
              isOpen={isApproveOpen}
              onClose={() => setIsApproveOpen(false)}
              onConfirmApproval={handleConfirmApproval}
            />

            <ModificationDialog
              decision={selectedDecision}
              isOpen={isModifyOpen}
              onClose={() => setIsModifyOpen(false)}
              onSubmitModified={handleSubmitModified}
            />

            <RejectionDialog
              decision={selectedDecision}
              isOpen={isRejectOpen}
              onClose={() => setIsRejectOpen(false)}
              onConfirmRejection={handleConfirmRejection}
            />
          </>
        )}
      </PageContainer>
    </AppLayout>
  );
}
