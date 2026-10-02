"use client";

import * as React from "react";
import { BusinessHealthData } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertCircle } from "lucide-react";

interface BusinessHealthPanelProps {
  health: BusinessHealthData;
}

export function BusinessHealthPanel({ health }: BusinessHealthPanelProps) {
  return (
    <Card className="border-border/80 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base font-bold">Business Health Index</CardTitle>
          </div>
          <Badge variant="positive" className="text-[10px] font-semibold">
            COMPOSITE SCORE
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Holistic multi-factor synthesis evaluating operational vitality.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        {/* Big Composite Gauge Score Banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Enterprise Vitality
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {health.compositeScore}
              </span>
              <span className="text-xs font-mono text-muted-foreground">/ 100</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                (Top 5% Quartile)
              </span>
            </div>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-500/80 shrink-0" />
        </div>

        {/* Breakdown into 5 Key Indicators */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Vitality Sub-Indicators
          </span>

          <div className="space-y-2">
            {health.indicators.map((ind, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-center justify-between text-xs hover:border-border transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span>{ind.name}</span>
                    {ind.status === "warning" && (
                      <Badge variant="warning" className="text-[9px] px-1 py-0 h-4">
                        ATTENTION
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    {ind.detail}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 font-mono font-bold text-foreground">
                    <span>{ind.metricValue}</span>
                    {ind.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                    {ind.trend === "down" && <TrendingDown className="h-3 w-3 text-rose-500" />}
                    {ind.trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Score: {ind.score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
