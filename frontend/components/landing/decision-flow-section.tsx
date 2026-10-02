import {
  Activity,
  Search,
  RotateCcw,
  Sliders,
  Cpu,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
} from "lucide-react";

export function DecisionFlowSection() {
  const steps = [
    {
      step: "01",
      title: "Monitor",
      description: "Continuous real-time scanning of business telemetry to spot anomalies, margin leaks, and growth vectors.",
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      step: "02",
      title: "Investigate",
      description: "Decompose root causes with automated causal trees, hypothesis testing, and multi-source evidence correlation.",
      icon: Search,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      step: "03",
      title: "Replay",
      description: "Rewind historical decisions to compare actual results against counterfactual alternative paths to uncover alpha.",
      icon: RotateCcw,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      step: "04",
      title: "Simulate",
      description: "Stress-test controllable variables across 10,000+ Monte Carlo stochastic distributions and risk envelopes.",
      icon: Sliders,
      color: "text-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      step: "05",
      title: "Optimize",
      description: "Execute simplex and convex Pareto solvers to allocate capital while strictly respecting hard enterprise constraints.",
      icon: Cpu,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      step: "06",
      title: "Decide",
      description: "Secure quorum executive sign-offs and trigger deterministic automated execution pipelines with full traceability.",
      icon: CheckCircle2,
      color: "text-teal-500",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      step: "07",
      title: "Audit",
      description: "Store persistent Decision DNA signatures with problem statements, evidence, constraints, and realized outcomes.",
      icon: FileCheck2,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 border-t border-border/60 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
            Closed-Loop Decision Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            The Autonomous Decision Flow
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From raw data anomaly detection to immutable audit trail, DecisionOS standardizes how modern enterprises analyze, model, and execute high-stakes business choices.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-border transition-all group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground/70">
                      {item.step}
                    </span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${item.bg}`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden xl:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/30 pointer-events-none">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
