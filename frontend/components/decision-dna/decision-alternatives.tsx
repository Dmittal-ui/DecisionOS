"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, CircleDot, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionAlternative, AlternativeStatus } from "@/types/decision-dna";

interface DecisionAlternativesProps {
  alternatives: DecisionAlternative[];
  className?: string;
}

export function DecisionAlternatives({
  alternatives,
  className,
}: DecisionAlternativesProps) {
  const getStatusBadge = (status: AlternativeStatus) => {
    switch (status) {
      case "selected":
        return (
          <Badge variant="positive" className="gap-1 text-[10px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Selected</span>
          </Badge>
        );
      case "considered":
        return (
          <Badge variant="warning" className="gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            <span>Considered</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="critical" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      case "not_selected":
      default:
        return (
          <Badge variant="neutral" className="gap-1 text-[10px]">
            <CircleDot className="h-3 w-3" />
            <span>Not Selected</span>
          </Badge>
        );
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">
            Alternatives Considered
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {alternatives.length} scenarios evaluated
          </span>
        </div>
        <CardDescription className="text-xs">
          Explicit alternative configurations evaluated prior to final decision selection. Alternatives are not ranked objectively as "best", but evaluated under explicit trade-offs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {alternatives.map((alt) => {
            const isSelected = alt.status === "selected";

            return (
              <div
                key={alt.id}
                className={`rounded-lg border p-4 space-y-3 transition-all ${
                  isSelected
                    ? "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                    : "border-border/70 bg-card hover:border-border"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">
                      {alt.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {alt.description}
                    </p>
                  </div>
                  {getStatusBadge(alt.status)}
                </div>

                {/* Levers & Projections Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/40 font-mono">
                  <div className="rounded bg-muted/40 p-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-sans block">
                      Marketing
                    </span>
                    <span className="font-bold">{alt.marketingBudget}</span>
                  </div>
                  <div className="rounded bg-muted/40 p-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-sans block">
                      Inventory
                    </span>
                    <span className="font-bold">{alt.workingInventory}</span>
                  </div>
                  <div className="rounded bg-muted/40 p-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-sans block">
                      Unit Price
                    </span>
                    <span className="font-bold">{alt.unitPrice}</span>
                  </div>
                </div>

                {/* Outcomes Summary */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 text-muted-foreground">
                  <span>
                    Gross Profit: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{alt.expectedProfit}</strong>
                  </span>
                  <span>
                    Margin: <strong className="font-mono text-foreground">{alt.expectedMargin}</strong>
                  </span>
                  <span>
                    Confidence: <strong className="font-mono text-primary">{alt.confidence}%</strong>
                  </span>
                </div>

                {/* Rejection / Non-selection Reason */}
                {alt.rejectionReason && (
                  <div className="rounded bg-muted/30 p-2 text-[10px] text-muted-foreground italic border border-border/40">
                    <strong>Note:</strong> {alt.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
