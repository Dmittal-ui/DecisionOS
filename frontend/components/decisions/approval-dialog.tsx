"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import type { DecisionItem } from "@/types/decision-registry";

interface ApprovalDialogProps {
  decision: DecisionItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmApproval: () => void;
}

export function ApprovalDialog({
  decision,
  isOpen,
  onClose,
  onConfirmApproval,
}: ApprovalDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Approve this decision?</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Authorizing decision: <strong className="text-foreground">{decision.title}</strong> ({decision.code})
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Snapshot */}
        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Approved Configuration Snapshot
          </span>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded border bg-card p-2">
              <span className="text-[10px] text-muted-foreground block">Marketing</span>
              <span className="font-mono font-bold">{decision.recommendation.variables.marketingBudget}</span>
            </div>
            <div className="rounded border bg-card p-2">
              <span className="text-[10px] text-muted-foreground block">Inventory</span>
              <span className="font-mono font-bold">{decision.recommendation.variables.workingInventory}</span>
            </div>
            <div className="rounded border bg-card p-2">
              <span className="text-[10px] text-muted-foreground block">Unit Price</span>
              <span className="font-mono font-bold">{decision.recommendation.variables.unitPrice}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <span className="text-muted-foreground">Projected Gross Profit:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {decision.recommendation.projectedOutcomes.grossProfit}
            </span>
          </div>
        </div>

        {/* Governance Disclaimer */}
        <div className="flex items-start gap-2.5 rounded-md border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <p className="leading-relaxed">
            Approval records the recommendation as a human-approved decision. No external business action is executed by this frontend.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            onClick={() => {
              onConfirmApproval();
              onClose();
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirm Approval</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
