import { BarChart2, Search, Cpu, CheckCircle2, ArrowRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WhyDecisionOSSection() {
  const comparisonColumns = [
    {
      stage: "Traditional BI",
      coreQuestion: "What happened?",
      focus: "Historical Retrospective Reporting",
      icon: BarChart2,
      badge: "Legacy BI / Dashboards",
      badgeVariant: "neutral" as const,
      capabilities: [
        "Displays historical charts and lagging KPI summaries",
        "Static backward-looking snapshots",
        "Manual dashboard browsing required by analysts",
        "No simulation or counterfactual modeling",
        "No constraint or optimization support",
      ],
      isHighlight: false,
    },
    {
      stage: "Diagnostic Analytics",
      coreQuestion: "Why did it happen?",
      focus: "Exploratory Correlation Analysis",
      icon: Search,
      badge: "Analytics Platforms",
      badgeVariant: "neutral" as const,
      capabilities: [
        "Identifies statistical correlations across historical tables",
        "Ad-hoc manual SQL queries and diagnostic slicing",
        "Explains historical anomalies after revenue loss occurs",
        "Cannot project alternative counterfactual forks",
        "Leaves decision synthesis entirely on human memory",
      ],
      isHighlight: false,
    },
    {
      stage: "DecisionOS",
      coreQuestion: "What should we decide, what happens if we choose differently, and why?",
      focus: "Prescriptive Optimization & Replay",
      icon: Cpu,
      badge: "Decision Intelligence OS",
      badgeVariant: "positive" as const,
      capabilities: [
        "Continuous real-time telemetry scanning for opportunities",
        "Counterfactual historical decision replay to uncover alpha",
        "Monte Carlo stochastic simulations with VaR envelopes",
        "Convex Pareto solvers optimizing under hard constraints",
        "Auditable Decision DNA creating institutional memory",
      ],
      isHighlight: true,
    },
  ];

  return (
    <section id="why-decision-os" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
          Paradigm Shift
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Why DecisionOS?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The enterprise software stack evolved from static dashboards to ad-hoc diagnostic queries. DecisionOS represents the next frontier: closed-loop prescriptive decision intelligence.
        </p>
      </div>

      {/* 3-Column Comparative Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {comparisonColumns.map((col, idx) => {
          const Icon = col.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
                col.isHighlight
                  ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/30 shadow-lg relative"
                  : "border-border/80 bg-card/60"
              }`}
            >
              {col.isHighlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  The DecisionOS Paradigm
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    col.isHighlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={col.badgeVariant} className="text-[10px]">
                    {col.badge}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">{col.stage}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{col.focus}</p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  col.isHighlight
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/20 text-foreground"
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    Core Business Question:
                  </span>
                  <p className="text-xs font-bold leading-snug mt-1">
                    &ldquo;{col.coreQuestion}&rdquo;
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {col.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs">
                      {col.isHighlight ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-2" />
                      )}
                      <span className={col.isHighlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {cap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
