"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { OptimizerHardConstraint } from "@/types/optimizer-workspace";

interface ConstraintSlackProps {
  constraints: OptimizerHardConstraint[];
  className?: string;
}

export function ConstraintSlack({ constraints, className }: ConstraintSlackProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Constraint Slack Analysis</CardTitle>
        </div>
        <CardDescription>
          Remaining capacity before each constraint is violated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {constraints.map((constraint, i) => {
          const isBinding = constraint.slackPercent < 10;
          const isSatisfied = constraint.slackPercent > 25;
          const barColor = isBinding 
            ? "bg-amber-500" 
            : isSatisfied 
              ? "bg-emerald-500" 
              : "bg-blue-500";
          const badgeVariant = isBinding ? "warning" : "positive";

          return (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{constraint.name}</span>
                  <Badge variant={badgeVariant as any} className="text-[10px] px-1.5 py-0">
                    {constraint.status || (isBinding ? "Binding" : "Satisfied")}
                  </Badge>
                </div>
                <span className="font-semibold text-sm">
                  {constraint.slackDisplay} slack
                </span>
              </div>
              
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", barColor)} 
                  style={{ width: `${constraint.slackPercent}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Projected: {constraint.projectedDisplay}</span>
                <span>Threshold: {constraint.thresholdDisplay}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
