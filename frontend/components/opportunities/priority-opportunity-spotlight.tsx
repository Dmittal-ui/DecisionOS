import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  TrendingUp,
  Zap,
  RotateCcw,
  AlertCircle,
  Users,
} from "lucide-react";
import { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriorityOpportunitySpotlightProps {
  opportunity: Opportunity;
  className?: string;
}

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

// Severity colour mapping for evidence signal chips
const SEVERITY_COLORS = {
  critical: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  high: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  medium: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
};

// Map an API signal direction to a display severity bucket
function signalSeverity(direction: string): keyof typeof SEVERITY_COLORS {
  if (direction === "negative") return "critical";
  if (direction === "positive") return "high";
  return "medium";
}

export function PriorityOpportunitySpotlight({
  opportunity,
  className,
}: PriorityOpportunitySpotlightProps) {
  const netValue = formatImpactValue(opportunity.impact.netValue);
  const costReduction =
    opportunity.impact.costReduction > 0
      ? formatImpactValue(opportunity.impact.costReduction)
      : null;

  // Build evidence signal chips from real API data — no hardcoded demo values.
  // The Opportunity type does not directly expose signals on the list endpoint,
  // so we synthesise chips from what IS available: summary + affectedSegments.
  // When signals are present (opportunity detail page), use them directly.
  const evidenceSignals: Array<{ label: string; detail: string; severity: keyof typeof SEVERITY_COLORS }> =
    (() => {
      // If the opportunity object carries signals (populated from detail API), use them.
      const rawSignals = (opportunity as any).signals as
        | Array<{ label: string; value: string; direction: string }>
        | undefined;
      if (rawSignals && rawSignals.length > 0) {
        return rawSignals.slice(0, 3).map((s) => ({
          label: s.label,
          detail: s.value,
          severity: signalSeverity(s.direction),
        }));
      }
      // Otherwise synthesise from what is available on the list shape.
      const chips: Array<{ label: string; detail: string; severity: keyof typeof SEVERITY_COLORS }> = [];
      // Line 1: opportunity summary (truncated)
      if (opportunity.summary) {
        chips.push({
          label: opportunity.title,
          detail: opportunity.summary.length > 80
            ? opportunity.summary.slice(0, 77) + "…"
            : opportunity.summary,
          severity: opportunity.urgency === "critical" ? "critical" : "high",
        });
      }
      // Line 2: affected segments (if present)
      if (opportunity.affectedSegments.length > 0) {
        chips.push({
          label: "Affected Segments",
          detail: opportunity.affectedSegments.slice(0, 3).join(", "),
          severity: "medium",
        });
      }
      return chips;
    })();

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header band */}
      <div className="border-b border-border/60 bg-muted/30 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Priority Opportunity
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={opportunity.urgency} />
          <StatusBadge status={opportunity.status} />
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left: Identity + description */}
          <div className="lg:col-span-2 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  {opportunity.code}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {opportunity.category.replace(/_/g, " ")}
                </Badge>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {opportunity.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {opportunity.summary}
              </p>
            </div>

            {/* Evidence signals — derived from real opportunity data */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Signals
              </p>
              <div className="space-y-1.5">
                {evidenceSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                      SEVERITY_COLORS[signal.severity]
                    )}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                    <div>
                      <span className="font-semibold">{signal.label}</span>
                      <span className="opacity-75"> — {signal.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected segments */}
            {opportunity.affectedSegments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                {opportunity.affectedSegments.map((seg) => (
                  <Badge
                    key={seg}
                    variant="secondary"
                    className="text-[10px] font-normal"
                  >
                    {seg}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Right: Impact metrics + CTAs */}
          <div className="space-y-4">
            {/* Impact panel */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Business Impact
              </p>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Projected Net Value</p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {netValue}
                  </p>
                </div>

                {costReduction && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Cost Reduction</p>
                    <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                      {costReduction}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
                  <ConfidenceIndicator
                    score={opportunity.impact.confidenceScore}
                    size="md"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {opportunity.impact.timeToRealizationDays}d realization window
                  </span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 shrink-0" />
                <span>Detected {formatRelativeTime(opportunity.detectedAt)}</span>
              </div>
              {opportunity.ownerName && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>Owned by {opportunity.ownerName}</span>
                </div>
              )}
              {opportunity.expiresAt && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Expires {formatRelativeTime(opportunity.expiresAt)}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <Button size="sm" className="gap-1.5 w-full" asChild>
                <Link href={`/investigation?opportunity=${opportunity.code}`}>
                  <Zap className="h-3.5 w-3.5" />
                  Investigate
                  <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 w-full" asChild>
                <Link href="/replay">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Replay Decision
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 w-full text-xs text-muted-foreground" asChild>
                <Link href={`/opportunities/${opportunity.id}`}>
                  View Full Detail
                  <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
                </Link>
              </Button>
            </div>

            {/* Tags */}
            {opportunity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {opportunity.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
