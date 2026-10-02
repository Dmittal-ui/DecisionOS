import * as React from "react";
import { Sparkles, TrendingUp, DollarSign, Percent, HelpCircle } from "lucide-react";
import { CounterfactualInsight as CounterfactualInsightType } from "@/types/replay-workspace";
import { cn } from "@/lib/utils";

interface CounterfactualInsightProps {
  insight: CounterfactualInsightType;
  className?: string;
}

export function CounterfactualInsight({
  insight,
  className,
}: CounterfactualInsightProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 p-5 space-y-4 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
          {insight.headline}
        </h3>
        <span className="ml-auto text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
          Synthesized Recommendation
        </span>
      </div>

      {/* Main Quote / Core Finding */}
      <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 text-sm font-medium text-foreground leading-relaxed italic">
        &ldquo;{insight.summary}&rdquo;
      </blockquote>

      {/* 3 Metric Difference Callouts */}
      <div className="grid gap-3 sm:grid-cols-3 pt-2">
        <div className="rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-background/80 p-3 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            Revenue Difference
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {insight.revenueDiff}
          </p>
        </div>

        <div className="rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-background/80 p-3 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            Profit Difference
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {insight.profitDiff}
          </p>
        </div>

        <div className="rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-background/80 p-3 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Percent className="h-3 w-3 text-emerald-600" />
            Margin Difference
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {insight.marginDiff}
          </p>
        </div>
      </div>

      {/* What Changed Section */}
      <div className="rounded-md bg-muted/40 p-3 border border-border/50 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          <span>What changed in this counterfactual path?</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {insight.whatChangedExplanation}
        </p>
      </div>
    </div>
  );
}
