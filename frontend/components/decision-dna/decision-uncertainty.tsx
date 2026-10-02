"use client";

import * as React from "react";
import { AlertCircle, Gauge, Info, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import type { DecisionUncertaintyDetails } from "@/types/decision-dna";

interface DecisionUncertaintyProps {
  uncertainty: DecisionUncertaintyDetails;
  className?: string;
}

export function DecisionUncertainty({
  uncertainty,
  className,
}: DecisionUncertaintyProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-bold">
              Uncertainty & Sensitivity Bounds
            </CardTitle>
          </div>
          <ConfidenceIndicator score={uncertainty.confidence} size="sm" />
        </div>
        <CardDescription className="text-xs">
          Monte Carlo sensitivity envelopes showing Downside, Base Case, and Upside projections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Projections Triad */}
        <div className="grid grid-cols-3 gap-2.5 text-xs text-center font-mono">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-sans block">
              Downside (P10)
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm block mt-0.5">
              {uncertainty.downsideProfit}
            </span>
          </div>

          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-2.5">
            <span className="text-[10px] text-primary uppercase font-sans font-bold block">
              Base Case (P50)
            </span>
            <span className="font-bold text-foreground text-sm block mt-0.5">
              {uncertainty.baseCaseProfit}
            </span>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-sans block">
              Upside (P90)
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
              {uncertainty.upsideProfit}
            </span>
          </div>
        </div>

        {/* Ranges Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="rounded border bg-card p-2.5 flex justify-between items-center">
            <span className="text-[11px] font-sans text-muted-foreground">Revenue 90% CI:</span>
            <span className="font-bold text-foreground">{uncertainty.revenueRange}</span>
          </div>
          <div className="rounded border bg-card p-2.5 flex justify-between items-center">
            <span className="text-[11px] font-sans text-muted-foreground">Profit 90% CI:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{uncertainty.grossProfitRange}</span>
          </div>
        </div>

        {/* Key Uncertainty Drivers */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Key Macro & Market Uncertainty Drivers
          </span>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {uncertainty.keyDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
