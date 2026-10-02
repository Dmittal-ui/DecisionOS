"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import type { RecommendedConfiguration } from "@/types/optimizer-workspace";

interface RecommendedConfigPanelProps {
  recommendation: RecommendedConfiguration | null;
  className?: string;
}

export function RecommendedConfigPanel({
  recommendation,
  className,
}: RecommendedConfigPanelProps) {
  if (!recommendation) {
    return (
      <Card className={cn("border-l-4 border-l-amber-500 shadow-sm", className)}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recommended Feasible Configuration</CardTitle>
          <CardDescription>No feasible configuration satisfies all hard constraints.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const variables = [
    { name: "Marketing Budget", value: recommendation.marketingBudget },
    { name: "Working Inventory", value: recommendation.workingInventory },
    { name: "Unit Price", value: recommendation.unitPrice },
  ];

  const metrics = [
    { name: "Gross Profit", value: recommendation.projectedGrossProfit, highlight: true },
    { name: "Revenue", value: recommendation.projectedRevenue, highlight: false },
    { name: "Gross Margin", value: recommendation.projectedMargin, highlight: false },
  ];

  return (
    <Card className={cn("border-l-4 border-l-emerald-500 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900/30">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                Recommended Feasible Configuration
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Optimized parameters for maximum objective performance
              </CardDescription>
            </div>
          </div>
          <Badge variant="enterprise" className="px-3 py-1 text-sm">
            Optimal
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Decision Variables
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {variables.map((v) => (
                <div key={v.name} className="bg-muted/50 p-3 rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">{v.name}</div>
                  <div className="font-semibold font-mono">{v.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Projected Outcomes
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((m) => (
                <div key={m.name} className="bg-muted/50 p-3 rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">{m.name}</div>
                  <div
                    className={cn(
                      "font-semibold font-mono",
                      m.highlight
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-5">
          <div className="flex items-center mb-4 sm:mb-0">
            <Badge variant="positive" className="text-sm px-2 py-1">
              {recommendation.improvementVsCurrent}
            </Badge>
            <span className="text-xs text-muted-foreground ml-3 italic">
              This is the recommended feasible configuration, not guaranteed optimal.
            </span>
          </div>

          <div className="flex space-x-3">
            <Link href="/decisions">
              <Button variant="outline">Review Decision</Button>
            </Link>
            <Link href="/scenario">
              <Button variant="default">Test in Scenario Lab</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
