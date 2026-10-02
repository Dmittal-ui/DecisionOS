"use client";

import * as React from "react";
import Link from "next/link";
import {
  RotateCcw,
  AlertCircle,
  FileQuestion,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Replay components
import {
  ReplayHeader,
  HistoricalDecisionSelector,
  DecisionContextCard,
  ReplayTimeline,
  OutcomeComparison,
  ReplayChart,
  CounterfactualInsight,
  ReplayEvidence,
  UncertaintyPanel,
  NextReplayActions,
} from "@/components/replay";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";

// Repositories & Types
import { getReplayRepository } from "@/lib/repositories";
import { HistoricalDecisionOption, ReplayStatus, ReplayWorkspaceData } from "@/types/replay-workspace";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ReplaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-border/60 pb-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ReplayErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="rounded-full border border-dashed border-rose-300 dark:border-rose-700 p-5">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">
          Replay Unavailable
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Unable to reconstruct historical replay session. The decision telemetry or counterfactual branch may be corrupt.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Reconstruction
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function ReplayEmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-20 text-center px-4">
      <div className="rounded-full border border-dashed border-border/80 p-4 mb-3">
        <FileQuestion className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-bold text-foreground">
        No Historical Decisions Available
      </h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        {message ?? "Decision Replay requires at least one historical decision record with empirical baseline logs to reconstruct counterfactual timelines."}
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href="/decisions">
          View Decision Registry
        </Link>
      </Button>
    </div>
  );
}

// ─── Main Replay Page ─────────────────────────────────────────────────────────

export default function ReplayPage() {
  const replayRepo = React.useMemo(() => getReplayRepository(), []);

  const [historicalDecisions, setHistoricalDecisions] = React.useState<HistoricalDecisionOption[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("");
  const [currentWorkspace, setCurrentWorkspace] = React.useState<ReplayWorkspaceData | null>(null);

  const [replayStatus, setReplayStatus] = React.useState<ReplayStatus>("idle");
  const [statusMessage, setStatusMessage] = React.useState<string | undefined>(undefined);
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    setIsInitialLoading(true);
    async function init() {
      try {
        const decisions = await replayRepo.getHistoricalDecisions();
        if (isMounted) {
          setHistoricalDecisions(decisions);
          if (decisions.length > 0 && decisions[0]) {
            const firstDec = decisions[0];
            setSelectedDecisionId(firstDec.id);
            setSelectedDate(firstDec.date);
            setSelectedBranchId(firstDec.availableBranches[0]?.id ?? "");

            const ws = await replayRepo.getReplayWorkspace(firstDec.id);
            if (isMounted) {
              setCurrentWorkspace(ws);
            }
          }
          setIsInitialLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setHasError(true);
          setIsInitialLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [replayRepo]);

  // When decision changes, sync date and default branch
  const handleSelectDecision = async (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    const dec = historicalDecisions.find((d) => d.id === decisionId);
    if (dec) {
      setSelectedDate(dec.date);
      setSelectedBranchId(dec.availableBranches[0]?.id ?? "");
    }
    const ws = await replayRepo.getReplayWorkspace(decisionId);
    setCurrentWorkspace(ws);
  };

  // Replay Multi-Step Simulated Loading Sequence
  const handleRunReplay = () => {
    setReplayStatus("running");
    setStatusMessage("Loading historical state...");

    setTimeout(() => {
      setStatusMessage("Reconstructing decision point...");
      setTimeout(() => {
        setStatusMessage("Comparing branches...");
        setTimeout(async () => {
          const ws = await replayRepo.runReplaySimulation(selectedDecisionId, selectedBranchId);
          setCurrentWorkspace(ws);
          setReplayStatus("complete");
          setStatusMessage("Replay complete");
          setTimeout(() => {
            setStatusMessage(undefined);
          }, 2500);
        }, 400);
      }, 400);
    }, 400);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsInitialLoading(true);
    setTimeout(async () => {
      try {
        const decisions = await replayRepo.getHistoricalDecisions();
        setHistoricalDecisions(decisions);
        const ws = await replayRepo.getReplayWorkspace(selectedDecisionId);
        setCurrentWorkspace(ws);
      } finally {
        setIsInitialLoading(false);
        handleRunReplay();
      }
    }, 600);
  };

  const currentDecision =
    historicalDecisions.find((d) => d.id === selectedDecisionId) ??
    historicalDecisions[0];

  const currentBranchLabel =
    currentDecision?.availableBranches.find((b) => b.id === selectedBranchId)?.label ??
    "Counterfactual Alternative";

  return (
    <AppLayout>
      <PageContainer maxWidth="full">
        {isInitialLoading ? (
          <ReplaySkeleton />
        ) : hasError ? (
          <ReplayErrorState onRetry={handleRetry} />
        ) : historicalDecisions.length === 0 || !currentDecision ? (
          <ReplayEmptyState />
        ) : !currentWorkspace ? (
          // Decisions loaded but workspace could not be reconstructed.
          // Show the honest empty state rather than a "corrupt telemetry" error.
          <ReplayEmptyState message="Replay workspace could not be loaded for the selected decision. Select a different decision or return to the Decision Registry." />
        ) : (
          <div className="space-y-8">
            {/* 1. Header */}
            <ReplayHeader
              decisionTitle={currentDecision.title}
              decisionCode={currentDecision.code}
              decisionDate={selectedDate}
              decisionStatus={currentDecision.status}
              replayStatus={replayStatus}
              statusMessage={statusMessage}
              onRunReplay={handleRunReplay}
            />

            {/* Executive Workflow Guide */}
            <WorkflowStepBanner
              currentStep={4}
              stageName="Decision Replay & Counterfactual Evaluation"
              summary="Deterministic counterfactual playback evaluates historical business branches to measure realized vs missed performance."
              actionGuidance="Select an alternative counterfactual branch to compare actual vs simulated business outcomes."
            />

            {/* 2. Historical Decision Selector & Controls */}
            <HistoricalDecisionSelector
              decisions={historicalDecisions}
              selectedDecisionId={selectedDecisionId}
              selectedBranchId={selectedBranchId}
              selectedDate={selectedDate}
              replayStatus={replayStatus}
              onSelectDecision={handleSelectDecision}
              onSelectBranch={setSelectedBranchId}
              onSelectDate={setSelectedDate}
              onRunReplay={handleRunReplay}
            />

            {/* 3. Decision Context Card */}
            <DecisionContextCard decision={currentDecision} />

            {/* 4. Timeline Comparison (with Decision Point Fork Marker) */}
            <ReplayTimeline
              decisionPoint={currentWorkspace.decisionPoint}
              counterfactualBranchLabel={currentBranchLabel}
              actualTimeline={currentWorkspace.actualTimeline}
              counterfactualTimeline={currentWorkspace.counterfactualTimeline}
            />

            {/* 5. Outcome Comparison (5 metrics) */}
            <OutcomeComparison metrics={currentWorkspace.metrics} />

            {/* 6. Outcome Comparison Chart */}
            <ReplayChart metrics={currentWorkspace.metrics} />

            {/* 7. Counterfactual Insight */}
            <CounterfactualInsight insight={currentWorkspace.insight} />

            {/* 8. Replay Evidence & Progression Chain */}
            <ReplayEvidence
              evidence={currentWorkspace.evidence}
              progression={currentWorkspace.evidenceProgression}
            />

            {/* 9. Counterfactual Confidence & Uncertainty Range */}
            <UncertaintyPanel uncertainty={currentWorkspace.uncertainty} />

            {/* 10. Next Decision Actions */}
            <NextReplayActions />
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
