import * as React from "react";
import { AlertCircle, ShieldAlert, Sparkles, Scale } from "lucide-react";
import { ReplayUncertainty } from "@/types/replay-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UncertaintyPanelProps {
  uncertainty: ReplayUncertainty;
  className?: string;
}

export function UncertaintyPanel({
  uncertainty,
  className,
}: UncertaintyPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Counterfactual Confidence & Uncertainty Range
          </h4>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">
          Empirical Bound
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 items-center">
        {/* Confidence Score */}
        <div className="space-y-1.5 p-3 rounded-md bg-muted/20 border border-border/40">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Counterfactual Confidence
          </span>
          <div className="pt-1">
            <ConfidenceIndicator score={uncertainty.confidenceScore} size="md" />
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 leading-snug">
            {uncertainty.explanation}
          </p>
        </div>

        {/* Uncertainty Range */}
        <div className="space-y-2 p-3 rounded-md bg-muted/20 border border-border/40 md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Simulation Uncertainty Boundaries
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

          {/* Explicit Mock Data / Calibration Notice */}
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 pt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>
              Confidence metric reflects simulated evidence strength within mock dataset. Calibration by Person B Decision Engine pending.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
