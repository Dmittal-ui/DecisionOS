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
import { Input } from "@/components/ui/input";
import { Edit3, Info, Sparkles } from "lucide-react";
import type { DecisionItem, ModifiedConfiguration } from "@/types/decision-registry";

interface ModificationDialogProps {
  decision: DecisionItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitModified: (modified: ModifiedConfiguration) => void;
}

export function ModificationDialog({
  decision,
  isOpen,
  onClose,
  onSubmitModified,
}: ModificationDialogProps) {
  const [marketingBudget, setMarketingBudget] = React.useState(
    decision.recommendation.variables.marketingBudget || "₹1.55 Cr"
  );
  const [workingInventory, setWorkingInventory] = React.useState(
    decision.recommendation.variables.workingInventory || "1,000 units"
  );
  const [unitPrice, setUnitPrice] = React.useState(
    decision.recommendation.variables.unitPrice || "₹107"
  );
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setMarketingBudget(decision.recommendation.variables.marketingBudget || "₹1.55 Cr");
      setWorkingInventory(decision.recommendation.variables.workingInventory || "1,000 units");
      setUnitPrice(decision.recommendation.variables.unitPrice || "₹107");
      setNotes("");
    }
  }, [isOpen, decision]);

  const handleSubmit = () => {
    onSubmitModified({
      marketingBudget,
      workingInventory,
      unitPrice,
      modifiedAt: new Date().toISOString(),
      modifiedBy: "Alexandra Chen (CSOO)",
      notes: notes.trim() || "Adjusted controllable levers to align with internal targets.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Edit3 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Modify Decision Configuration</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Review and adjust controllable levers before authoring a modified decision record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Levers Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Marketing Budget (Original: {decision.recommendation.variables.marketingBudget})
              </label>
              <Input
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(e.target.value)}
                placeholder="e.g. ₹1.55 Cr"
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Working Inventory (Original: {decision.recommendation.variables.workingInventory})
              </label>
              <Input
                value={workingInventory}
                onChange={(e) => setWorkingInventory(e.target.value)}
                placeholder="e.g. 1,000 units"
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Unit Price (Original: {decision.recommendation.variables.unitPrice})
              </label>
              <Input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="e.g. ₹107"
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Modification Justification / Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the operational rationale for modifying these parameters..."
                className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px]"
              />
            </div>
          </div>

          <div className="rounded-md border border-border/80 bg-muted/20 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
            <span>
              Human modification updates the recorded parameters. No real-time recalculation of financial models is performed in this frontend.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
            onClick={handleSubmit}
          >
            <Sparkles className="h-4 w-4" />
            <span>Submit Modified Decision</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
