import * as React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Database,
  ArrowRight,
  Activity,
  Layers,
  Clock,
} from "lucide-react";
import {
  ReplayEvidence as ReplayEvidenceType,
  ReplayEvidenceProgressionStep,
} from "@/types/replay-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReplayEvidenceProps {
  evidence: ReplayEvidenceType;
  progression: ReplayEvidenceProgressionStep[];
  className?: string;
}

export function ReplayEvidence({
  evidence,
  progression,
  className,
}: ReplayEvidenceProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 3-Column Evidence Pillars */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Supporting Signals */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Supporting Signals
            </h4>
          </div>
          <ul className="space-y-2 text-xs">
            {evidence.supportingSignals.map((signal, idx) => (
              <li key={idx} className="flex items-start gap-2 text-foreground">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span className="leading-relaxed">{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Constraints Preserved */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Constraints Preserved
            </h4>
          </div>
          <ul className="space-y-2 text-xs">
            {evidence.constraintsPreserved.map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-2 text-foreground">
                <span className="text-primary font-bold shrink-0">▰</span>
                <span className="leading-relaxed">{constraint}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Evidence Sources */}
        <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
            <Database className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Evidence Data Sources
            </h4>
          </div>
          <ul className="space-y-2 text-xs">
            {evidence.evidenceSources.map((source, idx) => (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary font-mono text-[10px] shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{source}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── SECONDARY REPLAY EVIDENCE TIMELINE (Progression) ─── */}
      <div className="rounded-lg border border-border/70 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Replay Evidence Chain Progression
            </h4>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Empirical divergence sequence
          </span>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60"
            aria-hidden
          />

          <div className="space-y-4">
            {progression.map((step, idx) => {
              const isLast = idx === progression.length - 1;

              return (
                <div key={step.id} className="relative flex items-start gap-3.5">
                  {/* Step circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold shadow-xs",
                      isLast
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {step.stepNumber}
                  </div>

                  {/* Step content */}
                  <div className="min-w-0 flex-1 pt-0.5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {step.title}
                        </span>
                        {step.metricLabel && step.metricValue && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {step.metricLabel}: <span className="font-bold text-primary ml-1">{step.metricValue}</span>
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {step.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
