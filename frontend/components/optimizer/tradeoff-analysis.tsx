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
import { Scale, ArrowRightLeft } from "lucide-react";
import { OptimizerTradeoff } from "@/types/optimizer-workspace";

interface TradeoffAnalysisProps {
  tradeoffs: OptimizerTradeoff[];
  className?: string;
}

export function TradeoffAnalysis({ tradeoffs, className }: TradeoffAnalysisProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Trade-off Analysis</CardTitle>
        </div>
        <CardDescription>
          Key trade-offs in the recommended configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tradeoffs.map((tradeoff, i) => (
          <div key={i} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
            <h4 className="font-semibold text-sm">{tradeoff.title}</h4>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1 bg-muted/40 p-3 rounded-md text-center">
                <div className="text-xs text-muted-foreground mb-1">{tradeoff.metric1.label}</div>
                <div className={cn("font-medium", tradeoff.metric1.direction === "positive" ? "text-emerald-600" : "text-rose-600")}>
                  {tradeoff.metric1.value}
                </div>
              </div>
              
              <div className="text-muted-foreground">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              
              <div className="flex-1 bg-muted/40 p-3 rounded-md text-center">
                <div className="text-xs text-muted-foreground mb-1">{tradeoff.metric2.label}</div>
                <div className={cn("font-medium", tradeoff.metric2.direction === "positive" ? "text-emerald-600" : "text-rose-600")}>
                  {tradeoff.metric2.value}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {tradeoff.insight}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
