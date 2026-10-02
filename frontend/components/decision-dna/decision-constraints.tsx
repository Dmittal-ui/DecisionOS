"use client";

import * as React from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNAConstraint } from "@/types/decision-dna";

interface DecisionConstraintsProps {
  constraints: DecisionDNAConstraint[];
  className?: string;
}

export function DecisionConstraints({
  constraints,
  className,
}: DecisionConstraintsProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold">
              Enforced Business Constraints
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Boundary Verification
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Hard governance boundaries and safety thresholds verified when the decision was authorized.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden">
          {constraints.map((c) => {
            const isSatisfied = c.status === "satisfied";
            const isBinding = c.status === "binding";

            return (
              <div
                key={c.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSatisfied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : isBinding ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold text-xs text-foreground">
                      {c.name}
                    </span>
                    <Badge
                      variant={isSatisfied ? "positive" : isBinding ? "warning" : "critical"}
                      className="text-[10px] uppercase font-mono"
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                    <span>
                      Required Limit: <strong className="text-foreground font-mono">{c.requiredLimit}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Selected Value: <strong className="text-foreground font-mono">{c.selectedValue}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between pl-6 sm:pl-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    Safety Margin
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {c.slack}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
