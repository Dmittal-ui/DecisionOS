"use client";

import * as React from "react";
import { AlertCircle, TrendingUp, DollarSign, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { DecisionConfidenceDetails } from "@/types/decision-registry";

interface DecisionUncertaintyProps {
  confidenceDetails: DecisionConfidenceDetails;
  className?: string;
}

export function DecisionUncertainty({
  confidenceDetails,
  className,
}: DecisionUncertaintyProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-bold">
            Projected Uncertainty & Ranges
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Confidence intervals evaluating macroeconomic sensitivity and demand variance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ranges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                Projected Gross Profit Range
              </span>
            </div>
            <p className="font-mono font-bold text-sm text-foreground">
              {confidenceDetails.projectedProfitRange}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                Projected Revenue Range
              </span>
            </div>
            <p className="font-mono font-bold text-sm text-foreground">
              {confidenceDetails.projectedRevenueRange}
            </p>
          </div>
        </div>

        {/* Uncertainty Explanation */}
        <div className="rounded-md border-l-2 border-amber-500 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
          <p className="leading-relaxed">
            {confidenceDetails.uncertaintyExplanation}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
          <Info className="h-3 w-3 shrink-0" />
          <span>Notice: Projected ranges represent mock workspace uncertainty bounds.</span>
        </div>
      </CardContent>
    </Card>
  );
}
