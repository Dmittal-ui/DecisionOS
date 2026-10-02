import * as React from "react";
import Link from "next/link";
import {
  RotateCcw,
  FlaskConical,
  BarChart3,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  variant: "primary" | "default";
}

const ACTIONS: ActionItem[] = [
  {
    label: "Replay",
    description:
      "Review the historical decision associated with this issue and understand what was decided previously.",
    href: "/replay",
    icon: RotateCcw,
    variant: "default",
  },
  {
    label: "Simulate",
    description:
      "Test alternative decisions in the Scenario Lab before committing to a course of action.",
    href: "/scenario",
    icon: FlaskConical,
    variant: "primary",
  },
  {
    label: "Optimize",
    description:
      "Find feasible decisions under operational and financial constraints with the Decision Optimizer.",
    href: "/optimizer",
    icon: BarChart3,
    variant: "default",
  },
  {
    label: "Decision Registry",
    description:
      "Review governed decisions, approval history, and execution audit trails.",
    href: "/decisions",
    icon: FileText,
    variant: "default",
  },
];

interface NextDecisionActionsProps {
  className?: string;
}

export function NextDecisionActions({ className }: NextDecisionActionsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Next Decision Actions
        </h2>
      </div>

      <p className="text-xs text-muted-foreground">
        Investigation complete. Choose the next step in the DecisionOS workflow.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex flex-col gap-2 rounded-lg border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                action.variant === "primary"
                  ? "border-primary/60 bg-primary/5 hover:border-primary hover:bg-primary/10"
                  : "border-border/60 bg-card hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "rounded-md p-2",
                    action.variant === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    action.variant === "primary"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    action.variant === "primary" ? "text-primary" : "text-foreground"
                  )}
                >
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
