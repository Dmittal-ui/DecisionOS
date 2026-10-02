"use client";

import * as React from "react";
import { BarChart3, LineChart, Sparkles } from "lucide-react";
import { StateMetricComparison } from "@/types/scenario-workspace";
import { cn } from "@/lib/utils";

interface ScenarioChartProps {
  metrics: StateMetricComparison[];
  className?: string;
}

export function ScenarioChart({ metrics, className }: ScenarioChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<string | null>(null);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Projected Metric Elasticity Curves
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-xs bg-slate-400 dark:bg-slate-600" />
            <span className="text-muted-foreground">Current Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-xs bg-primary" />
            <span className="text-primary font-bold">Simulated Projection</span>
          </div>
        </div>
      </div>

      {/* Comparative Visual Bars */}
      <div className="space-y-4 pt-1">
        {metrics.map((metric) => {
          const max = Math.max(metric.currentNum, metric.simulatedNum);
          const currentPct = Math.round((metric.currentNum / max) * 100);
          const simPct = Math.round((metric.simulatedNum / max) * 100);

          return (
            <div
              key={metric.key}
              className="space-y-1.5 p-2 rounded-md hover:bg-muted/20 transition-colors"
              onMouseEnter={() => setActiveMetric(metric.key)}
              onMouseLeave={() => setActiveMetric(null)}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {metric.label}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-muted-foreground text-[11px]">
                    Current: <strong>{metric.currentValue}</strong>
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-primary text-[11px]">
                    Simulated: <strong>{metric.simulatedValue}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                    {metric.change}
                  </span>
                </div>
              </div>

              {/* Comparative bars */}
              <div className="space-y-1">
                {/* Current */}
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                    style={{ width: `${currentPct}%` }}
                  />
                </div>
                {/* Simulated */}
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${simPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-right pt-2 border-t border-border/30">
        Deterministic scenario response profile
      </p>
    </div>
  );
}
