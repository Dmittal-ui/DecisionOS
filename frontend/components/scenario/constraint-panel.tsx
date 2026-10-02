import * as React from "react";
import { ShieldCheck, AlertTriangle, XCircle, Sliders } from "lucide-react";
import { ScenarioConstraint } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConstraintPanelProps {
  constraints: ScenarioConstraint[];
  className?: string;
}

export function ConstraintPanel({ constraints, className }: ConstraintPanelProps) {
  const getStatusBadge = (status: ScenarioConstraint["status"], label: string) => {
    switch (status) {
      case "breached":
        return (
          <Badge variant="critical" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" />
            {label}
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning" className="gap-1 text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            {label}
          </Badge>
        );
      case "within_constraint":
      default:
        return (
          <Badge variant="positive" className="gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3" />
            {label}
          </Badge>
        );
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Operational & Financial Constraints
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Policy compliance verification
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {constraints.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground">
                  {c.name}
                </span>
                {getStatusBadge(c.status, c.statusLabel)}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                Rule: {c.rule}
              </p>
            </div>

            <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[10px] uppercase">
                Simulated Value
              </span>
              <span className="font-mono font-bold text-foreground">
                {c.projectedValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
