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
import { XCircle, AlertTriangle } from "lucide-react";
import type { DecisionItem, RejectionDetails } from "@/types/decision-registry";

interface RejectionDialogProps {
  decision: DecisionItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRejection: (details: RejectionDetails) => void;
}

const REJECTION_REASONS = [
  "Insufficient business context",
  "Risk tolerance too low",
  "Operational constraints",
  "Management decision",
  "Other",
];

export function RejectionDialog({
  decision,
  isOpen,
  onClose,
  onConfirmRejection,
}: RejectionDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState("");
  const [explanation, setExplanation] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setExplanation("");
      setError(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedReason) {
      setError(true);
      return;
    }

    onConfirmRejection({
      reason: selectedReason,
      notes: explanation.trim() || undefined,
      rejectedAt: new Date().toISOString(),
      rejectedBy: "Alexandra Chen (CSOO)",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-full bg-rose-500/10">
              <XCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Reject Decision</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            A formal business justification is required to record a decision rejection in the registry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reason Select */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Rejection Reason <span className="text-rose-500">*</span></span>
              {error && (
                <span className="text-rose-500 text-[10px] font-normal">
                  Please select a justification
                </span>
              )}
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                if (e.target.value) setError(false);
              }}
              className={`w-full mt-1.5 rounded-md border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                error ? "border-rose-500" : "border-input"
              }`}
            >
              <option value="">-- Select a reason --</option>
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Explanation */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              Detailed Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide context regarding the decision decline for audit compliance..."
              className="w-full mt-1.5 rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
            />
          </div>

          <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>
              This rejection will be preserved in the immutable audit registry and marked in historical lineage.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="font-semibold gap-1.5"
            onClick={handleConfirm}
            disabled={!selectedReason}
          >
            <XCircle className="h-4 w-4" />
            <span>Confirm Rejection</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
