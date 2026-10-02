"use client";

import * as React from "react";
import { ArrowLeft, Clock, ShieldCheck, User, Sparkles, CheckCircle2, Edit3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecommendationSummary } from "./recommendation-summary";
import { RecommendationComparison } from "./recommendation-comparison";
import { DecisionEvidence } from "./decision-evidence";
import { ConstraintVerification } from "./constraint-verification";
import { DecisionConfidence } from "./decision-confidence";
import { DecisionUncertainty } from "./decision-uncertainty";
import { HumanDecisionControls } from "./human-decision-controls";
import { DecisionStatusLifecycle } from "./decision-status-lifecycle";
import { AuditTimeline } from "./audit-timeline";
import { DecisionProvenance } from "./decision-provenance";
import type { DecisionItem } from "@/types/decision-registry";

interface DecisionReviewWorkspaceProps {
  decision: DecisionItem;
  onBackToList: () => void;
  onOpenApprove: () => void;
  onOpenModify: () => void;
  onOpenReject: () => void;
  className?: string;
}

export function DecisionReviewWorkspace({
  decision,
  onBackToList,
  onOpenApprove,
  onOpenModify,
  onOpenReject,
  className,
}: DecisionReviewWorkspaceProps) {
  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Top Review Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToList}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Decision List</span>
            </Button>
            <span className="text-muted-foreground/50">|</span>
            <span className="font-mono text-xs font-bold text-primary">
              {decision.code}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {decision.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>
              Source: <strong className="text-foreground capitalize">{decision.source}</strong>
            </span>
            <span>•</span>
            <span>
              Objective: <strong className="text-foreground">{decision.objective}</strong>
            </span>
            <span>•</span>
            <span>
              Owner: <strong className="text-foreground">{decision.owner}</strong>
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <Badge
            variant={
              decision.status === "approved"
                ? "positive"
                : decision.status === "modified"
                ? "enterprise"
                : decision.status === "rejected"
                ? "critical"
                : "warning"
            }
            className="text-xs px-2.5 py-1 uppercase font-mono"
          >
            {decision.status.replace(/_/g, " ")}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">
            Updated {new Date(decision.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Human-Modified Notification if applicable */}
      {decision.modifiedConfig && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span>Human-Modified Configuration Active</span>
          </div>
          <p className="text-blue-800/90 dark:text-blue-400/90 leading-relaxed">
            Modified by <strong>{decision.modifiedConfig.modifiedBy}</strong> on{" "}
            {new Date(decision.modifiedConfig.modifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}:{" "}
            <em>"{decision.modifiedConfig.notes}"</em>
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
            <div className="bg-card p-2 rounded border">
              <span className="text-[10px] text-muted-foreground block">Modified Budget</span>
              <span className="font-bold">{decision.modifiedConfig.marketingBudget}</span>
            </div>
            <div className="bg-card p-2 rounded border">
              <span className="text-[10px] text-muted-foreground block">Modified Inventory</span>
              <span className="font-bold">{decision.modifiedConfig.workingInventory}</span>
            </div>
            <div className="bg-card p-2 rounded border">
              <span className="text-[10px] text-muted-foreground block">Modified Unit Price</span>
              <span className="font-bold">{decision.modifiedConfig.unitPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notification if applicable */}
      {decision.rejectionDetails && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-2 text-xs text-rose-900 dark:text-rose-300">
          <div className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>Decision Formally Rejected</span>
          </div>
          <p className="leading-relaxed">
            Justification: <strong>{decision.rejectionDetails.reason}</strong>
            {decision.rejectionDetails.notes && ` — "${decision.rejectionDetails.notes}"`}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            Recorded by {decision.rejectionDetails.rejectedBy} on {new Date(decision.rejectionDetails.rejectedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* 1. Governance Lifecycle */}
      <DecisionStatusLifecycle currentStatus={decision.status} />

      {/* 2. Core Human Decision Controls */}
      <HumanDecisionControls
        decision={decision}
        onOpenApprove={onOpenApprove}
        onOpenModify={onOpenModify}
        onOpenReject={onOpenReject}
      />

      {/* 3. Recommendation Summary Card */}
      <RecommendationSummary recommendation={decision.recommendation} />

      {/* 4. Current vs Recommended Comparison Table */}
      <RecommendationComparison comparisons={decision.comparisons} />

      {/* 5. Hard Constraint Verification */}
      <ConstraintVerification constraints={decision.constraints} />

      {/* 6. Evidence & Reasoning Chain */}
      <DecisionEvidence evidence={decision.evidence} />

      {/* 7. Confidence & Uncertainty Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DecisionConfidence confidenceDetails={decision.confidenceDetails} />
        <DecisionUncertainty confidenceDetails={decision.confidenceDetails} />
      </div>

      {/* 8. Audit Timeline & Decision Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuditTimeline timeline={decision.auditTimeline} />
        <DecisionProvenance provenance={decision.provenance} />
      </div>
    </div>
  );
}
