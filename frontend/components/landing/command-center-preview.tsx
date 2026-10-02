"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock-data/dashboard.mock";
import { MOCK_OPPORTUNITIES } from "@/lib/mock-data/opportunities.mock";
import { MOCK_DECISIONS } from "@/lib/mock-data/decisions.mock";
import { formatCurrency } from "@/lib/utils";

export function CommandCenterPreview() {
  const topMetrics = [
    { label: "Net Revenue", value: "₹48.2 Cr", delta: "+14.2%", trend: "up", status: "positive", sub: "Annualized Run Rate" },
    { label: "Gross Profit", value: "₹19.6 Cr", delta: "+18.8%", trend: "up", status: "positive", sub: "40.6% Net Margin" },
    { label: "Daily Orders", value: "14,820", delta: "+6.4%", trend: "up", status: "positive", sub: "99.4% Fulfillment" },
    { label: "Working Inventory", value: "₹6.4 Cr", delta: "-8.2%", trend: "down", status: "positive", sub: "Turnover: 12.4x" },
    { label: "Operating Margin", value: "32.4%", delta: "+3.2%", trend: "up", status: "positive", sub: "EBITDA adjusted" },
    { label: "Business Health", value: "96/100", delta: "+2.0 pts", trend: "up", status: "positive", sub: "Composite Index" },
  ];

  return (
    <section id="command-center" className="py-20 md:py-28 border-t border-border/60 bg-muted/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
              Product Command Center
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Enterprise Operations at a Glance
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Unified real-time visibility across high-level financial health, algorithmic opportunity queues, simulation testbeds, and decision registries.
            </p>
          </div>
          <Button size="sm" className="gap-2 shrink-0 self-start md:self-end" asChild>
            <Link href="/dashboard">
              <span>Open Live Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Enterprise Command Center Mockup Window */}
        <div className="rounded-xl border border-border/80 bg-card shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="h-4 w-px bg-border mx-1" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">DecisionOS Command Center</span>
                <Badge variant="outline" className="text-[10px] py-0 font-mono">GLOBAL APEX CORP</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                Last sync: 12 seconds ago
              </span>
              <Badge variant="positive" className="text-[10px]">ALL SYSTEMS GREEN</Badge>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* 6 Key Operational Metric Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {topMetrics.map((m, idx) => (
                <div key={idx} className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">{m.label}</span>
                  <p className="text-lg font-bold font-mono text-foreground tracking-tight">{m.value}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-500 font-semibold">{m.delta}</span>
                    <span className="text-muted-foreground truncate">{m.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout: Active Opportunities & Recent Decisions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Opportunities Queue */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Discovered Opportunities (12 Active)
                    </h3>
                  </div>
                  <Link href="/opportunities" className="text-xs text-primary hover:underline font-medium">
                    View Radar →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {MOCK_OPPORTUNITIES.slice(0, 2).map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-md border border-border/60 bg-muted/10 p-3 flex items-start justify-between gap-3 hover:border-border transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary">{opp.code}</span>
                          <Badge variant="positive" className="text-[9px] px-1 py-0">
                            {opp.urgency.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate">{opp.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{opp.summary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(opp.impact.netValue)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{opp.impact.confidenceScore}% conf</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Strategic Decisions */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Decision Governance Registry
                    </h3>
                  </div>
                  <Link href="/decisions" className="text-xs text-primary hover:underline font-medium">
                    View Registry →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {MOCK_DECISIONS.map((dec) => (
                    <div
                      key={dec.id}
                      className="rounded-md border border-border/60 bg-muted/10 p-3 flex items-start justify-between gap-3 hover:border-border transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary">{dec.code}</span>
                          <Badge variant="enterprise" className="text-[9px] px-1 py-0">
                            {dec.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate">{dec.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{dec.executiveSummary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {formatCurrency(dec.estimatedValue)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{dec.approvals.length} sign-offs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
