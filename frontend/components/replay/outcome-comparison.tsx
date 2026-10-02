import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ReplayMetricComparison } from "@/types/replay-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OutcomeComparisonProps {
  metrics: ReplayMetricComparison[];
  className?: string;
}

export function OutcomeComparison({
  metrics,
  className,
}: OutcomeComparisonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <BarChart2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Outcome Comparison: Actual vs Counterfactual
        </h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Synthesized business deltas
        </span>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => {
          const isPositiveDelta =
            metric.delta.startsWith("+") ||
            (metric.delta.startsWith("−") && metric.key === "inventory");

          return (
            <div
              key={metric.key}
              className="rounded-lg border border-border/70 bg-card p-4 space-y-3 shadow-xs hover:border-border transition-colors flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground truncate">
                    {metric.label}
                  </span>
                  <Badge
                    variant={isPositiveDelta ? "positive" : "neutral"}
                    className="font-mono text-[10px] px-1.5 py-0"
                  >
                    {metric.delta}
                  </Badge>
                </div>

                {/* Actual vs Counterfactual Comparison */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Actual
                    </span>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {metric.actualValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Counterfactual
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {metric.counterfactualValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory note */}
              {metric.explanation && (
                <p className="text-[10px] text-muted-foreground leading-snug pt-2 border-t border-border/30">
                  {metric.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
