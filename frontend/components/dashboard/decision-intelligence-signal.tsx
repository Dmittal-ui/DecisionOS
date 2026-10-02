"use client";

import * as React from "react";
import Link from "next/link";
import { IntelligenceSignal } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, TrendingUp, TrendingDown, ArrowUpRight, Search, ShieldAlert } from "lucide-react";

interface DecisionIntelligenceSignalProps {
  signal: IntelligenceSignal;
}

export function DecisionIntelligenceSignal({ signal }: DecisionIntelligenceSignalProps) {
  return (
    <Card className="border-primary/40 bg-gradient-to-r from-primary/[0.04] via-card to-card shadow-md relative overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
              Active Decision Intelligence Signal
            </span>
          </div>
          <Badge variant="warning" className="text-[10px] font-mono font-semibold">
            {signal.confidenceScore}% CAUSAL CONFIDENCE
          </Badge>
        </div>

        {/* Core Synthesized Signal Quote */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug">
            {signal.headline}
          </h3>
          <blockquote className="rounded-lg border-l-2 border-primary bg-muted/20 p-3 text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium italic">
            &ldquo;{signal.summary}&rdquo;
          </blockquote>
        </div>

        {/* Supporting Metric Divergences & Action CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Supporting Metrics Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-muted-foreground mr-1">Decomposed Telemetry:</span>
            {signal.supportingMetrics.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs shadow-sm"
              >
                <span className="text-muted-foreground">{m.label}</span>
                <span
                  className={`font-mono font-bold ${
                    m.status === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : m.status === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {m.delta}
                </span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Button size="sm" className="gap-2 text-xs font-semibold shrink-0 shadow-sm" asChild>
            <Link href={signal.recommendedRoute}>
              <Search className="h-3.5 w-3.5" />
              <span>{signal.recommendedActionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
