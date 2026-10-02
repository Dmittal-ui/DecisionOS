"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Copy, Check, ExternalLink, FileText, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DecisionDNARecord } from "@/types/decision-dna";

interface DecisionDNAActionsProps {
  record: DecisionDNARecord;
  className?: string;
}

export function DecisionDNAActions({ record, className }: DecisionDNAActionsProps) {
  const [copied, setCopied] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(record.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportText = `=====================================================
DECISION OS — DECISION DNA AUDIT BRIEF
=====================================================
DNA Signature:       ${record.id}
Decision ID:         ${record.decisionId}
Opportunity:         ${record.opportunityId}
Title:               ${record.title}
Status:              ${record.status.toUpperCase()}
Confidence Score:    ${record.confidence}%
Decision Date:       ${record.decisionDate}
Decision Maker:      ${record.owner} (${record.humanDecision.role})
Organization:        ${record.organization}

-----------------------------------------------------
1. BUSINESS QUESTION & TRIGGER
-----------------------------------------------------
Question: "${record.businessQuestion}"
Trigger:  ${record.trigger.problemTitle} (${record.trigger.metricAlert})

-----------------------------------------------------
2. SELECTED CONFIGURATION
-----------------------------------------------------
Marketing Budget:    ${record.selectedConfiguration.marketingBudget}
Working Inventory:   ${record.selectedConfiguration.workingInventory}
Unit Price:          ${record.selectedConfiguration.unitPrice}
Expected Profit:     ${record.selectedConfiguration.expectedProfit}
Expected Revenue:    ${record.selectedConfiguration.expectedRevenue}
Operating Margin:    ${record.selectedConfiguration.expectedMargin}

-----------------------------------------------------
3. HUMAN DECISION AUTHORIZATION
-----------------------------------------------------
Action:              ${record.humanDecision.action.toUpperCase()}
Rationale:           "${record.humanDecision.reason}"

-----------------------------------------------------
4. ACTUAL REALIZED OUTCOME
-----------------------------------------------------
Status:              ${record.actualOutcome.status.toUpperCase()}
Summary:             ${record.actualOutcome.summary}

-----------------------------------------------------
5. ORGANIZATIONAL LEARNING
-----------------------------------------------------
Expected:   ${record.learning.whatWeExpected}
Happened:   ${record.learning.whatHappened}
Learned:    ${record.learning.whatWeLearned}
Next Time:  ${record.learning.nextTimeConsideration}

=====================================================
PROVENANCE CHECKSUM: ${record.provenance.verifiedBy}
=====================================================`;

  return (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm ${className || ""}`}>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Audit Record:</span>
          <span className="font-mono font-bold text-foreground">{record.id}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyId}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy ID"}</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="gap-1.5 text-xs h-8"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export DNA Brief</span>
          </Button>

          <Link href="/decisions">
            <Button size="sm" variant="default" className="gap-1.5 text-xs h-8 font-semibold">
              <FileText className="h-3.5 w-3.5" />
              <span>Open Decision in Registry</span>
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Export Summary Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Download className="h-5 w-5" />
              <DialogTitle>Export Decision DNA Brief</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Complete formatted textual export of the decision record, evidence chain, and retrospective learning.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <pre className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap select-all">
              {exportText}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsExportOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(exportText);
                alert("Decision DNA Brief copied to clipboard!");
                setIsExportOpen(false);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Full Brief</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
