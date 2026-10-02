import Link from "next/link";
import { Activity, ShieldCheck, CheckCircle2, Sparkles, Binary } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";

export function AuthBranding() {
  const highlights = [
    "Continuous real-time business telemetry monitoring",
    "Counterfactual historical decision replay & alpha isolation",
    "Monte Carlo stochastic simulation & VaR risk bounds",
    "Constraint-aware simplex & Pareto frontier optimization",
    "Cryptographically signed immutable Decision DNA registry",
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between bg-card/60 border-r border-border p-10 xl:p-12 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_20%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Brand Header */}
      <div className="relative space-y-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:bg-primary/90 transition-colors">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-foreground">
                {APP_CONFIG.name}
              </span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                ENTERPRISE
              </Badge>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Autonomous Decision OS
            </span>
          </div>
        </Link>
      </div>

      {/* Main Tagline & Doctrine */}
      <div className="relative space-y-6 my-auto max-w-lg">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Decision Intelligence for the Enterprise
          </span>
          <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
            Turn Business Data Into Better Decisions.
          </h2>
        </div>

        <p className="text-xs xl:text-sm text-muted-foreground leading-relaxed">
          DecisionOS provides the analytical infrastructure for organizations to continuously detect opportunities, investigate root causes, simulate alternatives, optimize under constraints, and govern decisions.
        </p>

        <div className="space-y-2.5 pt-2">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Security Badges */}
      <div className="relative pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>SOC2 Type II & FedRAMP Ready</span>
        </div>
        <span className="font-mono text-[11px]">SLA 99.98%</span>
      </div>
    </div>
  );
}
