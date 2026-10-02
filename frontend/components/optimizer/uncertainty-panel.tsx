"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OptimizerConfidence } from "@/types/optimizer-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";

interface UncertaintyPanelProps {
  confidence: OptimizerConfidence;
  className?: string;
}

export function OptimizerUncertaintyPanel({ confidence, className }: UncertaintyPanelProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          Optimization Confidence
        </CardTitle>
        <CardDescription>Confidence score and projected outcome bounds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {confidence.available === false ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Confidence interval not calculated</p>
            <p className="text-sm text-muted-foreground">
              {confidence.explanation || "Confidence interval not calculated"}
            </p>
            <div className="border-l-2 border-amber-400 bg-amber-50/10 p-3 rounded-r-md">
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                {confidence.disclaimer}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/3">
                <ConfidenceIndicator score={confidence.score} />
              </div>
              <div className="w-full md:w-2/3">
                <p className="text-sm text-muted-foreground">
                  {confidence.explanation}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Projected Ranges (90% Confidence)</h4>
              <ul className="space-y-2">
                {confidence.ranges.map((range, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{range.metric}</span>
                    <span className="font-mono bg-muted/60 px-2 py-1 rounded text-foreground font-medium">{range.range}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-l-2 border-amber-400 bg-amber-50/10 p-3 rounded-r-md">
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                {confidence.disclaimer}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const UncertaintyPanel = OptimizerUncertaintyPanel;
