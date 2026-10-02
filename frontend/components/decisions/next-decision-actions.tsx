"use client";

import * as React from "react";
import Link from "next/link";
import { Dna, ArrowRight, Beaker, Cpu, Search, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NextDecisionActionsProps {
  className?: string;
}

export function NextDecisionActions({ className }: NextDecisionActionsProps) {
  const quickLinks = [
    {
      title: "Return to Scenario Lab",
      desc: "Simulate alternate parameter adjustments",
      icon: Beaker,
      href: "/scenario",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Return to Optimizer",
      desc: "Re-run Pareto optimization with new bounds",
      icon: Cpu,
      href: "/optimizer",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Review Investigation",
      desc: "Inspect causal evidence and signal data",
      icon: Search,
      href: "/investigation",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Review Decision Replay",
      desc: "Compare counterfactual replay outcomes",
      icon: History,
      href: "/replay",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Primary Decision DNA Handoff Banner */}
      <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-card to-primary/5 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-primary text-primary-foreground shrink-0 mt-0.5 md:mt-0">
                <Dna className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Preserve This Decision as Decision DNA
                </h3>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Record the full decision context, supporting evidence, constraints, recommendation, human action, and outcome into an immutable Decision DNA signature.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
              <Link href="/decision-dna" className="w-full sm:w-auto">
                <Button size="sm" variant="outline" className="w-full sm:w-auto gap-1.5">
                  <span>View Decision DNA</span>
                </Button>
              </Link>
              <Link href="/decision-dna" className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto gap-1.5 font-semibold">
                  <Dna className="h-3.5 w-3.5" />
                  <span>Create Decision DNA</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map((ql) => {
          const Icon = ql.icon;
          return (
            <Link key={ql.title} href={ql.href} className="group block">
              <div className="rounded-lg border border-border/70 bg-card p-3.5 h-full space-y-2 hover:border-primary/50 hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-md ${ql.bg} ${ql.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {ql.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {ql.desc}
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
