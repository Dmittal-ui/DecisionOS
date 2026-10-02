"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Cpu,
  CheckCircle2,
  FileCheck2,
  ArrowDownRight,
} from "lucide-react";
import type { DecisionSummaryStats } from "@/types/decision-registry";

interface DecisionHeaderProps {
  stats: DecisionSummaryStats;
  onReviewPendingClick?: () => void;
}

export function DecisionHeader({
  stats,
  onReviewPendingClick,
}: DecisionHeaderProps) {
  return (
    <div className="space-y-4 border-b border-border/60 pb-6">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Decision Registry
            </h1>
            <Badge variant="enterprise">Human-in-the-Loop Governance</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Review, approve, modify, or reject recommendations before they become business decisions.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/optimizer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Open Optimizer</span>
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onReviewPendingClick}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Review Pending Decisions ({stats.pending})</span>
          </Button>
        </div>
      </div>

      {/* Mandatory Governance Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-300">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-950 dark:text-amber-200">
            Mandatory Governance Protocol: DecisionOS Recommends — A Human Decides.
          </p>
          <p className="text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
            Human approval is required before any high-impact decision is considered approved. DecisionOS does not execute business actions automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
