import * as React from "react";
import Link from "next/link";
import {
  FlaskConical,
  BarChart3,
  FileText,
  Dna,
  ArrowUpRight,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NextActionOption {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  primary?: boolean;
}

const NEXT_ACTIONS: NextActionOption[] = [
  {
    title: "Scenario Lab",
    description: "Model prospective what-if experiments using live multi-variable sliders and parameters.",
    href: "/scenario",
    icon: FlaskConical,
    primary: true,
  },
  {
    title: "Decision Optimizer",
    description: "Find the mathematically optimal decision under strict resource and regulatory constraints.",
    href: "/optimizer",
    icon: BarChart3,
  },
  {
    title: "Decision Registry",
    description: "Audit the historical governance approvals, sign-offs, and compliance logs for this action.",
    href: "/decisions",
    icon: FileText,
  },
  {
    title: "Decision DNA",
    description: "Inspect organizational heuristics, risk biases, and synthesized cognitive learnings.",
    href: "/decision-dna",
    icon: Dna,
  },
];

interface NextReplayActionsProps {
  className?: string;
}

export function NextReplayActions({ className }: NextReplayActionsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Compass className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Next Decision Actions
        </h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Continue through the DecisionOS operating loop
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
