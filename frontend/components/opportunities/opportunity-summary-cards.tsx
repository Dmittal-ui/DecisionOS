import * as React from "react";
import { TrendingUp, AlertTriangle, Search, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Opportunity } from "@/types/opportunity";

interface SummaryCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

interface OpportunitySummaryCardsProps {
  opportunities: Opportunity[];
  className?: string;
}

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

export function OpportunitySummaryCards({
  opportunities,
  className,
}: OpportunitySummaryCardsProps) {
  const active = opportunities.filter(
    (o) => o.status !== "dismissed" && o.status !== "executed"
  );
  const highPriority = opportunities.filter(
    (o) => o.urgency === "critical" || o.urgency === "high"
  );
  const totalImpact = opportunities.reduce(
    (sum, o) => sum + o.impact.netValue,
    0
  );
  const investigationRequired = opportunities.filter(
    (o) => o.status === "detected" || o.status === "in_investigation"
  );

  const cards: SummaryCard[] = [
    {
      label: "Active Opportunities",
      value: active.length,
      sub: `${opportunities.length} total detected`,
      icon: TrendingUp,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "High Priority",
      value: highPriority.length,
      sub: "Critical or high urgency",
      icon: AlertTriangle,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Potential Net Value",
      value: formatImpactValue(totalImpact),
      sub: "Across all active opportunities",
      icon: DollarSign,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Investigation Required",
      value: investigationRequired.length,
      sub: "Detected or in investigation",
      icon: Search,
      colorClass: "text-violet-600 dark:text-violet-400",
      bgClass: "bg-violet-50 dark:bg-violet-950/40",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 lg:grid-cols-4",
        className
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground leading-none truncate">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold tracking-tight",
                    card.colorClass
                  )}
                >
                  {card.value}
                </p>
                {card.sub && (
                  <p className="text-[11px] text-muted-foreground">{card.sub}</p>
                )}
              </div>
              <div className={cn("rounded-lg p-2 shrink-0", card.bgClass)}>
                <Icon className={cn("h-4 w-4", card.colorClass)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
