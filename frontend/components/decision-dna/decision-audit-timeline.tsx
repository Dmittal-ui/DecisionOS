"use client";

import * as React from "react";
import {
  History,
  Sparkles,
  Search,
  SlidersHorizontal,
  Cpu,
  UserCheck,
  FileCheck2,
  TrendingUp,
  RotateCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNAAuditEvent } from "@/types/decision-dna";

interface DecisionAuditTimelineProps {
  auditEvents: DecisionDNAAuditEvent[];
  className?: string;
}

export function DecisionAuditTimeline({
  auditEvents,
  className,
}: DecisionAuditTimelineProps) {
  const getEventIcon = (type: DecisionDNAAuditEvent["type"]) => {
    switch (type) {
      case "detected":
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
      case "investigated":
        return <Search className="h-3.5 w-3.5 text-blue-500" />;
      case "simulated":
        return <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />;
      case "optimized":
        return <Cpu className="h-3.5 w-3.5 text-emerald-500" />;
      case "reviewed":
      case "authorized":
        return <UserCheck className="h-3.5 w-3.5 text-amber-500" />;
      case "recorded":
        return <FileCheck2 className="h-3.5 w-3.5 text-primary" />;
      case "outcome_tracked":
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "learning_updated":
      default:
        return <RotateCw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Complete Decision Audit Timeline
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {auditEvents.length} Lifecycle Milestones
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Comprehensive historical event sequence tracking all actor actions, automated triggers, and telemetry reconciliations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {auditEvents.map((event) => (
            <div key={event.id} className="relative flex items-start gap-3 text-xs">
              {/* Timeline Icon */}
              <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                {getEventIcon(event.type)}
              </div>

              {/* Event Content */}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {event.event}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {event.time}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {event.description}
                </p>
                <p className="text-[10px] text-muted-foreground/80 font-mono">
                  Actor: <strong className="text-foreground font-medium">{event.actor}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
