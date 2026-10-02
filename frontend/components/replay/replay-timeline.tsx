"use client";

import * as React from "react";
import {
  GitFork,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  TimelineBranchStep,
  TimelineMetricChange,
} from "@/types/replay-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReplayTimelineProps {
  decisionPoint: {
    date: string;
    title: string;
    originalAction: string;
    description: string;
  };
  counterfactualBranchLabel: string;
  actualTimeline: TimelineBranchStep[];
  counterfactualTimeline: TimelineBranchStep[];
  className?: string;
}

function MetricPill({ change }: { change: TimelineMetricChange }) {
  const isPos = change.direction === "positive";
  const isNeg = change.direction === "negative";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-medium border",
        isPos &&
          "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
        isNeg &&
          "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
        !isPos &&
          !isNeg &&
          "border-border bg-muted/60 text-muted-foreground"
      )}
    >
      {isPos && <TrendingUp className="h-3 w-3 shrink-0" />}
      {isNeg && <TrendingDown className="h-3 w-3 shrink-0" />}
      {!isPos && !isNeg && <Minus className="h-3 w-3 shrink-0" />}
      <span className="font-semibold">{change.label}:</span>
      <span>{change.value}</span>
    </div>
  );
}

function TimelineStepCard({
  step,
  isCounterfactual,
}: {
  step: TimelineBranchStep;
  isCounterfactual: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 space-y-2.5 transition-all shadow-sm",
        isCounterfactual
          ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-300"
          : "border-border/80 bg-card hover:border-border"
      )}
    >
      {/* Top Header: Period, Date, Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isCounterfactual ? "positive" : "neutral"}
            className="text-[10px] font-mono font-bold"
          >
            {step.periodLabel}
          </Badge>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {step.date}
          </span>
        </div>

        {isCounterfactual ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" />
            Simulated Path
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Info className="h-3 w-3" />
            Historical Reality
          </span>
        )}
      </div>

      {/* Event Title */}
      <h4 className="text-xs font-bold text-foreground leading-snug">
        {step.eventTitle}
      </h4>

      {/* Metric Changes */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {step.metricChanges.map((m, idx) => (
          <MetricPill key={idx} change={m} />
        ))}
      </div>

      {/* Explanation */}
      <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/30">
        {step.explanation}
      </p>
    </div>
  );
}

export function ReplayTimeline({
  decisionPoint,
  counterfactualBranchLabel,
  actualTimeline,
  counterfactualTimeline,
  className,
}: ReplayTimelineProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <GitFork className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Timeline Comparison: Actual vs Counterfactual
        </h3>
        <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
          Tracing path deviation across historical review intervals
        </span>
      </div>

      {/* ─── DECISION POINT MARKER (Visually Prominent Fork Point) ─── */}
      <div className="relative rounded-xl border-2 border-primary/50 bg-primary/5 dark:bg-primary/10 p-5 shadow-sm text-center">
        {/* Horizontal Line Background Marker */}
        <div
          className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-0 hidden md:block"
          aria-hidden
        />

        <div className="relative z-10 space-y-2 max-w-2xl mx-auto">
          {/* Badge & Pulse Dot */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-3 py-1 shadow-xs">
            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Historical Decision Fork Point
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-xs font-mono font-medium text-foreground">
              {decisionPoint.date}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground">
            {decisionPoint.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {decisionPoint.description}
          </p>

          <div className="inline-block bg-muted/60 px-3 py-1 rounded text-xs font-mono text-foreground border border-border/60 mt-1">
            Enacted Action: <span className="font-bold">{decisionPoint.originalAction}</span>
          </div>
        </div>

        {/* Visual Fork Arrows Indicator */}
        <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-center gap-8 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>← Actual Historical Branch</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span>Counterfactual Alternative Branch →</span>
          </div>
        </div>
      </div>

      {/* ─── DUAL TIMELINE BRANCHES ─── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. ACTUAL TIMELINE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Actual Timeline
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Empirical Record
            </Badge>
          </div>

          <div className="space-y-3">
            {actualTimeline.map((step) => (
              <TimelineStepCard key={step.id} step={step} isCounterfactual={false} />
            ))}
          </div>
        </div>

        {/* 2. COUNTERFACTUAL TIMELINE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-emerald-500/80 pb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Counterfactual Timeline
              </h4>
            </div>
            <Badge
              variant="positive"
              className="text-[10px] max-w-[200px] truncate"
              title={counterfactualBranchLabel}
            >
              {counterfactualBranchLabel.split("(")[0].trim()}
            </Badge>
          </div>

          <div className="space-y-3">
            {counterfactualTimeline.map((step) => (
              <TimelineStepCard key={step.id} step={step} isCounterfactual={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
