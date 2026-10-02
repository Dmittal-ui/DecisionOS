import * as React from "react";
import { History, Clock, ArrowRight } from "lucide-react";
import { SimulationHistoryEntry } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SimulationHistoryProps {
  history: SimulationHistoryEntry[];
  className?: string;
}

export function SimulationHistory({ history, className }: SimulationHistoryProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Simulation History & Run Audit
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Recent workspace sessions
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {entry.timeframe}
                </Badge>
                <span className="font-bold text-foreground">
                  {entry.scenarioName}
                </span>
                <span className="text-muted-foreground text-[10px] flex items-center gap-1 font-mono">
                  <Clock className="h-2.5 w-2.5" />
                  {entry.timestamp}
                </span>
              </div>

              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                <span>Mkt: {entry.levers.marketing}</span>
                <span>•</span>
                <span>Inv: {entry.levers.inventory}</span>
                <span>•</span>
                <span>Price: {entry.levers.price}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Outcome Impact
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {entry.highlightResult}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
