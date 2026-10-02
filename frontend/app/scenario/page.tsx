"use client";

import * as React from "react";
import Link from "next/link";
import {
  FlaskConical,
  AlertCircle,
  FileQuestion,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Scenario components
import {
  ScenarioHeader,
  ScenarioPresets,
  DecisionLeverPanel,
  StateComparison,
  ProjectedOutcomes,
  SensitivityAnalysis,
  ScenarioChart,
  TradeoffAnalysis,
  ConstraintPanel,
  ScenarioUncertaintyPanel,
  ScenarioComparison,
  SavedScenarios,
  SimulationHistory,
  NextScenarioActions,
} from "@/components/scenario";
import { WorkflowStepBanner } from "@/components/shared/workflow-step-banner";

// Repositories & Types
import { getScenarioRepository } from "@/lib/repositories";
import {
  DecisionLeverConfig,
  ScenarioPreset,
  DecisionLeverValues,
  SavedScenario,
  SimulationHistoryEntry,
  SimulationStatus,
  ScenarioWorkspaceData,
} from "@/types/scenario-workspace";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ScenarioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-border/60 pb-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ScenarioErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="rounded-full border border-dashed border-rose-300 dark:border-rose-700 p-5">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">
          Simulation Engine Unavailable
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The Scenario Lab flight simulator failed to initialize the deterministic parameter solver.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Initialization
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

function ScenarioEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-20 text-center px-4">
      <div className="rounded-full border border-dashed border-border/80 p-4 mb-3">
        <FileQuestion className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-bold text-foreground">
        No Scenario Models Found
      </h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        The workspace requires at least one baseline operational model to simulate what-if scenarios.
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href="/dashboard">
          Return to Command Center
        </Link>
      </Button>
    </div>
  );
}

// ─── Main Scenario Page ───────────────────────────────────────────────────────

