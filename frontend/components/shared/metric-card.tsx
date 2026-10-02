import * as React from "react";
import { KPIMetric } from "@/types/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
} from "lucide-react";

interface MetricCardProps {
  metric: KPIMetric;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const isPositiveTrend =
    (metric.status === "positive" && metric.trend === "up") ||
    (metric.status === "positive" && metric.trend === "down"); // e.g. velocity reduced is good

  const getTrendIcon = () => {
    if (metric.trend === "up") return <TrendingUp className="h-3.5 w-3.5" />;
    if (metric.trend === "down") return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const getBadgeVariant = () => {
    switch (metric.status) {
      case "positive":
        return "positive";
      case "warning":
        return "warning";
      case "negative":
        return "critical";
      default:
        return "neutral";
    }
  };

  return (
    <Card className={cn("overflow-hidden border-border/70 hover:border-border transition-colors", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            {metric.label}
          </span>
          {metric.tooltip && (
            <span title={metric.tooltip} className="cursor-help text-muted-foreground/60 hover:text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {metric.value}
            {metric.unit && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {metric.unit}
              </span>
            )}
          </div>

          {metric.changePercentage !== undefined && (
            <Badge variant={getBadgeVariant()} className="gap-1 px-1.5 py-0.5 text-[11px] font-mono">
              {getTrendIcon()}
              <span>
                {metric.changePercentage > 0 ? "+" : ""}
                {metric.changePercentage}%
              </span>
            </Badge>
          )}
        </div>

        {metric.timeframe && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {metric.timeframe}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
