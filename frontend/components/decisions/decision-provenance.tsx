"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionProvenance as DecisionProvenanceType } from "@/types/decision-registry";

interface DecisionProvenanceProps {
  provenance: DecisionProvenanceType;
  className?: string;
}

export function DecisionProvenance({
  provenance,
  className,
}: DecisionProvenanceProps) {
  const nodes = [
    {
      label: "Opportunity",
      id: provenance.opportunityId,
      href: `/opportunities`,
      badge: "Detection",
    },
    {
      label: "Investigation",
      id: provenance.investigationId,
      href: `/investigation`,
      badge: "Causality",
    },
    {
      label: "Replay",
      id: provenance.replayId,
      href: `/replay`,
      badge: "Counterfactual",
    },
    {
      label: "Scenario",
      id: provenance.scenarioId,
      href: `/scenario`,
      badge: "Simulation",
    },
    {
      label: "Optimizer",
      id: provenance.optimizerId,
      href: `/optimizer`,
      badge: "Pareto Fit",
    },
  ];

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Decision Provenance Lineage
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Where Did This Decision Come From?
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Interactive traceability graph connecting root opportunity discovery to the final optimization run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Lineage Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
          {nodes.map((node, idx) => (
            <div
              key={node.label}
              className="relative rounded-md border border-border/70 bg-card p-3 flex flex-col justify-between space-y-2 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  {node.label}
                </span>
                <Badge variant="neutral" className="text-[9px] px-1 py-0 font-mono">
                  {node.badge}
                </Badge>
              </div>

              <div>
                <Link
                  href={node.href}
                  className="flex items-center gap-1 font-mono font-bold text-xs text-primary group-hover:underline"
                >
                  <span>{node.id}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
