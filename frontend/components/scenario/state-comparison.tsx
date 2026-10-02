import * as React from "react";
import { Table, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { StateMetricComparison } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StateComparisonProps {
  metrics: StateMetricComparison[];
  className?: string;
}

export function StateComparison({ metrics, className }: StateComparisonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Current vs Simulated Business State
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Deterministic projection summary
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
              <th className="text-left py-2.5 px-3">Metric</th>
              <th className="text-right py-2.5 px-3">Current Baseline</th>
              <th className="text-center py-2.5 px-2"></th>
              <th className="text-right py-2.5 px-3 text-primary">Simulated Projection</th>
              <th className="text-right py-2.5 px-3">Delta Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {metrics.map((m) => {
              const isPos = m.change.startsWith("+");
              const isNeg = m.change.startsWith("−");

              return (
                <tr key={m.key} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground">
                    {m.label}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground font-medium">
                    {m.currentValue}
                  </td>
                  <td className="py-3 px-2 text-center text-muted-foreground/40">
                    <ArrowRight className="h-3 w-3 inline" />
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                    {m.simulatedValue}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded border",
                        isPos &&
                          "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
                        isNeg &&
                          (m.key === "inventory"
                            ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"),
                        !isPos && !isNeg && "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {isPos && <TrendingUp className="h-3 w-3" />}
                      {isNeg && <TrendingDown className="h-3 w-3" />}
                      {!isPos && !isNeg && <Minus className="h-3 w-3" />}
                      {m.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
