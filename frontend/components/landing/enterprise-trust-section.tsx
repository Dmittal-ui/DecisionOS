import { ShieldCheck, UserCheck, Eye, Binary, Lock, Scale, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EnterpriseTrustSection() {
  const pillars = [
    {
      title: "Human-in-the-Loop Governance",
      description: "High-impact decisions require explicit executive quorum approvals before automated execution triggers.",
      icon: UserCheck,
    },
    {
      title: "Deterministic Calculation Core",
      description: "Simulation curves and Pareto frontiers are computed using deterministic mathematical solvers with zero hallucination.",
      icon: Binary,
    },
    {
      title: "Complete Explainability",
      description: "Every recommendation provides decomposing causal factors, parameter elasticity weights, and confidence intervals.",
      icon: Eye,
    },
    {
      title: "Immutable Decision Provenance",
      description: "Every decision record is time-stamped and encrypted with input telemetry snapshots and stakeholder notes.",
      icon: Lock,
    },
    {
      title: "Uncertainty & VaR Visibility",
      description: "Never rely on naive point estimates. Projections showcase full P10/P50/P90 probability envelopes and downside exposure.",
      icon: Scale,
    },
    {
      title: "Regulatory Audit Readiness",
      description: "Built for SOC2 Type II, ISO 27001, and corporate compliance audit frameworks out of the box.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border/60 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Enterprise Grade Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Engineered on Deterministic Trust
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            High-stakes business operations cannot rely on black-box predictions. DecisionOS separates reasoning from mathematical computation.
          </p>
        </div>

        {/* Central Architectural Principle Callout */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center space-y-2 shadow-md relative overflow-hidden">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-primary">
              Core Architectural Doctrine
            </span>
            <blockquote className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
              &ldquo;The language model reasons and explains; deterministic code calculates.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto pt-1">
              AI provides hypothesis synthesis and semantic summarization. Pure deterministic mathematical engines evaluate constraints, Monte Carlo runs, and financial models.
            </p>
          </div>
        </div>

        {/* 6 Trust Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-card p-5 space-y-3 hover:border-border transition-all shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
