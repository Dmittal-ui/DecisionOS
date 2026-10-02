import { RotateCcw, Sliders, Cpu, Dna, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function CapabilitiesSection() {
  const capabilities = [
    {
      id: "replay",
      title: "Decision Replay",
      badge: "Counterfactual Engine",
      badgeVariant: "enterprise" as const,
      description: "Rewind to any historical business fork in time. Compare what actually happened against what would have occurred under alternative strategic allocations.",
      highlights: [
        "Historical state rewind & telemetry snapshot playback",
        "Deterministic counterfactual P&L variance comparison",
        "Automatic isolation of executive status-quo & recency biases",
      ],
      href: "/replay",
      cta: "Explore Decision Replay",
      icon: RotateCcw,
      accent: "text-amber-500",
    },
    {
      id: "scenario-lab",
      title: "Scenario Lab",
      badge: "Monte Carlo Sandbox",
      badgeVariant: "positive" as const,
      description: "Interactively tune controllable business variables—marketing budget, pricing elasticity, unit inventory—and simulate 10,000+ stochastic multi-factor projections.",
      highlights: [
        "Dynamic sensitivity elasticity driver analysis",
        "P10 (Bearish), P50 (Median), P90 (Bullish) probability distributions",
        "Automated downside Value-at-Risk (VaR) hedging triggers",
      ],
      href: "/scenario",
      cta: "Test Scenario Lab",
      icon: Sliders,
      accent: "text-purple-500",
    },
    {
      id: "optimizer",
      title: "Constraint-Aware Optimization",
      badge: "Pareto Frontier Solver",
      badgeVariant: "enterprise" as const,
      description: "Discover mathematically optimal resource allocations while rigorously enforcing hard operational boundaries: Budget ceilings, Margin floors, and Warehouse capacity.",
      highlights: [
        "Simplex & Convex multi-objective constraint solvers",
        "Instant binding constraint bottleneck identification",
        "Mathematical certainty with zero hallucinated calculations",
      ],
      href: "/optimizer",
      cta: "View Pareto Optimizer",
      icon: Cpu,
      accent: "text-emerald-500",
    },
    {
      id: "decision-dna",
      title: "Organizational Decision DNA",
      badge: "Auditable Governance",
      badgeVariant: "warning" as const,
      description: "Build an enduring, searchable institutional memory. Every decision encapsulates problem context, evidence, hypotheses, constraints, approvals, and realized P&L outcomes.",
      highlights: [
        "Cryptographically signed quorum approval audit trails",
        "Cognitive bias fingerprinting and remediation scoring",
        "SOC2 Type II & regulatory compliance transparency",
      ],
      href: "/decision-dna",
      cta: "Inspect Decision DNA",
      icon: Dna,
      accent: "text-rose-500",
    },
  ];

  return (
    <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
          Enterprise Differentiation
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Engineered for High-Stakes Business Choices
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Traditional BI tools merely report historical numbers. DecisionOS provides the predictive physics, optimization solvers, and governance framework to shape what happens next.
        </p>
      </div>

      {/* 2x2 Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className="border-border/80 bg-card hover:border-border transition-all flex flex-col justify-between shadow-sm group"
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60 border border-border">
                    <Icon className={`h-5 w-5 ${item.accent}`} />
                  </div>
                  <Badge variant={item.badgeVariant} className="text-[11px]">
                    {item.badge}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                  {item.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs group-hover:border-primary/50"
                  asChild
                >
                  <Link href={item.href}>
                    <span>{item.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
