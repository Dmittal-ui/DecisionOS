"use client";

import * as React from "react";
import { TrendingUp, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNAOutcome } from "@/types/decision-dna";

interface DecisionOutcomeProps {
  outcome: DecisionDNAOutcome;
  className?: string;
}

export function DecisionOutcome({ outcome, className }: DecisionOutcomeProps) {
  const isPending = outcome.status === "pending";

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Expected vs. Actual Outcome Verification
            </CardTitle>
          </div>
          <Badge
            variant={
              outcome.status === "achieved"
                ? "positive"
                : outcome.status === "partially_achieved"
                ? "warning"
                : outcome.status === "missed"
                ? "critical"
                : "neutral"
            }
            className="text-[10px] uppercase font-mono"
          >
            {outcome.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Post-decision variance reconciliation comparing projected model targets against empirical field performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          /* Outcome Pending Empty State */
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2.5 bg-muted/10">
            <Clock className="mx-auto h-7 w-7 text-amber-500/80" />
            <h4 className="text-sm font-semibold text-foreground">Outcome Tracking In Progress</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {outcome.explanation || "Actual operational metrics are currently being collected across the 30-day monitoring window. Final variance reports will populate once data reconciles."}
            </p>
          </div>
        ) : (
          /* Reconciled Outcomes Table & Summary */
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-900 dark:text-emerald-300">
              <p className="font-semibold">{outcome.summary}</p>
              <p className="text-emerald-800/90 dark:text-emerald-400/90 mt-0.5">{outcome.explanation}</p>
            </div>

            <div className="rounded-lg border border-border/70 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-2.5 px-4">Metric</th>
                    <th className="py-2.5 px-4 font-mono">1. Expected Target</th>
                    <th className="py-2.5 px-4 font-mono font-bold text-foreground">2. Actual Realized</th>
                    <th className="py-2.5 px-4 text-right font-mono">3. Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {outcome.metrics.map((m) => (
                    <tr key={m.metric} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-sans font-medium text-foreground">
                        {m.metric}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{m.expected}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{m.actual}</td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                            m.varianceType === "positive"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : m.varianceType === "negative"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.varianceType === "positive" && <ArrowUpRight className="h-3 w-3" />}
                          {m.varianceType === "negative" && <ArrowDownRight className="h-3 w-3" />}
                          {m.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