export default function ScenarioPage() {
  const scenarioRepo = React.useMemo(() => getScenarioRepository(), []);

  const [presets, setPresets] = React.useState<ScenarioPreset[]>([]);
  const [configs, setConfigs] = React.useState<DecisionLeverConfig[]>([]);
  const [history, setHistory] = React.useState<SimulationHistoryEntry[]>([]);
  const [allWorkspaces, setAllWorkspaces] = React.useState<Record<string, ScenarioWorkspaceData>>({});

  const [activePresetId, setActivePresetId] = React.useState<string>("");
  const [leverValues, setLeverValues] = React.useState<DecisionLeverValues>({
    marketingBudget: 0,
    workingInventory: 0,
    unitPrice: 0,
  });

  const [simulationStatus, setSimulationStatus] = React.useState<SimulationStatus>("ready");
  const [statusMessage, setStatusMessage] = React.useState<string | undefined>(undefined);
  const [lastSimulatedAt, setLastSimulatedAt] = React.useState<string>("Just now");

  const [savedScenarios, setSavedScenarios] = React.useState<SavedScenario[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = React.useState<string | undefined>(undefined);

  const [currentWorkspace, setCurrentWorkspace] = React.useState<ScenarioWorkspaceData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    setIsInitialLoading(true);
    async function init() {
      try {
        const [loadedPresets, loadedConfigs, loadedSaved, loadedHistory, workspaces] = await Promise.all([
          scenarioRepo.getPresets(),
          scenarioRepo.getLeverConfigs(),
          scenarioRepo.getSavedScenarios(),
          scenarioRepo.getSimulationHistory(),
          scenarioRepo.getAllWorkspaces(),
        ]);

        if (isMounted) {
          setPresets(loadedPresets);
          setConfigs(loadedConfigs);
          setSavedScenarios(loadedSaved);
          setHistory(loadedHistory);
          setAllWorkspaces(workspaces);

          const initialPreset = loadedPresets[0];
          if (initialPreset) {
            setActivePresetId(initialPreset.id);
            setLeverValues({ ...initialPreset.levers });
          } else if (loadedConfigs.length > 0) {
            const dynamicLevers: DecisionLeverValues = {
              marketingBudget: loadedConfigs.find((c) => c.key === "marketingBudget")?.baseline ?? 0,
              workingInventory: loadedConfigs.find((c) => c.key === "workingInventory")?.baseline ?? 0,
              unitPrice: loadedConfigs.find((c) => c.key === "unitPrice")?.baseline ?? 0,
            };
            setLeverValues(dynamicLevers);
          }

          if (initialPreset) {
            const ws = await scenarioRepo.getWorkspaceByPresetId(initialPreset.id);
            setCurrentWorkspace(ws);
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
  }, [scenarioRepo]);

  // When a preset is clicked, load its levers and update active workspace
  const handleSelectPreset = async (presetId: string) => {
    setActivePresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setLeverValues({ ...preset.levers });
      setSimulationStatus("ready");
      setStatusMessage(undefined);
    }
    const ws = await scenarioRepo.getWorkspaceByPresetId(presetId);
    if (ws) setCurrentWorkspace(ws);
  };

  // Adjust an individual slider lever
  const handleLeverChange = (key: keyof DecisionLeverValues, value: number) => {
    setLeverValues((prev) => ({ ...prev, [key]: value }));
    setSimulationStatus("ready");
    setStatusMessage("Parameters adjusted — click Run Simulation to project response");
  };

  // Reset an individual lever to its baseline
  const handleResetLever = (key: keyof DecisionLeverValues) => {
    const config = configs.find((c) => c.key === key);
    if (config) {
      handleLeverChange(key, config.baseline);
    }
  };

  // Reset entire scenario to Baseline
  const handleResetBaseline = () => {
    handleSelectPreset("preset_baseline");
  };

  // Run Simulation button click
  const handleRunSimulation = () => {
    setSimulationStatus("running");
    setStatusMessage("Simulating business response...");

    setTimeout(async () => {
      const updatedWs = await scenarioRepo.runSimulation(activePresetId, leverValues);
      setCurrentWorkspace(updatedWs);
      setSimulationStatus("complete");
      setStatusMessage("Simulation complete");
      setLastSimulatedAt("Just now");
      setTimeout(() => {
        setStatusMessage(undefined);
      }, 3000);
    }, 550);
  };

  // Save current scenario configuration
  const handleSaveScenario = async () => {
    if (!currentWorkspace) return;

    const revMetric = currentWorkspace.metrics.find((m) => m.key === "revenue" || m.key === "gross_revenue");
    const profitMetric = currentWorkspace.metrics.find((m) => m.key === "gross_profit");
    const marginMetric = currentWorkspace.metrics.find((m) => m.key === "operating_margin" || m.key === "gross_margin");

    const saved = await scenarioRepo.saveScenario({
      name: `${presets.find((p) => p.id === activePresetId)?.name ?? "Custom"} (Mkt ₹${leverValues.marketingBudget} Cr)`,
      levers: { ...leverValues },
      projectedRevenue: revMetric?.simulatedValue ?? currentWorkspace.metrics[0]?.simulatedValue ?? "N/A",
      projectedProfit: profitMetric?.simulatedValue ?? currentWorkspace.metrics[1]?.simulatedValue ?? "N/A",
      projectedMargin: marginMetric?.simulatedValue ?? currentWorkspace.metrics[2]?.simulatedValue ?? "N/A",
    });

    setSavedScenarios((prev) => [saved, ...prev.filter((s) => s.id !== saved.id)]);
    setSaveSuccessMessage("Scenario Saved!");
    setTimeout(() => {
      setSaveSuccessMessage(undefined);
    }, 3000);
  };

  // Load a saved scenario
  const handleLoadSavedScenario = (saved: SavedScenario) => {
    setLeverValues({ ...saved.levers });
    setSimulationStatus("ready");
    setStatusMessage(`Loaded configuration: ${saved.name}`);
  };

  // Error retry
  const handleRetry = () => {
    setHasError(false);
    setIsInitialLoading(true);
    setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="full">
        {isInitialLoading ? (
          <ScenarioSkeleton />
        ) : hasError ? (
          <ScenarioErrorState onRetry={handleRetry} />
        ) : presets.length === 0 || !currentWorkspace ? (
          <ScenarioEmptyState />
        ) : (
          <div className="space-y-8">
            {/* 1. Scenario Lab Header */}
            <ScenarioHeader
              scenarioName={currentWorkspace.scenarioName}
              lastSimulatedAt={lastSimulatedAt}
              status={simulationStatus}
              statusMessage={statusMessage}
              onRunSimulation={handleRunSimulation}
              onResetBaseline={handleResetBaseline}
            />

            {/* Executive Workflow Guide */}
            <WorkflowStepBanner
              currentStep={5}
              stageName="Scenario Simulation Lab"
              summary="Deterministic microeconomic models evaluate price elasticity, diminishing marketing returns, and inventory fulfillment."
              actionGuidance="Adjust marketing budget, inventory, and pricing levers to stress-test financial projections."
            />

            {/* 2. Scenario Presets */}
            <ScenarioPresets
              presets={presets}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* 3. Decision Lever Controls (Sliders) */}
            <DecisionLeverPanel
              configs={configs}
              values={leverValues}
              onChange={handleLeverChange}
              onResetLever={handleResetLever}
            />

            {/* 4. Projected Business Outcomes Cards */}
            <ProjectedOutcomes metrics={currentWorkspace.metrics} />

            {/* 5. Current vs Simulated State (Table) */}
            <StateComparison metrics={currentWorkspace.metrics} />

            {/* 6. Outcome Curves Chart & Sensitivity Analysis (2-Column Grid) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ScenarioChart metrics={currentWorkspace.metrics} />
              <SensitivityAnalysis sensitivity={currentWorkspace.sensitivity} />
            </div>

            {/* 7. Trade-off Analysis */}
            <TradeoffAnalysis
              categories={currentWorkspace.tradeoffs.categories}
              summary={currentWorkspace.tradeoffs.summary}
            />

            {/* 8. Operational & Financial Constraints */}
            <ConstraintPanel constraints={currentWorkspace.constraints} />

            {/* 9. Simulation Confidence & Uncertainty Range */}
            <ScenarioUncertaintyPanel uncertainty={currentWorkspace.uncertainty} />

            {/* 10. Scenario vs Scenario Comparison */}
            <ScenarioComparison
              currentWorkspace={currentWorkspace}
              allPresets={presets}
              allWorkspaces={allWorkspaces}
            />

            {/* 11. Saved Scenarios & Simulation History */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SavedScenarios
                savedScenarios={savedScenarios}
                onSaveScenario={handleSaveScenario}
                onLoadScenario={handleLoadSavedScenario}
                saveSuccessMessage={saveSuccessMessage}
              />
              <SimulationHistory history={history} />
            </div>

            {/* 12. Next Scenario Actions */}
            <NextScenarioActions />
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
