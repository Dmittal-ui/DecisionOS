"use client";

import * as React from "react";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Scale, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionComparisonItem } from "@/types/decision-registry";

interface RecommendationComparisonProps {
  comparisons: DecisionComparisonItem[];
  className?: string;
}

export function RecommendationComparison({
  comparisons,
  className,
}: RecommendationComparisonProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Current vs. Recommended Configuration
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Mock Projected Comparison
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Direct comparative delta between current baseline operational parameters and recommended feasible values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Comparison Table */}
        <div className="rounded-lg border border-border/70 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">Metric / Variable</th>
                <th className="py-2.5 px-4 font-mono">Current</th>
                <th className="py-2.5 px-4 font-mono">Recommended</th>
                <th className="py-2.5 px-4 text-right font-mono">Projected Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {comparisons.map((item) => {
                const isPositive = item.change.startsWith("+");
                const isNegative = item.change.startsWith("-");

                return (
                  <tr key={item.metric} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium text-foreground">
                      {item.metric}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {item.current}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {item.recommended}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isNegative
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPositive && <ArrowUpRight className="h-3 w-3" />}
                        {isNegative && <ArrowDownRight className="h-3 w-3" />}
                        {item.change}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Notice: Values represent simulated comparative models. Calculations are not computed in real-time.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
