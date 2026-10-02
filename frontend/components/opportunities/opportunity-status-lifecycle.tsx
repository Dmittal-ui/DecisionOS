import * as React from "react";
import { Check, Circle, ArrowRight } from "lucide-react";
import { OpportunityStatus } from "@/types/opportunity";
import { cn } from "@/lib/utils";

interface LifecycleStep {
  status: OpportunityStatus;
  label: string;
  description: string;
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    status: "detected",
    label: "Detected",
    description: "System identified a business signal requiring attention",
  },
  {
    status: "in_investigation",
    label: "Investigating",
    description: "Root cause analysis and evidence gathering in progress",
  },
  {
    status: "decision_ready",
    label: "Ready for Decision",
    description: "Investigation complete — decision options prepared",
  },
  {
    status: "executed",
    label: "Approved & Executed",
    description: "Decision actioned with full audit trail",
  },
];

const STATUS_ORDER: OpportunityStatus[] = [
  "detected",
  "in_investigation",
  "decision_ready",
  "executed",
];

function getStepIndex(status: OpportunityStatus): number {
  if (status === "dismissed") return -1;
  return STATUS_ORDER.indexOf(status);
}

interface StepIndicatorProps {
  stepIndex: number;
  currentIndex: number;
  dismissed: boolean;
}

function StepIndicator({ stepIndex, currentIndex, dismissed }: StepIndicatorProps) {
  const completed = !dismissed && stepIndex < currentIndex;
  const active = !dismissed && stepIndex === currentIndex;
  const future = dismissed || stepIndex > currentIndex;

  if (completed) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm">
        <Check className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (active) {
    return (
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted">
      <Circle
        className={cn(
          "h-3 w-3",
          future ? "text-muted-foreground/40" : "text-muted-foreground"
        )}
      />
    </div>
  );
}

interface OpportunityStatusLifecycleProps {
  status: OpportunityStatus;
  className?: string;
}

export function OpportunityStatusLifecycle({
  status,
  className,
}: OpportunityStatusLifecycleProps) {
  const dismissed = status === "dismissed";
  const currentIndex = getStepIndex(status);

  return (
    <div className={cn("rounded-lg border border-border/60 bg-card p-4", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Decision Path
      </p>

      {dismissed ? (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            This opportunity has been{" "}
            <span className="font-semibold">dismissed</span> and is no longer
            active in the decision queue.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const completed = idx < currentIndex;
            const active = idx === currentIndex;

            return (
              <React.Fragment key={step.status}>
                <div className="flex sm:flex-col items-start sm:items-center gap-2 sm:gap-1.5 sm:flex-1 min-w-0">
                  {/* Indicator + connector row (mobile horizontal) */}
                  <div className="flex flex-col sm:flex-row items-center gap-0">
                    <StepIndicator
                      stepIndex={idx}
                      currentIndex={currentIndex}
                      dismissed={dismissed}
                    />
                  </div>

                  {/* Label + description */}
                  <div className="sm:text-center pb-4 sm:pb-0 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-none",
                        active
                          ? "text-primary"
                          : completed
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5 leading-snug max-w-[140px]",
                        active || completed
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector */}
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <div className="hidden sm:flex items-center self-start mt-3.5 px-1">
                    <ArrowRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        idx < currentIndex
                          ? "text-emerald-500"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
