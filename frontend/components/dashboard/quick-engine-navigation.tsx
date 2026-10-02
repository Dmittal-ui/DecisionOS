"use client";

import * as React from "react";
import Link from "next/link";
import { Search, RotateCcw, Sliders, Cpu, GitPullRequest, ArrowRight, Dna } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function QuickEngineNavigation() {
  const engines = [
    {
      title: "Deep Investigation",
      sub: "Root-cause anomaly tracing",
      href: "/investigation",
      icon: Search,
      color: "text-foreground",
      bg: "bg-muted/80 border-border",
    },
    {
      title: "Decision Replay",
      sub: "Historical counterfactual playback",
      href: "/replay",
      icon: RotateCcw,
      color: "text-foreground",
      bg: "bg-muted/80 border-border",
    },
    {
      title: "Scenario Simulation",
      sub: "Multi-variable stress-testing",
      href: "/scenario",
      icon: Sliders,
      color: "text-foreground",
      bg: "bg-muted/80 border-border",
    },
    {
      title: "Pareto Optimizer",
      sub: "Constraint-aware resource allocation",
      href: "/optimizer",
      icon: Cpu,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      title: "Decision Registry",
      sub: "Governance & human approval trails",
      href: "/decisions",
      icon: GitPullRequest,
      color: "text-foreground",
      bg: "bg-muted/80 border-border",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Decision Engine Quick Launchers
        </h3>
        <span className="text-[11px] font-mono text-muted-foreground">Direct Module Navigation</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {engines.map((eng) => {
          const Icon = eng.icon;
          return (
            <Link
              key={eng.href}
              href={eng.href}
              className="group rounded-xl border border-border/80 bg-card p-3.5 flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${eng.bg}`}>
                  <Icon className={`h-4 w-4 ${eng.color}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {eng.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {eng.sub}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
