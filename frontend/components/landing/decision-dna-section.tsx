"use client";

import Link from "next/link";
import { Dna, ShieldCheck, ArrowRight, FileCheck, CheckCircle2, Lock, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function DecisionDNASection() {
  return (
    <section id="decision-dna" className="py-20 md:py-28 border-t border-border/60 bg-muted/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Institutional Memory & Provenance
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Traceable Decision DNA Records
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Never wonder why a choice was made. Every decision encapsulates the exact problem context, telemetry evidence, simulations, constraints, quorum approvals, and realized outcomes.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start md:self-end" asChild>
            <Link href="/decision-dna">
              <span>Inspect Decision DNA</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Compact Decision DNA Card Preview */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border/80 bg-card shadow-xl overflow-hidden">
            {/* DNA Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Dna className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Decision DNA Record</span>
                    <span className="text-[11px] font-mono text-muted-foreground">#DNA-2026-0881</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Signed & Encrypted on Decision Registry</span>
                </div>
              </div>
              <Badge variant="positive" className="text-[10px] px-2 py-0.5">
                EXECUTION VERIFIED
              </Badge>
            </div>

            {/* DNA Body Content */}
            <div className="p-6 space-y-5">
              {/* Decision Title */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Strategic Decision
                </span>
                <h3 className="text-xl font-bold text-foreground">
                  Reallocate Low-Efficiency Paid Marketing Spend
                </h3>
              </div>

              {/* Grid of Context, Evidence, Constraints & Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Problem Statement */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Problem Identified
                  </span>
                  <p className="text-xs font-medium text-foreground">
                    Paid customer acquisition revenue efficiency declining in Tier-2 channels over 60-day window.
                  </p>
                </div>

                {/* Evidence */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Telemetry Evidence
                  </span>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      Conversion ↓ 8.2%
                    </span>
                    <span className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      CAC ↑ 14.1%
                    </span>
                  </div>
                </div>

                {/* Enforced Constraint */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Governing Constraint
                  </span>
                  <p className="text-xs font-mono font-semibold text-foreground">
                    Total SBU Monthly Budget ≤ ₹2.0 Cr
                  </p>
                  <p className="text-[10px] text-muted-foreground">Guaranteed minimum brand awareness impressions preserved.</p>
                </div>

                {/* Action Taken */}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Approved Action
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    Reduce low-conversion campaign allocation by 12% and route to high-margin Enterprise expansion.
                  </p>
                </div>
              </div>

              {/* Stakeholder Sign-Offs Footer */}
              <div className="rounded-lg border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">Executive Quorum Sign-Off: </span>
                    <span className="text-muted-foreground">Alexandra Chen (CSOO) & David Thorne (CFO)</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Timestamp: 2026-09-29 10:45:00 UTC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
