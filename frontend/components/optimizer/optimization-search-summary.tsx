"use client";

import { Search, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OptimizerSearchSummary } from "@/types/optimizer-workspace";

interface OptimizationSearchSummaryProps {
  summary: OptimizerSearchSummary;
  className?: string;
}

export function OptimizationSearchSummary({ summary, className }: OptimizationSearchSummaryProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Optimization Search Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-4">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Search Space</div>
            <div className="text-xl font-bold font-mono">{summary.totalCandidates.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Feasible</div>
            <div className="text-xl font-bold font-mono text-emerald-600">{summary.feasibleCount.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Infeasible</div>
            <div className="text-xl font-bold font-mono text-muted-foreground">{summary.infeasibleCount.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Best Config</div>
            <div className="text-xl font-bold font-mono text-primary">{summary.bestConfigLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {summary.bindingConstraint ? `Binding: ${summary.bindingConstraint}` : "No binding constraints."}
          </span>
          <span className="shrink-0 font-mono text-xs border-l pl-2 border-border/50">
            {summary.solverTimeMs}ms
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
