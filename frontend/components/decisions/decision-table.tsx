"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import {
  Clock,
  CheckCircle2,
  Edit3,
  XCircle,
  FileCheck2,
  ArrowUpRight,
  Eye,
  ShieldCheck,
  User,
  Activity,
} from "lucide-react";
import type { DecisionItem, DecisionStatus } from "@/types/decision-registry";

interface DecisionTableProps {
  decisions: DecisionItem[];
  selectedDecisionId?: string;
  onSelectDecision: (decision: DecisionItem) => void;
}

export function DecisionTable({
  decisions,
  selectedDecisionId,
  onSelectDecision,
}: DecisionTableProps) {
  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case "under_review":
        return (
          <Badge variant="warning" className="gap-1 text-[10px] font-medium">
            <Clock className="h-3 w-3" />
            <span>Under Review</span>
          </Badge>
        );
      case "proposed":
        return (
          <Badge variant="neutral" className="gap-1 text-[10px] font-medium">
            <Activity className="h-3 w-3" />
            <span>Proposed</span>
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="positive" className="gap-1 text-[10px] font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved</span>
          </Badge>
        );
      case "modified":
        return (
          <Badge variant="enterprise" className="gap-1 text-[10px] font-medium">
            <Edit3 className="h-3 w-3" />
            <span>Modified</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="critical" className="gap-1 text-[10px] font-medium">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      case "recorded":
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <FileCheck2 className="h-3 w-3" />
            <span>Recorded</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: DecisionItem["source"]) => {
    switch (source) {
      case "optimization":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Optimizer</Badge>;
      case "scenario":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Scenario</Badge>;
      case "replay":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Replay</Badge>;
      case "investigation":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Investigation</Badge>;
      case "manual":
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Manual</Badge>;
    }
  };

  if (decisions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card/50">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <h4 className="text-sm font-semibold text-foreground">No decisions match current filters</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Try clearing your search query or selecting "All Statuses" and "All Sources".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Decision Record</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Objective</th>
              <th className="py-3 px-4 text-right">Projected Value</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {decisions.map((dec) => {
              const isSelected = selectedDecisionId === dec.id;
              const isPending = ["under_review", "proposed"].includes(dec.status);

              return (
                <tr
                  key={dec.id}
                  onClick={() => onSelectDecision(dec)}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  {/* Decision Code & Title */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">
                          {dec.code}
                        </span>
                        {dec.priority === "critical" && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {dec.title}
                      </p>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getSourceBadge(dec.source)}
                  </td>

                  {/* Objective */}
                  <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                    {dec.objective}
                  </td>

                  {/* Impact */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {dec.impact}
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex justify-center">
                      <ConfidenceIndicator score={dec.confidence} size="sm" />
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(dec.status)}
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground/70" />
                      <span>{dec.owner}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant={isPending ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDecision(dec);
                      }}
                    >
                      <span>{isPending ? "Review" : "View"}</span>
                      {isPending ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden divide-y divide-border/60">
        {decisions.map((dec) => {
          const isSelected = selectedDecisionId === dec.id;
          const isPending = ["under_review", "proposed"].includes(dec.status);

          return (
            <div
              key={dec.id}
              onClick={() => onSelectDecision(dec)}
              className={`p-4 space-y-3 cursor-pointer ${
                isSelected ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{dec.code}</span>
                  {getSourceBadge(dec.source)}
                </div>
                {getStatusBadge(dec.status)}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">{dec.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{dec.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground text-[10px]">Projected Value:</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{dec.impact}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Owner:</span>
                  <p className="text-foreground truncate">{dec.owner}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <ConfidenceIndicator score={dec.confidence} size="sm" />
                <Button
                  variant={isPending ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  <span>{isPending ? "Review Decision" : "View Details"}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
