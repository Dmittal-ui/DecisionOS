import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  FlaskConical,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Opportunity } from "@/types/opportunity";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface InvestigationHeaderProps {
  opportunity: Opportunity;
  overallConfidence: number;
  className?: string;
}

export function InvestigationHeader({
  opportunity,
  overallConfidence,
  className,
}: InvestigationHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2 text-muted-foreground"
        asChild
      >
        <Link href="/opportunities">
          <ArrowLeft className="h-3.5 w-3.5" />
          Opportunity Center
        </Link>
      </Button>

      {/* Header content */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {/* Title */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Deep Anomaly Investigation
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {opportunity.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trace business signals to competing root-cause hypotheses before making a decision.
            </p>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-primary">
              {opportunity.code}
            </span>
            <StatusBadge status={opportunity.urgency} />
            <StatusBadge status={opportunity.status} />
            <Badge variant="outline" className="text-[10px] capitalize">
              {opportunity.category.replace(/_/g, " ")}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Detected {formatRelativeTime(opportunity.detectedAt)}</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Investigation Confidence</span>
            <ConfidenceIndicator score={overallConfidence} size="md" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/replay">
              <RotateCcw className="h-3.5 w-3.5" />
              Replay Decision
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/scenario">
              <FlaskConical className="h-3.5 w-3.5" />
              Open Scenario Lab
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
