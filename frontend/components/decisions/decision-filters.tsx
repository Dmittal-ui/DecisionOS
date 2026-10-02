"use client";

import * as React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DecisionFilterState } from "@/types/decision-registry";

interface DecisionFiltersProps {
  filters: DecisionFilterState;
  onFilterChange: (filters: Partial<DecisionFilterState>) => void;
  onReset: () => void;
  totalFiltered: number;
}

export function DecisionFilters({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
}: DecisionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      {/* Search Input & Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, title, opportunity, or owner..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9 text-sm"
          />
        </div>

        {/* Reset & Count */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-muted-foreground shrink-0">
          <span>
            Showing <strong>{totalFiltered}</strong> decisions
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

      {/* Dropdown Select Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-border/40">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review / Pending</option>
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="modified">Modified</option>
            <option value="rejected">Rejected</option>
            <option value="recorded">Recorded</option>
          </select>
        </div>

        {/* Decision Type Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Source</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Sources</option>
            <option value="optimization">Optimizer</option>
            <option value="scenario">Scenario Lab</option>
            <option value="replay">Decision Replay</option>
            <option value="investigation">Investigation</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Time Horizon</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
