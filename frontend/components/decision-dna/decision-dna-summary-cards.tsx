"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dna,
  CheckCircle2,
  Edit3,
  XCircle,
  Gauge,
  FileCheck2,
} from "lucide-react";
import type { DecisionDNASummaryStats } from "@/types/decision-dna";

interface DecisionDNASummaryCardsProps {
  stats: DecisionDNASummaryStats;
  selectedStatusFilter?: string;
  onSelectStatusFilter?: (status: string) => void;
}

export function DecisionDNASummaryCards({
  stats,
  selectedStatusFilter,
  onSelectStatusFilter,
}: DecisionDNASummaryCardsProps) {
  const cards = [
    {
      label: "Total Decision DNA",
      count: stats.totalDecisions,
      statusKey: "all",
      subtext: "Archived audit records",
      icon: Dna,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Approved Decisions",
      count: stats.approved,
      statusKey: "approved",
      subtext: "Executed as proposed",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Modified Decisions",
      count: stats.modified,
      statusKey: "modified",
      subtext: "Human-adjusted levers",
      icon: Edit3,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Rejected Decisions",
      count: stats.rejected,
      statusKey: "rejected",
      subtext: "Declined with rationale",
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Average Confidence",
      count: `${stats.averageConfidence}%`,
      statusKey: "",
      subtext: "Statistical input quality",
      icon: Gauge,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Outcomes Tracked",
      count: stats.decisionsWithOutcomes,
      statusKey: "achieved",
      subtext: "Post-decision learning ready",
      icon: FileCheck2,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(card.statusKey && onSelectStatusFilter);
        const isSelected = selectedStatusFilter === card.statusKey;

        return (
          <Card
            key={card.label}
            className={`transition-all ${
              isClickable ? "cursor-pointer hover:border-primary/50" : ""
            } ${isSelected ? "ring-2 ring-primary border-transparent" : "border-border/70"}`}
            onClick={() => {
              if (isClickable && onSelectStatusFilter) {
                onSelectStatusFilter(isSelected ? "all" : card.statusKey);
              }
            }}
          >
            <CardContent className="p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color} shrink-0`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                  {card.count}
                </span>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {card.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
