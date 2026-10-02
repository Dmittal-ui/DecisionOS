"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Activity, ShieldCheck, CheckCircle2, TrendingUp, Layers, Sliders, Cpu, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock-data/dashboard.mock";

export function HeroSection() {
  const { kpis, pipeline } = MOCK_DASHBOARD_DATA;

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle Background Radial / Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Autonomous Enterprise Decision Intelligence</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground font-mono">v1.0 Ready</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Turn Business Data Into{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              Better Decisions.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Continuous business monitoring, algorithmic opportunity detection, and root-cause investigation combined with counterfactual replay, Monte Carlo scenario simulation, and constraint-aware Pareto optimization.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button size="lg" className="w-full sm:w-auto gap-2 px-7 text-sm font-semibold shadow-md" asChild>
              <Link href="/dashboard">
                <span>Explore DecisionOS</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 px-7 text-sm font-semibold border-border/80 hover:bg-muted"
              asChild
            >
              <Link href="/dashboard">
                <Activity className="h-4 w-4 text-primary" />
                <span>View Command Center</span>
              </Link>
            </Button>
          </div>

          {/* Trust Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Continuous Telemetry Monitoring
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Deterministic Simulation Math
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              100% Auditable Decision DNA
            </span>
          </div>
        </div>

        {/* Hero Interactive Dashboard Mockup Preview */}
        <div className="mt-12 sm:mt-16 relative">
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-2xl p-3 sm:p-5 overflow-hidden">
            {/* Top Mock Window Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-muted-foreground ml-2 hidden sm:inline">
                  https://app.decisionos.corp/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="positive" className="text-[10px] px-1.5 py-0 h-4">
                  DECISION ENGINE ONLINE
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">
                  SLA 99.98%
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="space-y-4">
              {/* Metric Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/70 bg-background/80 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Value Unlocked</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono text-foreground">$14.8M</span>
                    <Badge variant="positive" className="text-[10px] px-1">+18.4%</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">vs prior period</span>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Decision Velocity</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono text-foreground">4.2 hrs</span>
                    <Badge variant="positive" className="text-[10px] px-1">-32.5%</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">resolution cycle</span>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Predictive Accuracy</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono text-foreground">94.6%</span>
                    <Badge variant="positive" className="text-[10px] px-1">+3.1%</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Monte Carlo variance</span>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Risk Exposure Index</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono text-foreground">12.4%</span>
                    <Badge variant="positive" className="text-[10px] px-1">-8.7%</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">downside VaR</span>
                </div>
              </div>

              {/* Lower Section: Active Opportunity + Scenario Preview */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2 rounded-lg border border-border/70 bg-background/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        Opportunity OPP-9021: Dynamic Price Elasticity Capture
                      </span>
                    </div>
                    <Badge variant="positive" className="text-[10px]">DECISION READY</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Continuous telemetry detected margin expansion vector in Mid-Market SaaS accounts (+8.5% price indexation yields +$3.4M recurring gross profit at 92% confidence).
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +$3,400,000 Net Lift
                    </span>
                    <span className="text-muted-foreground">14 Days Realization</span>
                    <span className="text-muted-foreground font-mono">Confidence: 92%</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-background/80 p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Pareto Optimizer</span>
                      <Badge variant="enterprise" className="text-[10px]">OPTIMAL</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Simplex solver verified 3 hard constraints: Budget ≤ $2M, Margin ≥ 25%.
                    </p>
                  </div>
                  <Button size="sm" variant="subtle" className="w-full mt-3 text-xs gap-1.5" asChild>
                    <Link href="/optimizer">
                      <span>Inspect Solved Frontier</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
