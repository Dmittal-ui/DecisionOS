"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import {
  OptimizerHeader,
  ObjectiveSelector,
  DecisionVariablePanel,
  ConstraintPanel,
  FeasibleSpaceChart,
  OptimizationSearchSummary,
  OptimizationResultsTable,
  RecommendedConfigPanel,
  ConstraintSlack,
  OptimizerSensitivityAnalysis,
  TradeoffAnalysis,
  ParetoFrontier,
  OptimizerUncertaintyPanel,
  OptimizationHistory,
  SavedConfigurations,
  NextOptimizerActions,
} from "@/components/optimizer";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";
// Repositories & Types
import { getOptimizerRepository } from "@/lib/repositories";
import type {
  OptimizerObjectiveKey,
  OptimizerRunStatus,
  OptimizerRunStep,
  SavedOptimizerConfig,
  OptimizerWorkspaceData,
} from "@/types/optimizer-workspace";

export default function OptimizerPage() {
  const optimizerRepo = React.useMemo(() => getOptimizerRepository(), []);

  const [workspace, setWorkspace] = React.useState<OptimizerWorkspaceData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] =
    React.useState<OptimizerObjectiveKey>("maximize_gross_profit");
  const [runStatus, setRunStatus] = React.useState<OptimizerRunStatus>("idle");
  const [currentStep, setCurrentStep] = React.useState<OptimizerRunStep | null>(null);
  const [savedConfigs, setSavedConfigs] = React.useState<SavedOptimizerConfig[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      optimizerRepo.getOptimizerWorkspace(),
      optimizerRepo.getSavedConfigurations(),
    ])
      .then(([ws, configs]) => {
        if (isMounted) {
          setWorkspace(ws);
          setSelectedObjective(ws.selectedObjective);
          setRunStatus("complete");
          setSavedConfigs(configs);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("Optimizer workspace unavailable.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [optimizerRepo]);

  if (loadError && !workspace) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <div className="py-24 text-center text-sm text-muted-foreground">
            {loadError}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Loading state
  if (!workspace) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <div className="py-24 text-center text-sm text-muted-foreground">
            Loading Optimizer workspace...
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const currentData = {
    results: workspace.results,
    recommendation: workspace.recommendation,
    summary: workspace.searchSummary,
  };

  const refreshWorkspace = async () => {
    const ws = await optimizerRepo.getOptimizerWorkspace();
    setWorkspace(ws);
    setSelectedObjective(ws.selectedObjective);
    setRunStatus("complete");
  };

  const handleObjectiveSelect = async (key: OptimizerObjectiveKey) => {
    setSelectedObjective(key);
    setRunStatus("running");
    try {
      await optimizerRepo.runOptimization({ objective: key });
      await refreshWorkspace();
    } catch {
      setRunStatus("error");
    }
  };

  const handleRunOptimization = () => {
    setRunStatus("running");
    setCurrentStep("validating_constraints");

    setTimeout(() => {
      setCurrentStep("evaluating_configurations");
    }, 600);

    setTimeout(() => {
      setCurrentStep("comparing_objectives");
    }, 1200);

    setTimeout(() => {
      setCurrentStep("selecting_recommendation");
    }, 1800);

    setTimeout(async () => {
      try {
        await optimizerRepo.runOptimization({ objective: selectedObjective });
        await refreshWorkspace();
        setCurrentStep(null);
      } catch {
        setRunStatus("error");
        setCurrentStep(null);
      }
    }, 2400);
  };

  const handleReset = async () => {
    setSelectedObjective("maximize_gross_profit");
    setRunStatus("idle");
    setCurrentStep(null);
    try {
      const defaultWs = await optimizerRepo.getOptimizerWorkspace();
      setWorkspace(defaultWs);
      setSelectedObjective(defaultWs.selectedObjective);
    } catch {
      setLoadError("Optimizer workspace unavailable.");
    }
  };

  const handleSaveConfig = async (customName?: string) => {
    if (!currentData.recommendation) {
      return;
    }
    const saved = await optimizerRepo.saveConfiguration({
      name:
        customName ||
        `Optimized ${selectedObjective.replace(/_/g, " ").toUpperCase()} (${new Date().toLocaleDateString()})`,
      objective: selectedObjective,
      marketingBudget: currentData.recommendation.marketingBudget,
      inventory: currentData.recommendation.workingInventory,
      unitPrice: currentData.recommendation.unitPrice,
      projectedProfit: currentData.recommendation.projectedGrossProfit,
    });
    setSavedConfigs((prev) => [saved, ...prev.filter((s) => s.id !== saved.id)]);
  };

  const hasViolations = workspace.hardConstraints.some((c) => c.status === "violated");

  return (
    <AppLayout>
      <PageContainer maxWidth="full" className="space-y-8 pb-12">
        {/* Header */}
        <OptimizerHeader
          runStatus={runStatus}
          currentStep={currentStep}
          onRunOptimization={handleRunOptimization}
          onReset={handleReset}
          onSave={() => handleSaveConfig()}
          hasViolations={hasViolations}
        />

        {/* Executive Workflow Guide */}
        <WorkflowStepBanner
          currentStep={6}
          stageName="Constraint-Aware Multi-Objective Optimizer"
          summary="Deterministic grid search algorithm systematically evaluates feasible candidate spaces and prunes hard constraint breaches."
          actionGuidance="Choose an optimization objective or adjust constraints to solve for the Pareto-optimal configuration."
        />

        {/* 1. Objective Selector */}
        <ObjectiveSelector
          objectives={workspace.objectives}
          selectedObjective={selectedObjective}
          onSelect={handleObjectiveSelect}
          disabled={runStatus === "running"}
        />

        {/* 2. Top-tier Recommendation Banner */}
        <RecommendedConfigPanel recommendation={currentData.recommendation} />

        {/* 3. Decision Variables & Constraints Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DecisionVariablePanel variables={workspace.decisionVariables} />
          <ConstraintPanel constraints={workspace.hardConstraints} />
        </div>

        {/* 4. Optimization Search Summary & Ranked Results Table */}
        <div className="space-y-6">
          <OptimizationSearchSummary summary={currentData.summary} />
          <OptimizationResultsTable results={currentData.results} />
        </div>

        {/* 5. Feasible Space & Pareto Frontier SVG Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeasibleSpaceChart solutions={workspace.feasibleSolutions} />
          <ParetoFrontier points={workspace.paretoFrontier} />
        </div>

        {/* 6. Deep Analytics: Slack, Sensitivity & Trade-offs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConstraintSlack constraints={workspace.hardConstraints} />
          <OptimizerSensitivityAnalysis sensitivity={workspace.sensitivity} />
          <TradeoffAnalysis tradeoffs={workspace.tradeoffs} />
        </div>

        {/* 7. Confidence & Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OptimizerUncertaintyPanel confidence={workspace.confidence} />
          <SavedConfigurations
            configs={savedConfigs}
            onSave={(name) => handleSaveConfig(name)}
          />
        </div>

        {/* 8. Optimization History */}
        <OptimizationHistory history={workspace.history} />

        {/* 9. Next Decision Actions */}
        <NextOptimizerActions />
      </PageContainer>
    </AppLayout>
  );
}
