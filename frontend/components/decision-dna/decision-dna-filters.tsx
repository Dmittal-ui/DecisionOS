"use client";

import * as React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DecisionDNAFilterState, DecisionDNARecord } from "@/types/decision-dna";

interface DecisionDNAFiltersProps {
  filters: DecisionDNAFilterState;
  onFilterChange: (filters: Partial<DecisionDNAFilterState>) => void;
  onReset: () => void;
  totalFiltered: number;
  /** Live loaded records — used to derive dynamic filter options */
  records?: DecisionDNARecord[];
}

export function DecisionDNAFilters({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
  records = [],
}: DecisionDNAFiltersProps) {
  // Derive unique owners from loaded records (Fix 1)
  const ownerOptions = React.useMemo(() => {
    const unique = Array.from(new Set(records.map((r) => r.owner).filter(Boolean))).sort();
    return unique;
  }, [records]);

  // Derive unique opportunity IDs from loaded records (Fix 2)
  const opportunityOptions = React.useMemo(() => {
    const unique = Array.from(new Set(records.map((r) => r.opportunityId).filter(Boolean))).sort();
    return unique;
  }, [records]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      {/* Top Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Decision DNA by ID, title, trigger, owner, or opportunity..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-muted-foreground shrink-0">
          <span>
            Showing <strong>{totalFiltered}</strong> DNA records
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1 border-t border-border/40">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Governance Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="modified">Modified</option>
            <option value="rejected">Rejected</option>
            <option value="outcome_pending">Outcome Pending</option>
          </select>
        </div>

        {/* Decision Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Source Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Sources</option>
            <option value="optimization">Optimizer</option>
            <option value="scenario">Scenario</option>
            <option value="replay">Replay</option>
            <option value="investigation">Investigation</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Outcome Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Outcome Status</label>
          <select
            value={filters.outcomeStatus}
            onChange={(e) => onFilterChange({ outcomeStatus: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Outcomes</option>
            <option value="achieved">Achieved</option>
            <option value="partially_achieved">Partially Achieved</option>
            <option value="missed">Missed</option>
            <option value="pending">Outcome Pending</option>
          </select>
        </div>

        {/* Owner — dynamic from loaded records (Fix 1) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Decision Owner</label>
          <select
            value={filters.owner}
            onChange={(e) => onFilterChange({ owner: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>

        {/* Opportunity — dynamic from loaded records (Fix 2) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Opportunity</label>
          <select
            value={filters.opportunity}
            onChange={(e) => onFilterChange({ opportunity: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Opportunities</option>
            {opportunityOptions.map((oppId) => (
              <option key={oppId} value={oppId}>
                {oppId}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Time Horizon</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All History</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
