"use client";

import * as React from "react";
import { RecentActivityItem } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Sparkles, Search, Sliders, CheckCircle2, ShieldAlert } from "lucide-react";

interface DecisionAuditFeedProps {
  activities: RecentActivityItem[];
}

export function DecisionAuditFeed({ activities }: DecisionAuditFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "decision":
        return CheckCircle2;
      case "investigation":
        return Search;
      case "scenario":
        return Sliders;
      case "alert":
        return Sparkles;
      default:
        return Activity;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "decision":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "investigation":
        return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
      case "scenario":
        return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case "alert":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  return (
    <Card className="border-border/80 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">Decision Audit Stream</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            LIVE LOGS
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Continuous immutable log of agent discoveries, simulations, and sign-offs.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-1 flex-1">
        <div className="space-y-3">
          {activities.map((act) => {
            const Icon = getActivityIcon(act.type);
            const iconStyle = getIconColor(act.type);

            return (
              <div
                key={act.id}
                className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start gap-3 hover:border-border transition-colors text-xs"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${iconStyle} mt-0.5`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground truncate">{act.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {act.timeAgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground font-mono">
                    <span>Actor: {act.actor.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
