"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, ArrowRight, ExternalLink, CheckCircle2, CircleDot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionLineageNode } from "@/types/decision-dna";

interface DecisionLineageProps {
  lineage: DecisionLineageNode[];
  className?: string;
}

export function DecisionLineage({ lineage, className }: DecisionLineageProps) {
  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              End-to-End Decision Lineage & Reasoning Chain
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Full Audit Traceability
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Interactive multi-stage lineage tracking the complete lifecycle from anomaly detection to immutable Decision DNA archiving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Horizontal Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 pt-1">
          {lineage.map((node, idx) => {
            const isLast = idx === lineage.length - 1;
            const isCompleted = node.status === "completed";
            const isActive = node.status === "active";

            return (
              <div
                key={node.stage}
                className={`relative rounded-lg border p-3 flex flex-col justify-between space-y-2 transition-all group ${
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                    : isCompleted
                    ? "border-emerald-500/30 bg-card hover:border-emerald-500/60"
                    : "border-border/50 bg-muted/20 opacity-70"
                }`}
              >
                {/* Node Top Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground truncate">
                    {node.stage}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/80">
                    0{idx + 1}
                  </span>
                </div>

                {/* Node ID & Link */}
                <div className="space-y-1">
                  <Link
                    href={node.route}
                    className="flex items-center gap-1 font-mono font-bold text-xs text-primary group-hover:underline"
                  >
                    <span>{node.id || "—"}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                    {node.description}
                  </p>
                </div>

                {/* Node Footer Status & Time */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <CircleDot className="h-3 w-3 text-primary animate-pulse" />
                    )}
                    <span className="capitalize">{node.status}</span>
                  </span>
                  <span className="font-mono">{node.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
