"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight, History, GitFork, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MOCK_REPLAY_RESULT } from "@/lib/mock-data/replay.mock";
import { formatCurrency } from "@/lib/utils";

export function DecisionReplaySection() {
  const replay = MOCK_REPLAY_RESULT;

  const metricComparison = [
    { label: "Total Revenue", actual: "₹12.5 Cr", counterfactual: "₹15.3 Cr", delta: "+₹2.8 Cr (+22.4%)", status: "positive" },
    { label: "Gross Profit", actual: "₹4.1 Cr", counterfactual: "₹5.8 Cr", delta: "+₹1.7 Cr (+41.5%)", status: "positive" },
    { label: "Operating Margin", actual: "32.8%", counterfactual: "37.9%", delta: "+510 bps", status: "positive" },
    { label: "Orders Fulfilled", actual: "42,100", counterfactual: "49,400", delta: "+7,300 (+17.3%)", status: "positive" },
    { label: "Unused Inventory", actual: "₹1.8 Cr", counterfactual: "₹0.9 Cr", delta: "-50.0% (Trapped Capital Freed)", status: "positive" },
  ];

  return (
    <section id="replay" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Signature Differentiator
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Decision Replay & Counterfactual Modeling
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            What if you had made a different choice? Rewind to any historical decision point and compare actual empirical performance against the counterfactual path.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start md:self-end" asChild>
          <Link href="/replay">
            <span>Explore Decision Replay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Visual Replay Flow Board */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xl space-y-8">
        {/* Historical Fork Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border/70 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Historical Decision Point</span>
                <Badge variant="outline" className="text-[10px] font-mono">Q2 APAC SOURCING FORK</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Period: April 1, 2026 — June 30, 2026 | Decision: Infrastructure Sourcing & Capacity Commitment
              </p>
            </div>
          </div>
          <Badge variant="warning" className="self-start sm:self-auto text-xs">
            ₹2.8 Cr Missed Alpha Isolated
          </Badge>
        </div>

        {/* Fork Split Visual: Actual vs Counterfactual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Actual Historical Timeline */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <h3 className="text-sm font-bold text-foreground">Actual Path Executed (Historical)</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">STATUS QUO BIAS</Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Action Taken:</p>
              <p className="rounded border border-border/60 bg-muted/20 p-2.5">
                Locked in 3-Year Fixed Dedicated Reserved Instances to capture standard upfront 15% discount.
              </p>
            </div>

            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>Empirical Friction Identified</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Spot market prices dropped 38% while enterprise volume surged 80%, resulting in heavy overage charges ($420k) and zero workload elasticity.
              </p>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Realized Total Value:</span>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">₹12.5 Cr</p>
            </div>
          </div>

          {/* Counterfactual Timeline */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Counterfactual Path (DecisionOS Optimal)
                </h3>
              </div>
              <Badge variant="positive" className="text-[10px]">RECOMMENDED ALTERNATIVE</Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Counterfactual Action:</p>
              <p className="rounded border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-foreground">
                Hybrid 1-Year Baseline + Automated Dynamic Spot Hedging allocation based on real-time price signals.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Deterministic Lift Verified</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Absorbed burst customer compute spikes at 40% lower marginal unit cost, automatically passing savings directly to gross margin.
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-500/20">
              <span className="text-xs font-medium text-muted-foreground">Counterfactual Outcome:</span>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹15.3 Cr <span className="text-xs font-normal text-emerald-600">(+₹2.8 Cr Net Lift)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metric Comparison Table */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Counterfactual Metric Comparison (5 Key Pillars)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metricComparison.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="text-xs text-muted-foreground line-through font-mono">{item.actual}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {item.counterfactual}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-emerald-500 pt-0.5">{item.delta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
