"use client";

import * as React from "react";
import {
  Calendar,
  GitBranch,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { HistoricalDecisionOption, ReplayStatus } from "@/types/replay-workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HistoricalDecisionSelectorProps {
  decisions: HistoricalDecisionOption[];
  selectedDecisionId: string;
  selectedBranchId: string;
  selectedDate: string;
  replayStatus: ReplayStatus;
  onSelectDecision: (decisionId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onSelectDate: (date: string) => void;
  onRunReplay: () => void;
  className?: string;
}

export function HistoricalDecisionSelector({
  decisions,
  selectedDecisionId,
  selectedBranchId,
  selectedDate,
  replayStatus,
  onSelectDecision,
  onSelectBranch,
  onSelectDate,
  onRunReplay,
  className,
}: HistoricalDecisionSelectorProps) {
  const currentDecision =
    decisions.find((d) => d.id === selectedDecisionId) ?? decisions[0];

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-4 shadow-sm space-y-4",
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Replay Configuration & Controls
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Select historical decision point and alternative counterfactual branch
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Historical Decision Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-muted-foreground" />
            Historical Decision
          </label>
          <div className="space-y-1">
            <select
              value={selectedDecisionId}
              onChange={(e) => onSelectDecision(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {decisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.date})
                </option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              Original: {currentDecision.actionTaken}
            </p>
          </div>
        </div>

        {/* 2. Historical Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            Historical Date
          </label>
          <div className="space-y-1">
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={currentDecision.date}>{currentDecision.date} (Baseline)</option>
              <option value="01 June 2026">01 June 2026 (Pre-Decision Window)</option>
              <option value="30 June 2026">30 June 2026 (Post-Execution Audit)</option>
            </select>
            <p className="text-[10px] text-muted-foreground">
              Anchor point for counterfactual deviation
            </p>
          </div>
        </div>

        {/* 3. Counterfactual Branch */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <GitBranch className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Counterfactual Branch
          </label>
          <div className="space-y-1">
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="w-full h-9 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
            >
              {currentDecision.availableBranches.map((br) => (
                <option key={br.id} value={br.id}>
                  {br.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {currentDecision.availableBranches.find((b) => b.id === selectedBranchId)
                ?.description ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Branch Chips & Execute CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Available Branches:
          </span>
          {currentDecision.availableBranches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBranch(b.id)}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium transition-colors border",
                selectedBranchId === b.id
                  ? "border-emerald-500 bg-emerald-500 text-white font-semibold"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {b.label.split("(")[0].trim()}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={onRunReplay}
          disabled={replayStatus === "running"}
          className="gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw
            className={cn("h-3.5 w-3.5", replayStatus === "running" && "animate-spin")}
          />
          <span>{replayStatus === "running" ? "Reconstructing Replay..." : "Run Replay"}</span>
        </Button>
      </div>
    </div>
  );
}
