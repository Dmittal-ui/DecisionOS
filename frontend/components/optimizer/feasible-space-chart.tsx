"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Scan } from "lucide-react";
import type { FeasibleSolution } from "@/types/optimizer-workspace";

interface FeasibleSpaceChartProps {
  solutions: FeasibleSolution[];
  className?: string;
}

export function FeasibleSpaceChart({ solutions, className }: FeasibleSpaceChartProps) {
  const padding = 50;
  const width = 800;
  const height = 400;

  const minX = 0;
  const maxX = 100;
  const minY = 0;
  const maxY = 100;

  const getX = (val: number) => padding + ((val - minX) / (maxX - minX)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Scan className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Feasible Solution Space</CardTitle>
        </div>
        <CardDescription>
          Evaluated configurations plotted by objective performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden bg-background border rounded-lg">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-sm">
            {/* Grid Lines */}
            <g className="text-muted/20 stroke-current" strokeWidth="1">
              {[0, 1, 2, 3, 4, 5].map((tick) => {
                const x = padding + (tick / 5) * (width - 2 * padding);
                const y = padding + (tick / 5) * (height - 2 * padding);
                return (
                  <React.Fragment key={`grid-${tick}`}>
                    <line x1={x} y1={padding} x2={x} y2={height - padding} />
                    <line x1={padding} y1={y} x2={width - padding} y2={y} />
                  </React.Fragment>
                );
              })}
            </g>

            {/* Axes */}
            <g className="text-muted-foreground stroke-current" strokeWidth="2">
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
              <line x1={padding} y1={height - padding} x2={padding} y2={padding} />
            </g>

            {/* Axis Labels */}
            <text x={width / 2} y={height - 10} fill="currentColor" className="text-muted-foreground text-xs" textAnchor="middle">
              Operating Margin
            </text>
            <text x={15} y={height / 2} fill="currentColor" className="text-muted-foreground text-xs" textAnchor="middle" transform={`rotate(-90 15 ${height / 2})`}>
              Gross Profit
            </text>

            {/* Data Points */}
            {solutions.map((sol) => {
              const cx = getX(sol.x);
              const cy = getY(sol.y);

              if (sol.isRecommended) {
                return (
                  <g key={sol.id}>
                    <circle cx={cx} cy={cy} r={10} className="fill-emerald-500/20 stroke-emerald-500" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r={5} className="fill-emerald-500" />
                    <text x={cx + 14} y={cy - 14} fill="currentColor" className="text-xs font-semibold fill-emerald-600 dark:fill-emerald-400">
                      {sol.label || "Recommended"}
                    </text>
                  </g>
                );
              }

              if (sol.isCurrent) {
                return (
                  <g key={sol.id}>
                    <circle cx={cx} cy={cy} r={6} className="fill-blue-500" />
                    <text x={cx + 10} y={cy - 10} fill="currentColor" className="text-xs font-semibold fill-blue-600 dark:fill-blue-400">
                      {sol.label || "Current"}
                    </text>
                  </g>
                );
              }

              if (!sol.feasible) {
                return (
                  <circle
                    key={sol.id}
                    cx={cx}
                    cy={cy}
                    r={4}
                    className="fill-transparent stroke-rose-500 opacity-60"
                    strokeWidth="1.5"
                  />
                );
              }

              // Default feasible
              return (
                <circle
                  key={sol.id}
                  cx={cx}
                  cy={cy}
                  r={4}
                  className="fill-emerald-500 opacity-80"
                />
              );
            })}

            {/* Legend */}
            <g transform={`translate(${width - 200}, ${padding})`} className="text-xs">
              <rect x="0" y="0" width="180" height="90" className="fill-card stroke-border" strokeWidth="1" rx="4" />

              <circle cx="15" cy="20" r="4" className="fill-emerald-500" />
              <text x="30" y="24" fill="currentColor" className="fill-muted-foreground">Feasible</text>

              <circle cx="15" cy="40" r="4" className="fill-transparent stroke-rose-500" strokeWidth="1.5" />
              <text x="30" y="44" fill="currentColor" className="fill-muted-foreground">Infeasible</text>

              <circle cx="15" cy="60" r="5" className="fill-emerald-500 stroke-emerald-500/30" strokeWidth="3" />
              <text x="30" y="64" fill="currentColor" className="fill-muted-foreground">Recommended</text>

              <circle cx="15" cy="80" r="5" className="fill-blue-500" />
              <text x="30" y="84" fill="currentColor" className="fill-muted-foreground">Current</text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
