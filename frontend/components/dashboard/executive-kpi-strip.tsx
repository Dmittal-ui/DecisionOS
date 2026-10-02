"use client";

import * as React from "react";
import { KPIMetric } from "@/types/dashboard";
import { MetricCard } from "@/components/shared/metric-card";

interface ExecutiveKpiStripProps {
  kpis: {
    revenue: KPIMetric;
    grossProfit: KPIMetric;
    orders: KPIMetric;
    inventory: KPIMetric;
    operatingMargin: KPIMetric;
    businessHealth: KPIMetric;
  };
}

export function ExecutiveKpiStrip({ kpis }: ExecutiveKpiStripProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Executive KPI Strip
        </h2>
        <span className="text-[11px] font-mono text-muted-foreground">
          Continuous Real-Time Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard metric={kpis.revenue} />
        <MetricCard metric={kpis.grossProfit} />
        <MetricCard metric={kpis.orders} />
        <MetricCard metric={kpis.inventory} />
        <MetricCard metric={kpis.operatingMargin} />
        <MetricCard metric={kpis.businessHealth} />
      </div>
    </div>
  );
}
