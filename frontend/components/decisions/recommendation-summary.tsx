"use client";

import * as React from "react";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionRecommendation } from "@/types/decision-registry";

interface RecommendationSummaryProps {
  recommendation: DecisionRecommendation;
  className?: string;
}

export function RecommendationSummary({
  recommendation,
  className,
}: RecommendationSummaryProps) {
  const variables = [
    { label: "Marketing Budget", value: recommendation.variables.marketingBudget },
    { label: "Working Inventory", value: recommendation.variables.workingInventory },
    { label: "Unit Price", value: recommendation.variables.unitPrice },
  ];

  const outcomes = [
    { label: "Gross Profit", value: recommendation.projectedOutcomes.grossProfit, isHighlight: true },
    { label: "Revenue", value: recommendation.projectedOutcomes.revenue, isHighlight: false },
    { label: "Operating Margin", value: recommendation.projectedOutcomes.operatingMargin, isHighlight: false },
  ];

  return (
    <Card className={`border-l-4 border-l-emerald-500 shadow-sm ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Recommended Feasible Configuration
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Evaluated feasible decision levers for maximum objective outcome
              </CardDescription>
            </div>
          </div>
          <Badge variant="positive" className="gap-1 px-2.5 py-1 text-xs self-start sm:self-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Constraints Satisfied</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Decision Variables */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Decision Variables
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {variables.map((v) => (
                <div key={v.label} className="rounded-md border border-border/70 bg-muted/30 p-2.5 space-y-1">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {v.label}
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground block">
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Outcomes */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Projected Outcomes
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {outcomes.map((o) => (
                <div key={o.label} className="rounded-md border border-border/70 bg-muted/30 p-2.5 space-y-1">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {o.label}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs sm:text-sm block ${
                      o.isHighlight
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {o.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Footer Note */}
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">
            {recommendation.statusNote || "All configured hard constraints are satisfied."}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto italic hidden sm:inline">
            Mock projected values
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
