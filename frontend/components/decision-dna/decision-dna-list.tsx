"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import {
  Dna,
  CheckCircle2,
  Edit3,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import type { DecisionDNARecord, DecisionDNAStatus } from "@/types/decision-dna";

interface DecisionDNAListProps {
  records: DecisionDNARecord[];
  selectedRecordId?: string;
  onSelectRecord: (record: DecisionDNARecord) => void;
}

export function DecisionDNAList({
  records,
  selectedRecordId,
  onSelectRecord,
}: DecisionDNAListProps) {
  const getStatusBadge = (status: DecisionDNAStatus) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="positive" className="gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved</span>
          </Badge>
        );
      case "modified":
        return (
          <Badge variant="enterprise" className="gap-1 text-[10px]">
            <Edit3 className="h-3 w-3" />
            <span>Modified</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="critical" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      case "outcome_pending":
      default:
        return (
          <Badge variant="warning" className="gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            <span>Outcome Pending</span>
          </Badge>
        );
    }
  };

  const getOutcomeBadge = (outcomeStatus: DecisionDNARecord["actualOutcome"]["status"]) => {
    switch (outcomeStatus) {
      case "achieved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Achieved
          </span>
        );
      case "partially_achieved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Partial Lift
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Missed Target
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            Tracking...
          </span>
        );
    }
  };

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card/50">
        <Dna className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <h4 className="text-sm font-semibold text-foreground">No Decision DNA records match filters</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Try resetting filters or searching with a broader query.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">DNA Signature</th>
              <th className="py-3 px-4">Decision Title & Trigger</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-right">Expected Profit</th>
              <th className="py-3 px-4 text-center">Governance</th>
              <th className="py-3 px-4 text-center">Outcome</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {records.map((record) => {
              const isSelected = selectedRecordId === record.id;

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  {/* DNA ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Dna className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono font-bold text-primary">
                        {record.id}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono block pl-5">
                      {record.decisionId}
                    </span>
                  </td>

                  {/* Title & Trigger */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-foreground line-clamp-1">
                      {record.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {record.trigger.problemTitle}
                    </p>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {record.type}
                    </Badge>
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{record.owner}</span>
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex justify-center">
                      <ConfidenceIndicator score={record.confidence} size="sm" />
                    </div>
                  </td>

                  {/* Expected Profit */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {record.expectedOutcome.expectedProfit}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>

                  {/* Outcome Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getOutcomeBadge(record.actualOutcome.status)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(record);
                      }}
                    >
                      <span>Inspect DNA</span>
                      <ArrowUpRight className="h-3 w-3" />
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
        {records.map((record) => {
          const isSelected = selectedRecordId === record.id;

          return (
            <div
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className={`p-4 space-y-3 cursor-pointer ${
                isSelected ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-primary">
                  <Dna className="h-3.5 w-3.5" />
                  <span>{record.id}</span>
                  <span className="text-muted-foreground font-normal">({record.decisionId})</span>
                </div>
                {getStatusBadge(record.status)}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">{record.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{record.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground text-[10px]">Expected Profit:</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {record.expectedOutcome.expectedProfit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Actual Outcome:</span>
                  <div>{getOutcomeBadge(record.actualOutcome.status)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <ConfidenceIndicator score={record.confidence} size="sm" />
                <Button size="sm" variant={isSelected ? "default" : "outline"} className="h-7 text-xs gap-1">
                  <span>Inspect DNA Record</span>
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
