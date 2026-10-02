"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import type { OptimizerSensitivityDriver } from "@/types/optimizer-workspace";

interface OptimizerSensitivityAnalysisProps {
  sensitivity: OptimizerSensitivityDriver[];
  className?: string;
}

export function OptimizerSensitivityAnalysis({ sensitivity, className }: OptimizerSensitivityAnalysisProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Gauge className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Sensitivity Analysis</CardTitle>
        </div>
        <CardDescription>
          How sensitive is the objective to each decision variable?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sensitivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sensitivity analysis not calculated</p>
        ) : sensitivity.map((driver) => {
          let badgeVariant: "critical" | "warning" | "neutral" = "neutral";
          let barColor = "bg-blue-500";

          if (driver.sensitivityLevel === "High") {
            badgeVariant = "critical";
            barColor = "bg-rose-500";
          } else if (driver.sensitivityLevel === "Medium") {
            badgeVariant = "warning";
            barColor = "bg-amber-500";
          }

          return (
            <div key={driver.variableKey} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{driver.variableLabel}</span>
                  <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0 uppercase">
                    {driver.sensitivityLevel}
                  </Badge>
                </div>
                <span className="font-semibold text-sm font-mono">
                  {driver.impactScore}/10
                </span>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor)}
                  style={{ width: `${driver.barFillPercent}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {driver.explanation}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
