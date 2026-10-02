"use client";

import * as React from "react";
import { BarChart3, Info } from "lucide-react";
import { ReplayMetricComparison } from "@/types/replay-workspace";
import { cn } from "@/lib/utils";

interface ReplayChartProps {
  metrics: ReplayMetricComparison[];
  className?: string;
}

export function ReplayChart({ metrics, className }: ReplayChartProps) {
  const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      {/* Header & Legend */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Visual Impact Differential (Actual vs Counterfactual)
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-xs bg-slate-400 dark:bg-slate-600" />
            <span className="text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-xs bg-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              Counterfactual Alternative
            </span>
          </div>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="space-y-4 pt-1">
        {metrics.map((metric) => {
          // Calculate relative percentage for visual representation
          const max = Math.max(metric.actualNum, metric.counterfactualNum);
          const actualPct = Math.round((metric.actualNum / max) * 100);
          const cfPct = Math.round((metric.counterfactualNum / max) * 100);

          return (
            <div
              key={metric.key}
              className="space-y-1.5 p-2 rounded-md hover:bg-muted/20 transition-colors"
              onMouseEnter={() => setActiveTooltip(metric.key)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {/* Metric Label & Values */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {metric.label}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-muted-foreground text-[11px]">
                    Actual: <span className="font-bold text-foreground">{metric.actualValue}</span>
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                    CF: <span className="font-bold">{metric.counterfactualValue}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                    {metric.delta}
                  </span>
                </div>
              </div>

              {/* Side-by-side or stacked comparative progress bars */}
              <div className="space-y-1">
                {/* Actual Bar */}
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                    style={{ width: `${actualPct}%` }}
                    title={`Actual: ${metric.actualValue}`}
                  />
                </div>

                {/* Counterfactual Bar */}
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${cfPct}%` }}
                    title={`Counterfactual: ${metric.counterfactualValue}`}
                  />
                </div>
              </div>

              {/* Context Explanation */}
              {activeTooltip === metric.key && metric.explanation && (
                <p className="text-[10px] text-muted-foreground italic pt-0.5">
                  Note: {metric.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-right pt-2 border-t border-border/30">
        Comparative bar scale normalized to peak realization within metric class
      </p>
    </div>
  );
}
