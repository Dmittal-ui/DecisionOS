"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkflowStage {
  title: string;
  stepNumber: number;
  href: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
}

const DEFAULT_WORKFLOW: WorkflowStage[] = [
  { stepNumber: 1, title: "1. Monitor", href: "/dashboard" },
  { stepNumber: 2, title: "2. Opportunities", href: "/opportunities" },
  { stepNumber: 3, title: "3. Investigate", href: "/investigation" },
  { stepNumber: 4, title: "4. Replay", href: "/replay" },
  { stepNumber: 5, title: "5. Simulate", href: "/scenario" },
  { stepNumber: 6, title: "6. Optimize", href: "/optimizer" },
  { stepNumber: 7, title: "7. Decide", href: "/decisions" },
  { stepNumber: 8, title: "8. DNA", href: "/decision-dna" },
];

interface WorkflowStepBannerProps {
  currentStep: number;
  stageName: string;
  summary: string;
  actionGuidance: string;
  className?: string;
}

export function WorkflowStepBanner({
  currentStep,
  stageName,
  summary,
  actionGuidance,
  className,
}: WorkflowStepBannerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/70 backdrop-blur-sm p-3.5 sm:p-4 text-xs transition-all shadow-sm",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active Stage Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Compass className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xs sm:text-sm">
                Stage {currentStep} of 8: {stageName}
              </span>
              <span className="hidden sm:inline-block rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                Decision Pipeline
              </span>
            </div>
            <p className="text-muted-foreground text-xs max-w-2xl line-clamp-1">
              {summary}
            </p>
          </div>
        </div>

        {/* Right: Action Guidance Callout & Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-[11px]">
            <span className="font-bold text-foreground">Action:</span>
            <span className="text-muted-foreground">{actionGuidance}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 bg-muted/20"
            title={isExpanded ? "Hide workflow sequence" : "Show workflow sequence"}
          >
            <span className="hidden sm:inline">{isExpanded ? "Hide Steps" : "Show Steps"}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Pipeline Steps Strip */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {DEFAULT_WORKFLOW.map((stage) => {
              const isCurrent = stage.stepNumber === currentStep;
              const isPast = stage.stepNumber < currentStep;

              return (
                <Link
                  key={stage.stepNumber}
                  href={stage.href}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all",
                    isCurrent
                      ? "border-primary/50 bg-primary/10 text-primary font-bold shadow-xs"
                      : isPast
                      ? "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border"
                      : "border-transparent bg-transparent text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <span className="truncate">{stage.title}</span>
                  {isPast && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 ml-1 opacity-70" />}
                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
