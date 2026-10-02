"use client";

import * as React from "react";
import { History, CheckCircle2, Edit3, XCircle, FileCheck2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionItem, DecisionStatus } from "@/types/decision-registry";

interface DecisionHistoryProps {
  historyItems: DecisionItem[];
  onSelectDecision?: (decision: DecisionItem) => void;
  className?: string;
}

export function DecisionHistory({
  historyItems,
  onSelectDecision,
  className,
}: DecisionHistoryProps) {
  const getStatusIcon = (status: DecisionStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "modified":
        return <Edit3 className="h-3.5 w-3.5 text-blue-500" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      case "recorded":
        return <FileCheck2 className="h-3.5 w-3.5 text-purple-500" />;
      case "under_review":
      default:
        return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case "approved":
        return <Badge variant="positive" className="text-[10px]">Approved</Badge>;
      case "modified":
        return <Badge variant="enterprise" className="text-[10px]">Modified</Badge>;
      case "rejected":
        return <Badge variant="critical" className="text-[10px]">Rejected</Badge>;
      case "recorded":
        return <Badge variant="secondary" className="text-[10px]">Recorded</Badge>;
      case "under_review":
      default:
        return <Badge variant="warning" className="text-[10px]">Under Review</Badge>;
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Decision History & Registry Log
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {historyItems.length} decisions in audit registry
          </span>
        </div>
        <CardDescription className="text-xs">
          Comprehensive log of historical governance decisions, actor sign-offs, and parameter adjustments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectDecision && onSelectDecision(item)}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="font-mono font-semibold text-xs text-primary">
                    {item.code}
                  </span>
                  {getStatusBadge(item.status)}
                  <Badge variant="outline" className="text-[9px] uppercase font-mono hidden sm:inline-flex">
                    {item.source}
                  </Badge>
                </div>
                <h4 className="font-medium text-xs text-foreground">
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-muted-foreground">
                <span className="font-mono text-[11px]">
                  {new Date(item.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-foreground font-medium text-[11px] truncate max-w-[120px]">
                  {item.owner}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
