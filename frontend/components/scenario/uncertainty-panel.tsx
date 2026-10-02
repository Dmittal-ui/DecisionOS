import * as React from "react";
import { Scale, AlertCircle } from "lucide-react";
import { ScenarioUncertainty } from "@/types/scenario-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioUncertaintyPanelProps {
  uncertainty: ScenarioUncertainty;
  className?: string;
}

export function ScenarioUncertaintyPanel({
  uncertainty,
  className,
}: ScenarioUncertaintyPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Simulation Confidence & Uncertainty Range
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">
          Model Fidelity
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 items-center">
        {/* Confidence Score */}
        <div className="space-y-1.5 p-3 rounded-md bg-muted/20 border border-border/40">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Simulation Confidence
          </span>
          <div className="pt-1">
            <ConfidenceIndicator score={uncertainty.confidenceScore} size="md" />
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 leading-snug">
            {uncertainty.explanation}
          </p>
        </div>

        {/* Range Boundaries */}
        <div className="space-y-2 p-3 rounded-md bg-muted/20 border border-border/40 md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Projected Confidence Intervals
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {uncertainty.ranges.map((r, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-background border border-border/60 text-xs"
              >
                <span className="text-muted-foreground font-medium">{r.metric}:</span>
                <span className="font-mono font-bold text-foreground">{r.range}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 pt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>
              Confidence reflects simulated input completeness within mock dataset. Full stochastic calibration by Decision Engine pending.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
