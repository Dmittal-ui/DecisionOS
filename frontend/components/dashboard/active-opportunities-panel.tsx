"use client";

import * as React from "react";
import Link from "next/link";
import { Opportunity } from "@/types/opportunity";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Sparkles, ArrowRight, ArrowUpRight, AlertTriangle, ShieldCheck, Flame } from "lucide-react";

interface ActiveOpportunitiesPanelProps {
  opportunities: Opportunity[];
}

export function ActiveOpportunitiesPanel({ opportunities }: ActiveOpportunitiesPanelProps) {
  // Format impact nicely in ₹ Cr or ₹ L
  const formatImpactValue = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(0)} L`;
    }
    return formatCurrency(val);
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Active Decision Opportunities
            </CardTitle>
            <Badge variant="enterprise" className="text-[10px]">
              {opportunities.length} HIGH PRIORITY
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Ranked by financial upside, urgency, and causal confidence.
          </CardDescription>
        </div>

        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:underline" asChild>
          <Link href="/opportunities">
            <span>View Radar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {opportunities.map((opp, idx) => {
          const isTopPriority = idx === 0;

          return (
            <div
              key={opp.id}
              className={`rounded-xl border p-4 transition-all hover:border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isTopPriority
                  ? "border-primary/40 bg-primary/[0.02] shadow-sm ring-1 ring-primary/20"
                  : "border-border/70 bg-card/60"
              }`}
            >
              {/* Left Info */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {opp.code}
                  </span>
                  <StatusBadge status={opp.urgency} />
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {opp.category.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto sm:ml-0 font-mono">
                    Detected {formatRelativeTime(opp.detectedAt)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground truncate">
                  {opp.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {opp.summary}
                </p>
              </div>

              {/* Right Financial Impact & CTA */}
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    Potential Net Lift
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{formatImpactValue(opp.impact.netValue)}
                  </span>
                  <div className="flex items-center sm:justify-end gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground">Confidence:</span>
                    <ConfidenceIndicator score={opp.impact.confidenceScore} size="sm" />
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isTopPriority ? "default" : "outline"}
                  className="gap-1 text-xs h-8 px-3 font-semibold shrink-0"
                  asChild
                >
                  <Link href={`/investigation?opportunity=${opp.code}`}>
                    <span>Investigate</span>
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
