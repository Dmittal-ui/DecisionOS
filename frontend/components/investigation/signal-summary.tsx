import * as React from "react";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import {
  InvestigationWorkspaceSignal,
  InvestigationSignalGroup,
} from "@/types/investigation-workspace";
import { cn } from "@/lib/utils";

interface SignalSummaryProps {
  signals: InvestigationWorkspaceSignal[];
  className?: string;
}

const GROUP_CONFIG: Record<
  InvestigationSignalGroup,
  { label: string; iconColor: string; bgColor: string; borderColor: string }
> = {
  positive: {
    label: "Positive Signals",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  negative: {
    label: "Negative Signals",
    iconColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  monitoring: {
    label: "Monitoring / Neutral",
    iconColor: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-700",
  },
};

function DirectionIcon({
  direction,
  className,
}: {
  direction: InvestigationWorkspaceSignal["direction"];
  className?: string;
}) {
  if (direction === "positive")
    return <TrendingUp className={cn("h-3.5 w-3.5 shrink-0", className)} />;
  if (direction === "negative")
    return <TrendingDown className={cn("h-3.5 w-3.5 shrink-0", className)} />;
  return <Minus className={cn("h-3.5 w-3.5 shrink-0", className)} />;
}

interface SignalRowProps {
  signal: InvestigationWorkspaceSignal;
  group: InvestigationSignalGroup;
}

function SignalRow({ signal, group }: SignalRowProps) {
  const cfg = GROUP_CONFIG[group];
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/30 last:border-0">
      <div className={cn("mt-0.5 rounded-md p-1", cfg.bgColor)}>
        <DirectionIcon direction={signal.direction} className={cfg.iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground truncate">
            {signal.label}
          </span>
          <span
            className={cn(
              "font-mono text-xs font-bold shrink-0",
              cfg.iconColor
            )}
          >
            {signal.value}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
          {signal.metric}
          {signal.description ? ` — ${signal.description}` : ""}
        </p>
      </div>
    </div>
  );
}

export function SignalSummary({ signals, className }: SignalSummaryProps) {
  const grouped = (["positive", "negative", "monitoring"] as const).map(
    (g) => ({
      group: g,
      items: signals.filter((s) => s.group === g),
    })
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Signal Summary</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {signals.length} signals detected
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {grouped.map(({ group, items }) => {
          const cfg = GROUP_CONFIG[group];
          if (items.length === 0) return null;
          return (
            <div
              key={group}
              className={cn(
                "rounded-lg border p-3",
                cfg.borderColor,
                cfg.bgColor
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <DirectionIcon direction={group === "monitoring" ? "neutral" : group} className={cfg.iconColor} />
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    cfg.iconColor
                  )}
                >
                  {cfg.label}
                </span>
                <span className={cn("ml-auto text-[10px] font-mono", cfg.iconColor)}>
                  {items.length}
                </span>
              </div>
              <div className="divide-y divide-border/20">
                {items.map((sig) => (
                  <SignalRow key={sig.id} signal={sig} group={group} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
