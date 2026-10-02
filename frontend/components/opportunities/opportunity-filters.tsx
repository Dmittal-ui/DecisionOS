"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  OpportunityStatus,
  OpportunityUrgency,
  OpportunityCategory,
} from "@/types/opportunity";

export type ConfidenceThreshold = "all" | "70" | "80" | "90";
export type SortField = "impact" | "confidence" | "urgency" | "detectedAt";
export type SortDir = "asc" | "desc";

export interface OpportunityFilters {
  search: string;
  status: OpportunityStatus | "all";
  urgency: OpportunityUrgency | "all";
  category: OpportunityCategory | "all";
  confidenceThreshold: ConfidenceThreshold;
  sortBy: SortField;
  sortDir: SortDir;
}

export const DEFAULT_FILTERS: OpportunityFilters = {
  search: "",
  status: "all",
  urgency: "all",
  category: "all",
  confidenceThreshold: "all",
  sortBy: "impact",
  sortDir: "desc",
};

interface FilterChipProps {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

interface OpportunityFiltersProps {
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS: Array<{ label: string; value: OpportunityStatus | "all" }> = [
  { label: "All Statuses", value: "all" },
  { label: "Detected", value: "detected" },
  { label: "Investigating", value: "in_investigation" },
  { label: "Decision Ready", value: "decision_ready" },
  { label: "Executed", value: "executed" },
  { label: "Dismissed", value: "dismissed" },
];

const URGENCY_OPTIONS: Array<{ label: string; value: OpportunityUrgency | "all" }> = [
  { label: "All Urgency", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const CATEGORY_OPTIONS: Array<{ label: string; value: OpportunityCategory | "all" }> = [
  { label: "All Categories", value: "all" },
  { label: "Revenue", value: "revenue" },
  { label: "Pricing", value: "pricing_optimization" },
  { label: "Churn Prevention", value: "churn_prevention" },
  { label: "Supply Chain", value: "supply_chain" },
  { label: "Inventory", value: "inventory_rebalance" },
  { label: "Cross-Sell", value: "cross_sell" },
  { label: "Operations", value: "operational_efficiency" },
  { label: "Growth", value: "growth" },
];

const CONFIDENCE_OPTIONS: Array<{ label: string; value: ConfidenceThreshold }> = [
  { label: "All", value: "all" },
  { label: "≥70%", value: "70" },
  { label: "≥80%", value: "80" },
  { label: "≥90%", value: "90" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortField }> = [
  { label: "Impact", value: "impact" },
  { label: "Confidence", value: "confidence" },
  { label: "Urgency", value: "urgency" },
  { label: "Detected", value: "detectedAt" },
];

function hasActiveFilters(filters: OpportunityFilters): boolean {
  return (
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.urgency !== "all" ||
    filters.category !== "all" ||
    filters.confidenceThreshold !== "all"
  );
}

export function OpportunityFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: OpportunityFiltersProps) {
  const set = <K extends keyof OpportunityFilters>(
    key: K,
    value: OpportunityFilters[K]
  ) => onChange({ ...filters, [key]: value });

  const reset = () => onChange(DEFAULT_FILTERS);

  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
      {/* Search + sort row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, or category..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-8 pl-8 text-xs"
          />
          {filters.search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => set("search", "")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Sort by:
          </span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                value={opt.value}
                active={filters.sortBy === opt.value}
                onClick={() => {
                  if (filters.sortBy === opt.value) {
                    set("sortDir", filters.sortDir === "desc" ? "asc" : "desc");
                  } else {
                    set("sortBy", opt.value);
                  }
                }}
              />
            ))}
          </div>
          <button
            className="rounded border border-border px-1.5 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
            onClick={() =>
              set("sortDir", filters.sortDir === "desc" ? "asc" : "desc")
            }
          >
            {filters.sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-y-2 gap-x-3">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-0.5">
            Status
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              value={opt.value}
              active={filters.status === opt.value}
              onClick={() => set("status", opt.value)}
            />
          ))}
        </div>

        {/* Urgency */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-0.5">
            Urgency
          </span>
          {URGENCY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              value={opt.value}
              active={filters.urgency === opt.value}
              onClick={() => set("urgency", opt.value)}
            />
          ))}
        </div>

        {/* Category */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-0.5">
            Category
          </span>
          {CATEGORY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              value={opt.value}
              active={filters.category === opt.value}
              onClick={() => set("category", opt.value)}
            />
          ))}
        </div>

        {/* Confidence */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-0.5">
            Confidence
          </span>
          {CONFIDENCE_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              value={opt.value}
              active={filters.confidenceThreshold === opt.value}
              onClick={() => set("confidenceThreshold", opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Result count + reset */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{filteredCount}</span>{" "}
            of {totalCount} opportunities
          </span>
          {active && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              Filtered
            </Badge>
          )}
        </div>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
