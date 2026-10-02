import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, Users } from "lucide-react";
import { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: Opportunity;
  className?: string;
}

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

export function OpportunityCard({ opportunity, className }: OpportunityCardProps) {
  return (
    <div
      className={cn(
        "sm:hidden rounded-lg border border-border/60 bg-card p-4 shadow-sm space-y-3",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-primary">
              {opportunity.code}
            </span>
            <StatusBadge status={opportunity.urgency} />
            <StatusBadge status={opportunity.status} />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {opportunity.title}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {opportunity.summary}
      </p>

      {/* Category + Impact row */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] capitalize">
          {opportunity.category.replace(/_/g, " ")}
        </Badge>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatImpactValue(opportunity.impact.netValue)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {opportunity.impact.timeToRealizationDays}d window
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Confidence
        </span>
        <ConfidenceIndicator score={opportunity.impact.confidenceScore} size="sm" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(opportunity.detectedAt)}
        </div>
        {opportunity.ownerName && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {opportunity.ownerName}
          </div>
        )}
      </div>

      {/* Tags */}
      {opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {opportunity.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* CTA */}
      <Button size="sm" className="w-full gap-1.5" asChild>
        <Link href={`/opportunities/${opportunity.id}`}>
          View Opportunity
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
