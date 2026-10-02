"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Edit3, XCircle, Files } from "lucide-react";
import type { DecisionSummaryStats } from "@/types/decision-registry";

interface DecisionSummaryCardsProps {
  stats: DecisionSummaryStats;
  selectedFilterStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export function DecisionSummaryCards({
  stats,
  selectedFilterStatus,
  onSelectStatus,
}: DecisionSummaryCardsProps) {
  const cards = [
    {
      label: "Pending Approval",
      count: stats.pending,
      statusKey: "under_review",
      description: "Awaiting human review",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      label: "Approved",
      count: stats.approved,
      statusKey: "approved",
      description: "Approved without changes",
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      label: "Modified",
      count: stats.modified,
      statusKey: "modified",
      description: "Human-adjusted parameters",
      icon: Edit3,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      label: "Rejected",
      count: stats.rejected,
      statusKey: "rejected",
      description: "Declined with rationale",
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedFilterStatus === card.statusKey;

        return (
          <Card
            key={card.label}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              isSelected ? "ring-2 ring-primary border-transparent" : "border-border/70"
            }`}
            onClick={() => onSelectStatus && onSelectStatus(isSelected ? "all" : card.statusKey)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-md ${card.bgColor} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-foreground sm:text-3xl">
                  {card.count}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {card.description}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
