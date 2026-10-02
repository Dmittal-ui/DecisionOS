"use client";

import * as React from "react";
import { History, Sparkles, Search, ShieldCheck, CheckCircle2, Edit3, XCircle, FileCheck2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionAuditTimelineItem } from "@/types/decision-registry";

interface AuditTimelineProps {
  timeline: DecisionAuditTimelineItem[];
  className?: string;
}

export function AuditTimeline({ timeline, className }: AuditTimelineProps) {
  const getEventIcon = (type: DecisionAuditTimelineItem["type"]) => {
    switch (type) {
      case "generated":
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
      case "review":
        return <Search className="h-3.5 w-3.5 text-blue-500" />;
      case "evidence":
      case "constraint":
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "modified":
        return <Edit3 className="h-3.5 w-3.5 text-blue-500" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      case "recorded":
      default:
        return <FileCheck2 className="h-3.5 w-3.5 text-purple-500" />;
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Decision Audit Timeline
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Mock Audit Timeline
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Chronological record of decision lifecycle steps and stakeholder interactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative flex items-start gap-3 text-xs">
              {/* Dot */}
              <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                {getEventIcon(item.type)}
              </div>

              {/* Event Content */}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {item.event}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Actor: <span className="font-medium text-foreground">{item.actor}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
