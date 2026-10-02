"use client";

import * as React from "react";
import Link from "next/link";
import { Sliders, ArrowRight, Play, Sparkles, RefreshCw, BarChart3, TrendingUp, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ScenarioLabSection() {
  // Frontend-only interactive demonstration state
  const [marketingBudget, setMarketingBudget] = React.useState(1.4); // in Millions (₹1.0M - ₹2.0M)
  const [inventoryUnits, setInventoryUnits] = React.useState(950); // 500 - 1500
  const [unitPrice, setUnitPrice] = React.useState(105); // ₹90 - ₹120

  // Reactive frontend mock calculation for demonstration
  const simulatedRevenue = React.useMemo(() => {
    const baseRev = 4.2; // Crores
    const budgetFactor = (marketingBudget - 1.0) * 0.8;
    const priceFactor = (unitPrice - 90) * 0.025;
    const inventoryFactor = (inventoryUnits - 500) * 0.0008;
    return (baseRev + budgetFactor + priceFactor + inventoryFactor).toFixed(2);
  }, [marketingBudget, inventoryUnits, unitPrice]);

  const simulatedProfit = React.useMemo(() => {
    const rev = parseFloat(simulatedRevenue);
    const cost = (marketingBudget * 0.35) + (inventoryUnits * 0.0012) + 1.2;
    return (rev - cost).toFixed(2);
  }, [simulatedRevenue, marketingBudget, inventoryUnits]);

  const simulatedMargin = React.useMemo(() => {
    const rev = parseFloat(simulatedRevenue);
    const prof = parseFloat(simulatedProfit);
    return ((prof / rev) * 100).toFixed(1);
  }, [simulatedRevenue, simulatedProfit]);

  return (
    <section id="scenario-lab" className="py-20 md:py-28 border-t border-border/60 bg-muted/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Interactive Simulation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Scenario Lab & Stochastic Stress-Testing
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Experiment with controllable levers. Move the sliders to test how variations in marketing allocation, buffer stock, and pricing affect projected enterprise margins in real time.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start md:self-end" asChild>
            <Link href="/scenario">
              <span>Open Scenario Lab</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Interactive Scenario Sandbox Card */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xl space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Controllable Variable Sliders (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-foreground">Controllable Levers</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">3 PARAMETERS</Badge>
              </div>

              {/* Slider 1: Marketing Budget */}
              <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Marketing Budget</span>
                  <span className="font-mono font-bold text-primary">₹{marketingBudget.toFixed(1)}M</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>₹1.0M (Base)</span>
                  <span>₹1.5M</span>
                  <span>₹2.0M (Cap)</span>
                </div>
              </div>

              {/* Slider 2: Inventory */}
              <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Working Inventory</span>
                  <span className="font-mono font-bold text-primary">{inventoryUnits} Units</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="1500"
                  step="50"
                  value={inventoryUnits}
                  onChange={(e) => setInventoryUnits(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>500 Min</span>
                  <span>1,000</span>
                  <span>1,500 Max</span>
                </div>
              </div>

              {/* Slider 3: Price */}
              <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Target Unit Price</span>
                  <span className="font-mono font-bold text-primary">₹{unitPrice}</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="120"
                  step="1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>₹90</span>
                  <span>₹105</span>
                  <span>₹120</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Simulated parameters adjust confidence envelope instantaneously.</span>
              </div>
            </div>

            {/* Right Column: Simulated Output Distribution (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">Simulated P&L Projections</h3>
                </div>
                <Badge variant="positive" className="text-[10px]">10,000 MONTE CARLO ITERATIONS</Badge>
              </div>

              {/* Reactive Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <span className="text-[11px] font-medium text-muted-foreground">Projected Revenue</span>
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{simulatedRevenue} Cr</p>
                  <span className="text-[10px] text-emerald-500 font-medium">Stochastic mean</span>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <span className="text-[11px] font-medium text-muted-foreground">Projected EBITDA</span>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">₹{simulatedProfit} Cr</p>
                  <span className="text-[10px] text-emerald-500 font-medium">Net profit estimate</span>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <span className="text-[11px] font-medium text-muted-foreground">Projected Margin</span>
                  <p className="text-2xl font-bold font-mono text-primary mt-1">{simulatedMargin}%</p>
                  <span className="text-[10px] text-muted-foreground">EBITDA efficiency</span>
                </div>
              </div>

              {/* Monte Carlo Percentile Box */}
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>Confidence Percentiles (VaR Bounds)</span>
                  <span className="text-[11px] font-mono text-muted-foreground">Standard Dev: ±₹0.38 Cr</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="rounded border border-border/60 bg-card p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-rose-500">P10 (Bearish)</span>
                    <p className="text-base font-bold font-mono text-foreground">
                      ₹{(parseFloat(simulatedRevenue) * 0.88).toFixed(2)} Cr
                    </p>
                    <p className="text-[10px] text-muted-foreground">Downside risk floor</p>
                  </div>
                  <div className="rounded border border-primary/40 bg-primary/5 p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-primary font-bold">P50 (Median Base)</span>
                    <p className="text-base font-bold font-mono text-primary">
                      ₹{simulatedRevenue} Cr
                    </p>
                    <p className="text-[10px] text-muted-foreground">Most probable case</p>
                  </div>
                  <div className="rounded border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-emerald-500">P90 (Bullish)</span>
                    <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{(parseFloat(simulatedRevenue) * 1.14).toFixed(2)} Cr
                    </p>
                    <p className="text-[10px] text-muted-foreground">Optimistic ceiling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
