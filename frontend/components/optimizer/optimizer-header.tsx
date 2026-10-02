"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  Save,
  RotateCcw,
} from "lucide-react";
import type { OptimizerRunStatus, OptimizerRunStep } from "@/types/optimizer-workspace";

interface OptimizerHeaderProps {
  runStatus: OptimizerRunStatus;
  currentStep: OptimizerRunStep | null;
  onRunOptimization: () => void;
  onReset: () => void;
  onSave: () => void;
  hasViolations: boolean;
}

const STATUS_CONFIG: Record<
  OptimizerRunStatus,
  { label: string; variant: "positive" | "warning" | "critical" | "neutral" | "enterprise" }
> = {
  idle: { label: "Ready", variant: "neutral" },
  running: { label: "Optimizing…", variant: "warning" },
  complete: { label: "Optimization Complete", variant: "positive" },
  error: { label: "Error", variant: "critical" },
};

const STEP_LABELS: Record<OptimizerRunStep, string> = {
  validating_constraints: "Validating constraints…",
  evaluating_configurations: "Evaluating feasible configurations…",
  comparing_objectives: "Comparing objectives…",
  selecting_recommendation: "Selecting recommended configuration…",
};

export function OptimizerHeader({
  runStatus,
  currentStep,
  onRunOptimization,
  onReset,
  onSave,
  hasViolations,
}: OptimizerHeaderProps) {
  const statusCfg = STATUS_CONFIG[runStatus];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Constraint-Aware Optimizer
          </h1>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Evaluate feasible decision configurations under explicit business constraints to find the strongest objective outcome.
        </p>
        {runStatus === "running" && currentStep && (
          <div className="flex items-center gap-2 pt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onReset}
          disabled={runStatus === "running"}
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Reset</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onSave}
          disabled={runStatus === "running"}
        >
          <Save className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Save Config</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={onRunOptimization}
          disabled={runStatus === "running" || hasViolations}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>{runStatus === "running" ? "Running…" : "Run Optimization"}</span>
        </Button>
      </div>
    </div>
  );
}
