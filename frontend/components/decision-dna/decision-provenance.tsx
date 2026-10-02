"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, ExternalLink, ShieldCheck, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNAProvenance } from "@/types/decision-dna";
import { isMockMode } from "@/lib/repositories";

interface DecisionProvenanceProps {
  provenance: DecisionDNAProvenance;
  className?: string;
}

export function DecisionProvenance({
  provenance,
  className,
}: DecisionProvenanceProps) {
  const nodes = [
    { label: "Opportunity", id: provenance.opportunityId, href: "/opportunities", badge: "Origin" },
    { label: "Investigation", id: provenance.investigationId, href: "/investigation", badge: "Causality" },
    { label: "Replay", id: provenance.replayId, href: "/replay", badge: "Counterfactual" },
    { label: "Scenario", id: provenance.scenarioId, href: "/scenario", badge: "Simulation" },
    { label: "Optimizer", id: provenance.optimizationId, href: "/optimizer", badge: "Solver Run" },
    { label: "Decision", id: provenance.decisionId, href: "/decisions", badge: "Registry Record" },
    { label: "Decision DNA", id: provenance.dnaId, href: "/decision-dna", badge: "Immutable Signature" },
  ];

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Provenance Chain & Cryptographic Checksum
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Lineage Record
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Cross-system identity mapping ensuring complete tamper-evident lineage across the entire DecisionOS suite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="rounded-md border border-border/70 bg-card p-2.5 space-y-1.5 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground truncate">
                  {n.label}
                </span>
                <Badge variant="neutral" className="text-[8px] px-1 py-0 font-mono">
                  {n.badge}
                </Badge>
              </div>
              <Link
                href={n.href}
                className="font-mono font-bold text-xs text-primary group-hover:underline flex items-center gap-0.5 truncate"
              >
                <span>{n.id || "—"}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 shrink-0" />
              </Link>
            </div>
          ))}
        </div>

        {/* Verification Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>
              Verified by: <strong className="text-foreground font-mono">{provenance.verifiedBy || "System"}</strong>
            </span>
          </div>
          <span className="font-mono text-[10px]">
            Archived {provenance.recordedAt ? new Date(provenance.recordedAt).toLocaleString() : "Live"}
          </span>
        </div>

        {isMockMode() && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
            <Info className="h-3 w-3 shrink-0" />
            <span>Notice: Frontend mock provenance record for architectural and audit demonstrations.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
