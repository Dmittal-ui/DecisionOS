"use client";

import * as React from "react";
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionDNALearning } from "@/types/decision-dna";

interface DecisionLearningProps {
  learning: DecisionDNALearning;
  className?: string;
}

export function DecisionLearning({ learning, className }: DecisionLearningProps) {
  if (!learning.isAvailable) {
    return (
      <Card className={`w-full ${className || ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-bold">
                Post-Decision Organizational Learning
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Learning Pending
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Organizational insights synthesized from retrospective performance analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2 bg-muted/10">
            <Clock className="mx-auto h-6 w-6 text-muted-foreground/60" />
            <h4 className="text-sm font-semibold text-foreground">Retrospective Learning Pending</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Learning insights will become available after actual outcome metrics are recorded and reconciled against expected targets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    {
      label: "1. What We Expected",
      content: learning.whatWeExpected,
      icon: HelpCircle,
      borderColor: "border-blue-500/30",
      bg: "bg-blue-500/5",
      textColor: "text-blue-900 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "2. What Actually Happened",
      content: learning.whatHappened,
      icon: TrendingUp,
      borderColor: "border-purple-500/30",
      bg: "bg-purple-500/5",
      textColor: "text-purple-900 dark:text-purple-300",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "3. What We Learned",
      content: learning.whatWeLearned,
      icon: Lightbulb,
      borderColor: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      textColor: "text-emerald-900 dark:text-emerald-300",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "4. What Should Be Considered Next Time",
      content: learning.nextTimeConsideration,
      icon: RotateCw,
      borderColor: "border-amber-500/30",
      bg: "bg-amber-500/5",
      textColor: "text-amber-900 dark:text-amber-300",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base font-bold">
              Post-Decision Organizational Learning
            </CardTitle>
          </div>
          <Badge variant="positive" className="text-[10px] font-mono">
            Retrospective Validated
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Institutional memory updating DecisionOS cognitive weights and future scenario recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`rounded-lg border ${s.borderColor} ${s.bg} p-4 space-y-1.5`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {s.label}
                  </span>
                </div>
                <p className={`text-xs ${s.textColor} leading-relaxed pl-6 font-medium`}>
                  {s.content}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
