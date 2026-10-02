"use client";

import * as React from "react";
import { HelpCircle, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { DecisionDNARecord } from "@/types/decision-dna";

interface DecisionSummaryProps {
  record: DecisionDNARecord;
  className?: string;
}

export function DecisionSummary({ record, className }: DecisionSummaryProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">
          Decision Executive Brief & Trigger Context
        </CardTitle>
        <CardDescription className="text-xs">
          Authoritative business problem statement, triggering market anomalies, and the resulting human decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Business Question */}
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Business Question / Strategic Dilemma</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            "{record.businessQuestion}"
          </p>
        </div>

        {/* 2. Decision Trigger */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Decision Trigger: What Changed in the Business?</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {record.trigger.metricAlert}
            </span>
          </div>
          <h4 className="font-semibold text-foreground text-xs">
            {record.trigger.problemTitle}
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            {record.trigger.description}
          </p>
        </div>

        {/* 3. Decision Made */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Authoritative Decision Made</span>
          </div>
          <p className="text-foreground font-medium leading-relaxed">
            {record.summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
