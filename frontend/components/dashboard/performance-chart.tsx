import * as React from "react";
import { PerformanceDataPoint } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";

interface PerformanceChartProps {
  series: {
    "7D": PerformanceDataPoint[];
    "30D": PerformanceDataPoint[];
    "90D": PerformanceDataPoint[];
  };
  currentTimeframe: "7D" | "30D" | "90D";
  onTimeframeChange: (tf: "7D" | "30D" | "90D") => void;
}

export function PerformanceChart({
  series,
  currentTimeframe,
  onTimeframeChange,
}: PerformanceChartProps) {
  const data = series[currentTimeframe] || series["30D"];
  const [hoveredPoint, setHoveredPoint] = React.useState<PerformanceDataPoint | null>(null);

  // Calculate max for proportional height
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);

  const totalRev = data.reduce((acc, d) => acc + d.revenue, 0);
  const totalProf = data.reduce((acc, d) => acc + d.grossProfit, 0);
  const avgMargin = ((totalProf / (totalRev || 1)) * 100).toFixed(1);

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold">
              Revenue & Gross Profit Performance
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {currentTimeframe} WINDOW
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Synchronized financial trajectories across operating units.
          </CardDescription>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Gross Profit</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Dynamic Tooltip / Active Point Summary Bar */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-foreground">
              {hoveredPoint ? `Selected: ${hoveredPoint.date}` : `Summary across ${data.length} periods`}
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground mr-1">Revenue:</span>
              <span className="font-bold text-foreground">
                {hoveredPoint ? formatIndianCurrency(hoveredPoint.revenue) : formatIndianCurrency(totalRev)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground mr-1">Profit:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {hoveredPoint ? formatIndianCurrency(hoveredPoint.grossProfit) : formatIndianCurrency(totalProf)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground mr-1">Margin:</span>
              <span className="font-bold text-primary">
                {hoveredPoint
                  ? ((hoveredPoint.grossProfit / (hoveredPoint.revenue || 1)) * 100).toFixed(1)
                  : avgMargin}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Visual Chart Bars Container */}
        <div className="h-52 w-full pt-4 flex items-end justify-between gap-2 sm:gap-4 border-b border-border/80 relative overflow-hidden">
          {/* Subtle Grid Guidelines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-border w-full" />
            <div className="border-b border-border w-full" />
            <div className="border-b border-border w-full" />
          </div>

          {data.map((point, idx) => {
            const revHeight = (point.revenue / maxRevenue) * 100;
            const profHeight = (point.grossProfit / maxRevenue) * 100;
            const isHovered = hoveredPoint?.date === point.date;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
              >
                {/* Dual Column Bars */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full z-10">
                  {/* Revenue Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t transition-all ${
                      isHovered ? "bg-primary brightness-110 shadow-md" : "bg-primary/80 group-hover:bg-primary"
                    }`}
                    style={{ height: `${revHeight}%` }}
                  />
                  {/* Profit Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t transition-all ${
                      isHovered ? "bg-emerald-500 brightness-110 shadow-md" : "bg-emerald-500/80 group-hover:bg-emerald-500"
                    }`}
                    style={{ height: `${profHeight}%` }}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="text-[10px] font-mono text-muted-foreground mt-2 truncate max-w-full group-hover:text-foreground font-medium">
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
