"use client";

import * as React from "react";
import { User, CheckCircle2, Edit3, XCircle, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HumanDecisionRecord } from "@/types/decision-dna";

interface DecisionHumanActionProps {
  humanDecision: HumanDecisionRecord;
  className?: string;
}

export function DecisionHumanAction({
  humanDecision,
  className,
}: DecisionHumanActionProps) {
  const getActionBadge = (action: HumanDecisionRecord["action"]) => {
    switch (action) {
      case "approved":
        return (
          <Badge variant="positive" className="gap-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved Without Modification</span>
          </Badge>
        );
      case "modified":
        return (
          <Badge variant="enterprise" className="gap-1 text-xs">
            <Edit3 className="h-3.5 w-3.5" />
            <span>Human-Modified & Authorized</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="critical" className="gap-1 text-xs">
            <XCircle className="h-3.5 w-3.5" />
            <span>Formally Rejected</span>
          </Badge>
        );
      case "pending_review":
      default:
        return (
          <Badge variant="warning" className="gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Pending Human Authorization</span>
          </Badge>
        );
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Human Governance Authorization
            </CardTitle>
          </div>
          {getActionBadge(humanDecision.action)}
        </div>
        <CardDescription className="text-xs">
          Immutable log of the authorized human stakeholder, executive sign-off timestamp, and formal justification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stakeholder Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">
              Decision Authorizer
            </span>
            <span className="font-semibold text-foreground text-sm block mt-0.5">
              {humanDecision.decisionMaker}
            </span>
            <span className="text-[11px] text-muted-foreground">{humanDecision.role}</span>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">
              Governance Timestamp
            </span>
            <span className="font-mono font-semibold text-foreground text-sm block mt-0.5">
              {humanDecision.decidedAt
                ? new Date(humanDecision.decidedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Awaiting Authorization"}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">UTC Audited</span>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">
              Authoritative Action
            </span>
            <span className="font-bold text-foreground text-sm block mt-0.5 capitalize">
              {humanDecision.action}
            </span>
            <span className="text-[11px] text-muted-foreground">Quorum Enforced</span>
          </div>
        </div>

        {/* Justification Quote Box */}
        <div className="rounded-lg border border-border/70 bg-card p-3.5 space-y-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Authoritative Rationale & Business Justification
          </span>
          <p className="text-foreground leading-relaxed italic">
            "{humanDecision.reason}"
          </p>
        </div>

        {/* Modification Details if Modified */}
        {humanDecision.modificationDetails && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 block">
              Human-Applied Parameter Modifications
            </span>
            <p className="text-blue-800 dark:text-blue-400">
              {humanDecision.modificationDetails.rationale}
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
              <div className="rounded bg-card p-2 border">
                <span className="text-[10px] text-muted-foreground block font-sans">Marketing Shift</span>
                <span className="text-muted-foreground line-through text-[11px]">{humanDecision.modificationDetails.originalMarketing}</span>
                <ArrowRight className="inline h-3 w-3 mx-1 text-primary" />
                <span className="font-bold text-foreground">{humanDecision.modificationDetails.modifiedMarketing}</span>
              </div>
              <div className="rounded bg-card p-2 border">
                <span className="text-[10px] text-muted-foreground block font-sans">Inventory Shift</span>
                <span className="text-muted-foreground line-through text-[11px]">{humanDecision.modificationDetails.originalInventory}</span>
                <ArrowRight className="inline h-3 w-3 mx-1 text-primary" />
                <span className="font-bold text-foreground">{humanDecision.modificationDetails.modifiedInventory}</span>
              </div>
              <div className="rounded bg-card p-2 border">
                <span className="text-[10px] text-muted-foreground block font-sans">Price Shift</span>
                <span className="text-muted-foreground line-through text-[11px]">{humanDecision.modificationDetails.originalPrice}</span>
                <ArrowRight className="inline h-3 w-3 mx-1 text-primary" />
                <span className="font-bold text-foreground">{humanDecision.modificationDetails.modifiedPrice}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
