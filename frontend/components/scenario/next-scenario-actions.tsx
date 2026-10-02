import * as React from "react";
import Link from "next/link";
import {
  RotateCcw,
  BarChart2,
  FileText,
  ArrowUpRight,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  primary?: boolean;
}

const NEXT_ACTIONS: ScenarioActionItem[] = [
  {
    title: "Decision Replay",
    description: "Rewind historical decisions and compare what happened against alternative counterfactuals.",
    href: "/replay",
    icon: RotateCcw,
  },
  {
    title: "Decision Optimizer",
    description: "Find mathematically optimal decision levers under strict budget and regulatory constraints.",
    href: "/optimizer",
    icon: BarChart2,
    primary: true,
  },
  {
    title: "Decision Registry",
    description: "Draft, govern, and submit the simulated scenario configuration for multi-executive sign-off.",
    href: "/decisions",
    icon: FileText,
  },
];

interface NextScenarioActionsProps {
  className?: string;
}

export function NextScenarioActions({ className }: NextScenarioActionsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Compass className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Scenario-to-Decision Operating Flow
        </h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Replay → Scenario Lab → Optimizer → Governed Decision
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {NEXT_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex flex-col justify-between rounded-lg border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring space-y-3",
                action.primary
                  ? "border-primary/60 bg-primary/5 hover:border-primary hover:bg-primary/10 shadow-xs"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "rounded-md p-2",
                    action.primary
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    action.primary ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>

              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    action.primary ? "text-primary font-bold" : "text-foreground"
                  )}
                >
                  {action.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
