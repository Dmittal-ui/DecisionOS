import * as React from "react";
import { TrendingUp, TrendingDown, Minus, Clock, Users } from "lucide-react";
import { Opportunity } from "@/types/opportunity";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

interface KeySignal {
  label: string;
  value: string;
  direction: "positive" | "negative" | "neutral";
}

const KEY_SIGNALS_MAP: Record<string, KeySignal[]> = {
  OPP_9021: [
    { label: "Revenue", value: "+8.4%", direction: "positive" },
    { label: "Conversion", value: "−8.2%", direction: "negative" },
    { label: "CAC", value: "+14.1%", direction: "negative" },
    { label: "Margin", value: "+2.4 pp", direction: "positive" },
  ],
  OPP_9022: [
    { label: "API Calls", value: "−30%", direction: "negative" },
    { label: "Renewal Risk", value: "High", direction: "negative" },
  ],
  OPP_9023: [
    { label: "Safety Stock", value: "+31%", direction: "negative" },
    { label: "Working Capital", value: "₹84 L locked", direction: "negative" },
  ],
  OPP_9025: [
    { label: "API Usage", value: "+28%", direction: "positive" },
    { label: "Propensity Score", value: "82%", direction: "positive" },
  ],
};

interface OpportunityContextCardProps {
  opportunity: Opportunity;
  className?: string;
}

export function OpportunityContextCard({
  opportunity,
  className,
}: OpportunityContextCardProps) {
  const keySignals =
    KEY_SIGNALS_MAP[opportunity.code.replace("-", "_")] ?? [];

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header band */}
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Opportunity Context
        </span>
        <span className="ml-auto font-mono text-xs font-bold text-primary">
          {opportunity.code}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Title + summary */}
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug">
            {opportunity.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {opportunity.summary}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Potential Impact
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatImpactValue(opportunity.impact.netValue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confidence
            </p>
            <div className="mt-1">
              <ConfidenceIndicator
                score={opportunity.impact.confidenceScore}
                size="md"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="mt-1">
              <StatusBadge status={opportunity.status} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Detected
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {formatRelativeTime(opportunity.detectedAt)}
            </div>
          </div>
        </div>

        {/* Key signals */}
        {keySignals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Key Signals
            </p>
            <div className="flex flex-wrap gap-2">
              {keySignals.map((sig) => (
                <div
                  key={sig.label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
                    sig.direction === "positive" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                    sig.direction === "negative" &&
                      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400",
                    sig.direction === "neutral" &&
                      "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {sig.direction === "positive" && (
                    <TrendingUp className="h-3 w-3 shrink-0" />
                  )}
                  {sig.direction === "negative" && (
                    <TrendingDown className="h-3 w-3 shrink-0" />
                  )}
                  {sig.direction === "neutral" && (
                    <Minus className="h-3 w-3 shrink-0" />
                  )}
                  <span className="font-semibold">{sig.label}</span>
                  <span className="opacity-80">{sig.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segments + tags */}
        {opportunity.affectedSegments.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Users className="h-3 w-3 text-muted-foreground shrink-0" />
            {opportunity.affectedSegments.map((seg) => (
              <Badge key={seg} variant="secondary" className="text-[10px] font-normal">
                {seg}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
