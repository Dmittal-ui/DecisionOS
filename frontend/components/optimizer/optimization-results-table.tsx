"use client";

import { ListOrdered } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OptimizerResultRow } from "@/types/optimizer-workspace";

interface OptimizationResultsTableProps {
  results: OptimizerResultRow[];
  className?: string;
}

export function OptimizationResultsTable({ results, className }: OptimizationResultsTableProps) {
  const getBadgeVariant = (status: OptimizerResultRow["status"]) => {
    switch (status) {
      case "recommended": return "positive";
      case "feasible": return "secondary";
      case "suboptimal": return "warning";
      default: return "default";
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Optimization Results</CardTitle>
        </div>
        <CardDescription>Ranked feasible configurations by selected objective</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-tl-md font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Config</th>
                <th className="px-4 py-3 font-medium text-right">Gross Profit</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-right">Margin</th>
                <th className="px-4 py-3 font-medium text-right">Budget</th>
                <th className="px-4 py-3 rounded-tr-md font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r, i) => {
                const isRecommended = r.status === "recommended";
                return (
                  <tr key={r.id} className={cn("hover:bg-muted/50", isRecommended && "bg-emerald-50/50 dark:bg-emerald-950/20")}>
                    <td className="px-4 py-3 font-mono font-medium">{r.rank}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{r.label}</td>
                    <td className="px-4 py-3 font-mono text-right">{r.grossProfit}</td>
                    <td className="px-4 py-3 font-mono text-right">{r.revenue}</td>
                    <td className="px-4 py-3 font-mono text-right">{r.margin}</td>
                    <td className="px-4 py-3 font-mono text-right">{r.budget}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getBadgeVariant(r.status)} className="capitalize">
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {results.map((r) => {
            const isRecommended = r.status === "recommended";
            return (
              <div 
                key={r.id} 
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  isRecommended && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground">#{r.rank}</span>
                    <span className="font-mono text-sm">{r.label}</span>
                  </div>
                  <Badge variant={getBadgeVariant(r.status)} className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Gross Profit</span>
                    <span className="font-mono">{r.grossProfit}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="font-mono">{r.revenue}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Margin</span>
                    <span className="font-mono">{r.margin}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Budget</span>
                    <span className="font-mono">{r.budget}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
