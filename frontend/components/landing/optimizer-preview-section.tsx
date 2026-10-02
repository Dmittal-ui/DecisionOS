"use client";

import Link from "next/link";
import { Cpu, ArrowRight, ShieldCheck, CheckCircle2, Zap, Sliders, Target, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MOCK_OPTIMIZATION_RESULT } from "@/lib/mock-data/optimizer.mock";
import { formatCurrency } from "@/lib/utils";

export function OptimizerPreviewSection() {
  const opt = MOCK_OPTIMIZATION_RESULT;

  return (
    <section id="optimizer" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Mathematical Certainty
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Constraint-Aware Pareto Optimization
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Finding optimal business choices without violating reality. The optimizer runs convex solvers to maximize objectives while strictly respecting hard budget, margin, and capacity guardrails.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start md:self-end" asChild>
          <Link href="/optimizer">
            <span>Explore Optimizer</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Optimizer Visual Blueprint */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xl space-y-8">
        {/* Top Objective & Solver Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/70 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Primary Objective:</span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Maximize Gross Profit</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simplex solver evaluated 14,850 continuous parameter permutations in 842ms
              </p>
            </div>
          </div>
          <Badge variant="positive" className="self-start sm:self-auto text-xs px-2.5 py-1 font-mono">
            STATUS: GLOBAL OPTIMAL FOUND
          </Badge>
        </div>

        {/* 2-Column: Hard Constraints vs Recommended Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hard Constraints & Policies (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Enforced Hard Constraints
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px]">NON-NEGOTIABLE</Badge>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>Operating Budget Cap</span>
                  <Badge variant="positive" className="text-[9px]">SATISFIED</Badge>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">Budget ≤ ₹2.0 Cr</p>
                <p className="text-[11px] text-muted-foreground">Optimal point consumes ₹1.82 Cr (₹18L buffer saved)</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>Minimum Gross Margin Floor</span>
                  <Badge variant="positive" className="text-[9px]">BINDING</Badge>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">Margin ≥ 25.0%</p>
                <p className="text-[11px] text-muted-foreground">Active constraint boundary: Solved at 28.4% gross margin</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>Customer Churn Ceiling</span>
                  <Badge variant="positive" className="text-[9px]">SATISFIED</Badge>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">Annual Churn ≤ 3.5%</p>
                <p className="text-[11px] text-muted-foreground">Econometric retention curve holds churn at 2.8%</p>
              </div>
            </div>
          </div>

          {/* Right Column: Recommended Allocation Shift (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recommended Resource Reallocation
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +14.8% Projected Profit Lift
              </span>
            </div>

            <div className="space-y-3">
              {opt.allocations.map((a) => (
                <div key={a.id} className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">{a.segmentName}</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        a.recommendedDelta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {a.recommendedDelta > 0 ? "Increase Allocation: +" : "Reduce Allocation: "}
                      {formatCurrency(a.recommendedDelta)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Baseline: {formatCurrency(a.currentAllocation)}</span>
                    <span className="font-semibold text-foreground">
                      Optimal Target: {formatCurrency(a.optimizedAllocation)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (a.optimizedAllocation / 15000000) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
