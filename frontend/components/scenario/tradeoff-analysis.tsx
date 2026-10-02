import * as React from "react";
import { ArrowLeftRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { TradeoffCategory } from "@/types/scenario-workspace";
import { cn } from "@/lib/utils";

interface TradeoffAnalysisProps {
  categories: TradeoffCategory[];
  summary: string;
  className?: string;
}

export function TradeoffAnalysis({
  categories,
  summary,
  className,
}: TradeoffAnalysisProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-primary/20 pb-3">
        <ArrowLeftRight className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Scenario Trade-off Analysis
        </h3>
        <span className="ml-auto text-[10px] font-mono text-primary">
          Strategic Balance Matrix
        </span>
      </div>

      {/* 3 Strategic Pillars */}
      <div className="grid gap-3 sm:grid-cols-3">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="rounded-md border border-border/70 bg-card p-3.5 space-y-2.5 shadow-xs"
          >
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {cat.title}
            </h4>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{cat.metric1.label}:</span>
                <span className={cn("font-bold", cat.metric1.positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                  {cat.metric1.value}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{cat.metric2.label}:</span>
                <span className={cn("font-bold", cat.metric2.positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                  {cat.metric2.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Trade-off Synthesis */}
      <blockquote className="border-l-4 border-primary pl-4 py-1 text-xs font-medium text-foreground leading-relaxed italic bg-background/60 rounded-r p-2">
        &ldquo;{summary}&rdquo;
      </blockquote>
    </div>
  );
}
