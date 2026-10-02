"use client";

import * as React from "react";
import {
  FileText,
  TrendingUp,
  Percent,
  Gauge,
  Package,
  DollarSign,
  ArrowRight,
  GitBranch,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionEvidenceItem } from "@/types/decision-registry";

interface DecisionEvidenceProps {
  evidence: DecisionEvidenceItem[];
  className?: string;
}

export function DecisionEvidence({ evidence, className }: DecisionEvidenceProps) {
  const reasoningChain = [
    { step: "1", title: "Business Opportunity", desc: "Detected churn & margin risk" },
    { step: "2", title: "Investigation", desc: "Root cause causality proven" },
    { step: "3", title: "Scenario Simulation", desc: "Multi-factor lever testing" },
    { step: "4", title: "Constraint Evaluation", desc: "Hard boundaries enforced" },
    { step: "5", title: "Pareto Optimization", desc: "Maximum objective outcome" },
    { step: "6", title: "Recommendation", desc: "Human review & sign-off" },
  ];

  const getEvidenceIcon = (type: DecisionEvidenceItem["type"]) => {
    switch (type) {
      case "efficiency":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "margin":
        return <Percent className="h-4 w-4 text-blue-500" />;
      case "sensitivity":
        return <Gauge className="h-4 w-4 text-amber-500" />;
      case "inventory":
        return <Package className="h-4 w-4 text-purple-500" />;
      case "price":
      default:
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-bold">
            Evidence & Reasoning Chain
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Transparent causal lineage explaining why this configuration was synthesized by DecisionOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reasoning Chain Timeline */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            End-to-End Decision Flow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {reasoningChain.map((rc, idx) => (
              <div
                key={rc.step}
                className="relative rounded-md border border-border/70 bg-muted/20 p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-mono font-bold text-primary">
                    {rc.step}
                  </span>
                  {idx < reasoningChain.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 hidden lg:block -mr-1" />
                  )}
                </div>
                <div>
                  <h5 className="text-[11px] font-semibold text-foreground leading-tight">
                    {rc.title}
                  </h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {rc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Items */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Supporting Evidence & Signals ({evidence.length})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidence.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5 hover:border-border transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted">
                      {getEvidenceIcon(item.type)}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {item.title}
                    </span>
                  </div>
                  <Badge variant="neutral" className="text-[10px]">
                    {item.signal}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
