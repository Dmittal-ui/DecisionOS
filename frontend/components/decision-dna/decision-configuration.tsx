"use client";

import * as React from "react";
import { SlidersHorizontal, CheckCircle2, User, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNAConfiguration } from "@/types/decision-dna";

interface DecisionConfigurationProps {
  current: DecisionDNAConfiguration;
  recommended: DecisionDNAConfiguration;
  selected: DecisionDNAConfiguration;
  action: "approved" | "modified" | "rejected" | "pending_review";
  className?: string;
}

export function DecisionConfiguration({
  current,
  recommended,
  selected,
  action,
  className,
}: DecisionConfigurationProps) {
  const isModified = action === "modified";
  const isPending = action === "pending_review";
  const selectedColumnLabel = isPending
    ? "3. Pending Human Selection"
    : isModified
    ? "3. Modified by Human"
    : action === "rejected"
    ? "3. Rejected"
    : "3. Selected by Human";

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              3-Way Configuration Comparison
            </CardTitle>
          </div>
          <Badge variant={isModified ? "enterprise" : isPending ? "outline" : "positive"} className="text-[10px] font-mono">
            {isPending
              ? "Awaiting Human Authorization"
              : isModified
              ? "Human-Modified Configuration Selected"
              : "Recommended Configuration Selected"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Direct comparative breakdown between Baseline, Machine Recommendation, and Authoritative Human Selection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/70 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Parameter / Metric</th>
                <th className="py-3 px-4 font-mono">1. Current Baseline</th>
                <th className="py-3 px-4 font-mono">2. Recommended</th>
                <th className={`py-3 px-4 font-mono font-bold ${isPending ? "text-amber-600 dark:text-amber-400 bg-amber-50/20" : "bg-primary/5 text-primary"}`}>
                  {selectedColumnLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {/* Levers */}
              <tr className="hover:bg-muted/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">
                  Marketing Budget
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.marketingBudget}</td>
                <td className="py-3 px-4 text-foreground">{recommended.marketingBudget}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-primary"}`}>
                  {isPending ? "Pending Selection" : selected.marketingBudget}
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">
                  Working Inventory
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.workingInventory}</td>
                <td className="py-3 px-4 text-foreground">{recommended.workingInventory}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-primary"}`}>
                  {isPending ? "Pending Selection" : selected.workingInventory}
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">
                  Unit Price
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.unitPrice}</td>
                <td className="py-3 px-4 text-foreground">{recommended.unitPrice}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-primary"}`}>
                  {isPending ? "Pending Selection" : selected.unitPrice}
                </td>
              </tr>

              {/* Outcomes */}
              <tr className="hover:bg-muted/20 border-t-2 border-border/60 bg-muted/10">
                <td className="py-3 px-4 font-sans font-bold text-foreground">
                  Expected Gross Profit
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.expectedProfit}</td>
                <td className="py-3 px-4 text-foreground">{recommended.expectedProfit}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-emerald-600 dark:text-emerald-400"}`}>
                  {isPending ? "Pending Selection" : selected.expectedProfit}
                </td>
              </tr>

              <tr className="hover:bg-muted/20 bg-muted/10">
                <td className="py-3 px-4 font-sans font-bold text-foreground">
                  Expected Revenue
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.expectedRevenue}</td>
                <td className="py-3 px-4 text-foreground">{recommended.expectedRevenue}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-foreground"}`}>
                  {isPending ? "Pending Selection" : selected.expectedRevenue}
                </td>
              </tr>

              <tr className="hover:bg-muted/20 bg-muted/10">
                <td className="py-3 px-4 font-sans font-bold text-foreground">
                  Operating Margin
                </td>
                <td className="py-3 px-4 text-muted-foreground">{current.expectedMargin}</td>
                <td className="py-3 px-4 text-foreground">{recommended.expectedMargin}</td>
                <td className={`py-3 px-4 ${isPending ? "text-muted-foreground italic bg-amber-50/10" : "bg-primary/5 font-bold text-foreground"}`}>
                  {isPending ? "Pending Selection" : selected.expectedMargin}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

