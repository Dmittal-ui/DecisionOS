import * as React from "react";
import { Clock, Radar, GitBranch, BarChart3, CheckCircle2, Zap } from "lucide-react";
import {
  InvestigationTimelineEvent,
  InvestigationTimelineEventType,
} from "@/types/investigation-workspace";
import { cn } from "@/lib/utils";

// ─── Icon per event type ──────────────────────────────────────────────────────

function EventIcon({ type }: { type: InvestigationTimelineEventType }) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "detection":
      return <Radar className={cls} />;
    case "signal":
      return <Zap className={cls} />;
    case "hypothesis":
      return <GitBranch className={cls} />;
    case "comparison":
      return <BarChart3 className={cls} />;
    case "ready":
      return <CheckCircle2 className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

const EVENT_COLORS: Record<InvestigationTimelineEventType, string> = {
  detection: "border-blue-400 bg-blue-500/10 text-blue-400",
  signal: "border-amber-400 bg-amber-500/10 text-amber-400",
  hypothesis: "border-violet-400 bg-violet-500/10 text-violet-400",
  comparison: "border-slate-400 bg-slate-500/10 text-slate-400",
  ready: "border-emerald-400 bg-emerald-500/10 text-emerald-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface InvestigationTimelineProps {
  events: InvestigationTimelineEvent[];
  className?: string;
}

export function InvestigationTimeline({
  events,
  className,
}: InvestigationTimelineProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Investigation Timeline
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {events.length} events
        </span>
      </div>

      <div className="relative">
        {/* Vertical connector line */}
        <div
          className="absolute left-[17px] top-2 bottom-2 w-px bg-border/40"
          aria-hidden
        />

        <ol className="space-y-0" aria-label="Investigation timeline">
          {events.map((event, idx) => {
            const colorCls = EVENT_COLORS[event.type];
            const isLast = idx === events.length - 1;

            return (
              <li
                key={event.id}
                className="relative flex items-start gap-3 pb-5 last:pb-0"
              >
                {/* Icon dot */}
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    colorCls
                  )}
                  aria-hidden
                >
                  <EventIcon type={event.type} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {event.time}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {event.label}
                    </span>
                    {isLast && (
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        ✓ Current
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
