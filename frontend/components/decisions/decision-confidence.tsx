"use client";

import * as React from "react";
import { ShieldCheck, Info, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import type { DecisionConfidenceDetails } from "@/types/decision-registry";

interface DecisionConfidenceProps {
  confidenceDetails: DecisionConfidenceDetails;
  className?: string;
}

export function DecisionConfidence({
  confidenceDetails,
  className,
}: DecisionConfidenceProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Decision Confidence
            </CardTitle>
          </div>
          <ConfidenceIndicator score={confidenceDetails.score} size="md" />
        </div>
        <CardDescription className="text-xs">
          Statistical scoring computed from data completeness and model signal strength.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {confidenceDetails.explanation}
        </p>

        {/* Confidence Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block">
              High-Confidence Signals
            </span>
            <span className="font-mono font-bold text-sm text-foreground">
              {confidenceDetails.highConfidenceSignals}
            </span>
          </div>

          <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block">
              Supporting Evidence
            </span>
            <span className="font-mono font-bold text-sm text-foreground">
              {confidenceDetails.supportingEvidence}
            </span>
          </div>

          <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground block">
              Constraints Verified
            </span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {confidenceDetails.constraintsVerified}/{confidenceDetails.totalConstraints}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic border-t border-border/40 pt-2.5">
          <Info className="h-3 w-3 shrink-0" />
          <span>Notice: Confidence metrics are mock values for presentation purposes.</span>
        </div>
      </CardContent>
    </Card>
  );
}
