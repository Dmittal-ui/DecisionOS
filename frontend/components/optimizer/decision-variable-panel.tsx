"use client";

import { SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OptimizerDecisionVariable } from "@/types/optimizer-workspace";

interface DecisionVariablePanelProps {
  variables: OptimizerDecisionVariable[];
  className?: string;
}

export function DecisionVariablePanel({ variables, className }: DecisionVariablePanelProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Decision Variables</CardTitle>
        </div>
        <CardDescription>Controllable business levers evaluated by the optimizer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {variables.map((v) => {
          // Calculate positions for the range bar
          const range = v.max - v.min;
          const currentPos = range === 0 ? 0 : ((v.currentValue - v.min) / range) * 100;
          const optPos = range === 0 ? 0 : ((v.optimizedValue - v.min) / range) * 100;

          return (
            <div key={v.key} className="rounded-lg border p-4">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h4 className="font-medium">{v.label} <span className="text-muted-foreground text-sm font-normal">({v.unit})</span></h4>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground text-xs">Current</span>
                    <span className="font-mono text-muted-foreground">{v.currentValue}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-emerald-600 text-xs font-semibold">Optimized</span>
                    <span className="font-mono font-semibold text-emerald-600">{v.optimizedValue}</span>
                  </div>
                </div>
              </div>

              {/* Range Bar */}
              <div className="relative mt-6 h-2 w-full rounded-full bg-secondary">
                {/* Min / Max Labels */}
                <div className="absolute -top-5 left-0 text-xs text-muted-foreground">{v.min}</div>
                <div className="absolute -top-5 right-0 text-xs text-muted-foreground">{v.max}</div>

                {/* Current Value Marker */}
                <div
                  className="absolute top-1/2 h-4 w-1 -translate-y-1/2 bg-blue-500 rounded-sm"
                  style={{ left: `${Math.max(0, Math.min(100, currentPos))}%` }}
                />
                {/* Optimized Value Marker */}
                <div
                  className="absolute top-1/2 h-4 w-1 -translate-y-1/2 bg-emerald-500 rounded-sm z-10"
                  style={{ left: `${Math.max(0, Math.min(100, optPos))}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
