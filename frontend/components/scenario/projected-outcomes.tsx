import * as React from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity } from "lucide-react";
import { StateMetricComparison } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectedOutcomesProps {
  metrics: StateMetricComparison[];
  className?: string;
}

export function ProjectedOutcomes({ metrics, className }: ProjectedOutcomesProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Projected Business Outcomes
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Real-time response cards
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => {
          const isPos = m.change.startsWith("+");
          const isNeg = m.change.startsWith("−");
          const isFavorable =
            isPos || (isNeg && m.key === "inventory");

          return (
            <div
              key={m.key}
              className="rounded-lg border border-border/70 bg-card p-4 space-y-3 shadow-xs hover:border-border transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground truncate">
                  {m.label}
                </span>
                <Badge
                  variant={isFavorable ? "positive" : "neutral"}
                  className="font-mono text-[10px] px-1.5 py-0"
                >
                  {m.change}
                </Badge>
              </div>

              {/* Transition: Current -> Simulated */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Simulated
                  </span>
                  <span className="text-muted-foreground/60 text-[10px]">
                    from {m.currentValue}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-bold text-foreground">
                    {m.simulatedValue}
                  </span>
                  <div className="flex items-center text-xs">
                    {isFavorable ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
