"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OptimizerHardConstraint } from "@/types/optimizer-workspace";

interface ConstraintPanelProps {
  constraints: OptimizerHardConstraint[];
  className?: string;
}

export function ConstraintPanel({ constraints, className }: ConstraintPanelProps) {
  const satisfied = constraints.filter((c) => c.status === "satisfied").length;
  const binding = constraints.filter((c) => c.status === "binding").length;
  const violated = constraints.filter((c) => c.status === "violated").length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Hard Constraints</CardTitle>
            </div>
            <CardDescription>Business boundaries that cannot be violated</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
             {satisfied > 0 && <Badge variant="positive">{satisfied} Satisfied</Badge>}
             {binding > 0 && <Badge variant="warning">{binding} Binding</Badge>}
             {violated > 0 && <Badge variant="critical">{violated} Violated</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {constraints.map((c) => {
          const isViolated = c.status === "violated";
          const isBinding = c.status === "binding";
          return (
            <div 
              key={c.id} 
              className={cn(
                "rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                isViolated && "border-destructive/50 bg-destructive/5"
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{c.name}</h4>
                  <Badge 
                    variant={isViolated ? "critical" : isBinding ? "warning" : "positive"}
                    className="text-[10px] uppercase"
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.rule}</p>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground text-xs">Projected</span>
                  <span className={cn("font-mono font-medium", isViolated && "text-destructive")}>
                    {c.projectedValue}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground text-xs">Limit</span>
                  <span className="font-mono">{c.thresholdValue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
