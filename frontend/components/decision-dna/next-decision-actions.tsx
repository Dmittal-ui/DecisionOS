"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileCheck2,
  History,
  Beaker,
  Cpu,
  Search,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface NextDecisionActionsProps {
  className?: string;
}

export function NextDecisionActions({ className }: NextDecisionActionsProps) {
  const actions = [
    {
      title: "Review Decision Registry",
      desc: "Approve, modify, or reject pending business decisions",
      icon: FileCheck2,
      href: "/decisions",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Replay Past Decisions",
      desc: "Test counterfactual scenarios against historical series",
      icon: History,
      href: "/replay",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Open Scenario Lab",
      desc: "Simulate multi-lever business adjustments in sandbox",
      icon: Beaker,
      href: "/scenario",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Run Constraint Optimizer",
      desc: "Solve Pareto frontier across hard business boundaries",
      icon: Cpu,
      href: "/optimizer",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Explore Opportunities",
      desc: "Review live detected opportunities and prioritized anomalies",
      icon: Search,
      href: "/opportunities",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Command Center Dashboard",
      desc: "Return to central executive command and pipeline overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="space-y-1">
        <h3 className="text-base font-bold tracking-tight text-foreground">
          Contextual DecisionOS Workspaces
        </h3>
        <p className="text-xs text-muted-foreground">
          Navigate seamlessly across the DecisionOS decision-intelligence pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;

          return (
            <Link key={act.title} href={act.href} className="group block">
              <div className="rounded-lg border border-border/70 bg-card p-3.5 h-full space-y-2 hover:border-primary/50 hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-md ${act.bg} ${act.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {act.desc}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
