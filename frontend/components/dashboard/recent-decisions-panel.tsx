"use client";

import * as React from "react";
import Link from "next/link";
import { Decision } from "@/types/decision";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GitPullRequest, ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react";

interface RecentDecisionsPanelProps {
  decisions: Decision[];
}

export function RecentDecisionsPanel({ decisions }: RecentDecisionsPanelProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base font-bold">
              Recent Governed Decisions
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Executed actions, quorum sign-offs, and verified audit trails.
          </CardDescription>
        </div>

        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:underline" asChild>
          <Link href="/decisions">
            <span>View Registry</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {decisions.map((dec) => {
          const approvedCount = dec.approvals.filter((a) => a.status === "approved").length;

          return (
            <div
              key={dec.id}
              className="rounded-xl border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{dec.code}</span>
                  <StatusBadge status={dec.status} />
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {dec.impactLevel}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDate(dec.createdAt)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground truncate">
                  {dec.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {dec.executiveSummary}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    Financial Impact
                  </span>
                  <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(dec.estimatedValue)}
                  </span>
                  <div className="flex items-center sm:justify-end gap-1 text-[10px] text-muted-foreground pt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>{approvedCount}/{dec.approvals.length} Sign-offs (CFO + CSOO)</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                  <Link href="/decisions">
                    <span>Audit Trail</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
