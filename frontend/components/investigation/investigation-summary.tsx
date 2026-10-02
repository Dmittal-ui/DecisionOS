import * as React from "react";
import { FileText, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { InvestigationWorkspace } from "@/types/investigation-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { cn } from "@/lib/utils";

interface InvestigationSummaryProps {
  workspace: InvestigationWorkspace;
  className?: string;
}

export function InvestigationSummary({
  workspace,
  className,
}: InvestigationSummaryProps) {
  const leading = workspace.hypotheses.find(
    (h) => h.id === workspace.leadingHypothesisId
  );
  const supporting = leading?.evidenceItems.filter(
    (e) => e.direction === "supporting" && e.strength === "high"
  ) ?? [];
  const contradicting = leading?.evidenceItems.filter(
    (e) => e.direction === "contradicting"
  ) ?? [];

  return (
    <div className={cn("rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm", className)}>
      {/* Header band */}
      <div className="border-b border-border/60 bg-muted/30 px-5 py-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          Investigation Summary
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground italic">
          Current investigation findings
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Summary text */}
        <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Current Investigation Finding
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {workspace.summary}
          </p>
        </div>

        {/* Stats grid */}
        {leading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Leading Hypothesis
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5 leading-snug">
                {leading.title}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Confidence
              </p>
              <div className="mt-1">
                <ConfidenceIndicator score={leading.confidenceScore} size="md" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Strong Evidence
              </p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-bold text-foreground">
                  {supporting.length}
                </span>
                <span className="text-xs text-muted-foreground">signals</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contradictions
              </p>
              <div className="flex items-center gap-1 mt-1">
                <XCircle className="h-4 w-4 text-rose-500" />
                <span className="text-lg font-bold text-foreground">
                  {contradicting.length}
                </span>
                <span className="text-xs text-muted-foreground">signal</span>
              </div>
            </div>
          </div>
        )}

        {/* Overall confidence */}
        <div className="flex items-center gap-3 border-t border-border/40 pt-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Overall investigation confidence:</span>
          <ConfidenceIndicator score={workspace.overallConfidence} size="md" />
        </div>
      </div>
    </div>
  );
}
