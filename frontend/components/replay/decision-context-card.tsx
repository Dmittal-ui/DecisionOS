import * as React from "react";
import {
  FileText,
  Calendar,
  UserCheck,
  ShieldCheck,
  Sliders,
  HelpCircle,
  Clock,
} from "lucide-react";
import { HistoricalDecisionOption } from "@/types/replay-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DecisionContextCardProps {
  decision: HistoricalDecisionOption;
  className?: string;
}

export function DecisionContextCard({
  decision,
  className,
}: DecisionContextCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Top Banner */}
      <div className="border-b border-border/60 bg-muted/30 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Historical Decision Context
          </span>
          <span className="text-muted-foreground/30">•</span>
          <span className="font-mono text-xs font-semibold text-primary">
            {decision.code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="enterprise" className="text-[10px] uppercase font-semibold">
            {decision.status}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Decided on {decision.date}</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title and Original Action */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            {decision.title}
          </h2>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Original Action Enacted:
            </span>
            <span className="font-mono text-xs font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50">
              {decision.actionTaken}
            </span>
          </div>
        </div>

        {/* 4-Column Metadata Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/40 pt-4">
          {/* Decision Owner */}
          <div className="space-y-1 rounded-md bg-muted/20 p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Decision Owner
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {decision.owner}
            </p>
          </div>

          {/* Governance Approvals */}
          <div className="space-y-1 rounded-md bg-muted/20 p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Governance Approval
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">
              {decision.approvers.join(" + ")}
            </p>
          </div>

          {/* Operational Constraint */}
          <div className="space-y-1 rounded-md bg-muted/20 p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sliders className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Enforced Constraint
              </span>
            </div>
            <p className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
              {decision.constraint}
            </p>
          </div>

          {/* Business Rationale */}
          <div className="space-y-1 rounded-md bg-muted/20 p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Trigger Rationale
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {decision.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
