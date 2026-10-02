import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParetoPoint } from '@/types/optimizer-workspace';

interface ParetoFrontierProps {
  points: ParetoPoint[];
  className?: string;
}

export function ParetoFrontier({ points, className }: ParetoFrontierProps) {
  // Map 0-100 values to SVG coordinates
  // ViewBox is 0 0 500 350
  // Chart area: x: 50 to 450, y: 50 to 300
  const getX = (val: number) => 50 + (val * 4);
  const getY = (val: number) => 300 - (val * 2.5);

  const frontierPoints = points
    .filter(p => p.type === 'pareto_efficient' || p.type === 'recommended')
    .sort((a, b) => a.x - b.x);

  const linePath = frontierPoints.length > 0
    ? `M ${getX(frontierPoints[0].x)} ${getY(frontierPoints[0].y)} ` +
      frontierPoints.slice(1).map(p => `L ${getX(p.x)} ${getY(p.y)}`).join(' ')
    : '';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Pareto Frontier
        </CardTitle>
        <CardDescription>Gross Profit vs Operating Margin — Pareto-efficient frontier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 500 350" className="w-full min-w-[400px] h-auto">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <line
                key={`grid-x-${val}`}
                x1={getX(val)} y1={50} x2={getX(val)} y2={300}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"
              />
            ))}
            {[0, 25, 50, 75, 100].map(val => (
              <line
                key={`grid-y-${val}`}
                x1={50} y1={getY(val)} x2={450} y2={getY(val)}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"
              />
            ))}

            {/* Axes */}
            <line x1={50} y1={300} x2={450} y2={300} stroke="#374151" strokeWidth="2" />
            <line x1={50} y1={300} x2={50} y2={50} stroke="#374151" strokeWidth="2" />

            {/* Labels */}
            <text x={250} y={335} textAnchor="middle" className="text-xs fill-slate-500 font-medium">Operating Margin (%)</text>
            <text x={20} y={175} textAnchor="middle" transform="rotate(-90 20 175)" className="text-xs fill-slate-500 font-medium">Gross Profit (₹ Cr)</text>

            {/* Frontier Line */}
            {linePath && (
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
            )}

            {/* Points */}
            {points.map((p, i) => {
              const cx = getX(p.x);
              const cy = getY(p.y);

              if (p.type === 'recommended') {
                return (
                  <g key={`point-${i}`}>
                    <circle cx={cx} cy={cy} r={8} fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={2} />
                    <circle cx={cx} cy={cy} r={4} fill="#10b981" />
                    <text x={cx} y={cy - 12} textAnchor="middle" className="text-xs fill-emerald-700 font-semibold">Recommended</text>
                  </g>
                );
              }
              if (p.type === 'pareto_efficient') {
                return <circle key={`point-${i}`} cx={cx} cy={cy} r={5} fill="#10b981" />;
              }
              if (p.type === 'feasible') {
                return <circle key={`point-${i}`} cx={cx} cy={cy} r={4} fill="#3b82f6" />;
              }
              return <circle key={`point-${i}`} cx={cx} cy={cy} r={3} fill="#94a3b8" fillOpacity={0.5} />;
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Pareto Efficient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="absolute w-4 h-4 rounded-full border-2 border-emerald-500 opacity-20"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span>Recommended</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Feasible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 opacity-50"></span>
            <span>Dominated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
