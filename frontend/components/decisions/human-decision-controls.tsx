"use client";

import * as React from "react";
import { CheckCircle2, Edit3, XCircle, ShieldAlert, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionItem } from "@/types/decision-registry";

interface HumanDecisionControlsProps {
  decision: DecisionItem;
  onOpenApprove: () => void;
  onOpenModify: () => void;
  onOpenReject: () => void;
  className?: string;
}

export function HumanDecisionControls({
  decision,
  onOpenApprove,
  onOpenModify,
  onOpenReject,
  className,
}: HumanDecisionControlsProps) {
  const isActioned = ["approved", "modified", "rejected", "recorded"].includes(decision.status);

  return (
    <Card className={`border-2 border-primary/40 bg-card shadow-md ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Human Decision Authorization
              </CardTitle>
              <CardDescription className="text-xs">
                DecisionOS recommends. A human decides. Select an authoritative governance action.
              </CardDescription>
            </div>
          </div>
          {isActioned && (
            <Badge variant="enterprise" className="self-start sm:self-auto font-mono text-xs uppercase">
              Action Taken: {decision.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. APPROVE */}
          <Button
            size="lg"
            variant="default"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            onClick={onOpenApprove}
            disabled={isActioned}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approve Decision</span>
          </Button>

          {/* 2. MODIFY */}
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2 border-border/80 hover:bg-muted font-semibold text-foreground"
            onClick={onOpenModify}
            disabled={isActioned}
          >
            <Edit3 className="h-4 w-4 text-blue-500" />
            <span>Modify Configuration</span>
          </Button>

          {/* 3. REJECT */}
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 font-semibold"
            onClick={onOpenReject}
            disabled={isActioned}
          >
            <XCircle className="h-4 w-4" />
            <span>Reject Decision</span>
          </Button>
        </div>

        {/* Action Meaning Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-muted-foreground border-t border-border/40">
          <div>
            <strong className="text-foreground font-semibold">Approve:</strong> Accept the recommended feasible configuration as proposed without manual changes.
          </div>
          <div>
            <strong className="text-foreground font-semibold">Modify:</strong> Review and adjust controllable levers (budget, inventory, price) prior to approval.
          </div>
          <div>
            <strong className="text-foreground font-semibold">Reject:</strong> Decline the recommendation with an explicit business justification recorded in registry.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
