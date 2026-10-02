import * as React from "react";
import { Gauge, Sparkles, HelpCircle } from "lucide-react";
import { SensitivityDriver } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SensitivityAnalysisProps {
  sensitivity: SensitivityDriver[];
  className?: string;
}

export function SensitivityAnalysis({
  sensitivity,
  className,
}: SensitivityAnalysisProps) {
  const getLevelBadge = (level: SensitivityDriver["sensitivityLevel"]) => {
    switch (level) {
      case "High":
        return <Badge variant="critical" className="text-[10px] font-bold">High</Badge>;
      case "Medium":
        return <Badge variant="warning" className="text-[10px] font-bold">Medium</Badge>;
      case "Low":
      default:
        return <Badge variant="neutral" className="text-[10px] font-bold">Low</Badge>;
    }
  };

  const getBarColor = (level: SensitivityDriver["sensitivityLevel"]) => {
    switch (level) {
      case "High":
        return "bg-rose-500";
      case "Medium":
        return "bg-amber-500";
      case "Low":
      default:
        return "bg-blue-500";
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
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Revenue Sensitivity Analysis (Elasticity Drivers)
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Relative driver impact ranking
        </span>
      </div>

      <div className="space-y-4">
        {sensitivity.map((driver) => (
          <div key={driver.leverKey} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {driver.leverLabel}
                </span>
                {getLevelBadge(driver.sensitivityLevel)}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                Impact Score: <strong>{driver.impactScore}/10</strong>
              </span>
            </div>

            {/* Visual Bar Indicator */}
            <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getBarColor(driver.sensitivityLevel)
                )}
                style={{ width: `${driver.barFillPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {driver.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
