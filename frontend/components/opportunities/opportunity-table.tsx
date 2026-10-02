import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SortField, SortDir } from "./opportunity-filters";

interface OpportunityTableProps {
  opportunities: Opportunity[];
  sortBy: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

function SortIcon({
  field,
  active,
  dir,
}: {
  field: SortField;
  active: boolean;
  dir: SortDir;
}) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
  if (dir === "desc") return <ChevronDown className="h-3 w-3 text-primary" />;
  return <ChevronUp className="h-3 w-3 text-primary" />;
}

export function OpportunityTable({
  opportunities,
  sortBy,
  sortDir,
  onSort,
  className,
}: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No opportunities match the current filters
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Adjust filters to see more results
        </p>
      </div>
    );
  }

  const cols: Array<{
    label: string;
    field?: SortField;
    align?: "right";
  }> = [
    { label: "Opportunity" },
    { label: "Category" },
    { label: "Net Value", field: "impact", align: "right" },
    { label: "Confidence", field: "confidence", align: "right" },
    { label: "Status" },
    { label: "Detected", field: "detectedAt" },
    { label: "" },
  ];

  return (
    <div
      className={cn(
        "hidden sm:block rounded-lg border border-border/60 overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              {cols.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-3 py-2.5 font-semibold text-muted-foreground text-left whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.field &&
                      "cursor-pointer select-none hover:text-foreground transition-colors"
                  )}
                  onClick={col.field ? () => onSort(col.field!) : undefined}
                >
                  <div
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "flex-row-reverse"
                    )}
                  >
                    {col.label}
                    {col.field && (
                      <SortIcon
                        field={col.field}
                        active={sortBy === col.field}
                        dir={sortDir}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {opportunities.map((opp, idx) => (
              <tr
                key={opp.id}
                className={cn(
                  "bg-card hover:bg-muted/30 transition-colors",
                  idx === 0 && "bg-muted/10"
                )}
              >
                {/* Opportunity identity */}
                <td className="px-3 py-3 max-w-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-[11px]">
                        {opp.code}
                      </span>
                      <StatusBadge status={opp.urgency} />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate max-w-[240px]">
                      {opp.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[240px]">
                      {opp.summary}
                    </p>
                  </div>
                </td>

                {/* Category */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {opp.category.replace(/_/g, " ")}
                  </Badge>
                </td>

                {/* Net Value */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatImpactValue(opp.impact.netValue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {opp.impact.timeToRealizationDays}d window
                  </p>
                </td>

                {/* Confidence */}
                <td className="px-3 py-3">
                  <div className="flex justify-end">
                    <ConfidenceIndicator
                      score={opp.impact.confidenceScore}
                      size="sm"
                    />
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <StatusBadge status={opp.status} />
                </td>

                {/* Detected */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="text-[11px]">{formatRelativeTime(opp.detectedAt)}</span>
                  </div>
                  {opp.ownerName && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3 shrink-0" />
                      <span className="text-[10px]">{opp.ownerName}</span>
                    </div>
                  )}
                </td>

                {/* Action */}
                <td className="px-3 py-3">
                  <Button
                    variant="subtle"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    asChild
                  >
                    <Link href={`/opportunities/${opp.id}`}>
                      View
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
