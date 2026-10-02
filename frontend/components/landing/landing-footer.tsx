import Link from "next/link";
import { Activity, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/60 text-foreground py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-foreground">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Decision Intelligence OS
                </span>
              </div>
            </Link>

            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Autonomous enterprise decision engine. Continuous telemetry monitoring, root-cause investigation, counterfactual replay, Monte Carlo simulations, and constraint-aware Pareto optimization.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Enterprise Grade Security & FedRAMP Ready Architecture</span>
            </div>
          </div>

          {/* Decision Engines Col */}
          <div className="space-y-3 text-xs">
            <p className="font-bold uppercase tracking-wider text-foreground">
              Decision Engines
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/opportunities" className="hover:text-foreground transition-colors">
                  Opportunity Radar
                </Link>
              </li>
              <li>
                <Link href="/investigation" className="hover:text-foreground transition-colors">
                  Root Cause Investigation
                </Link>
              </li>
              <li>
                <Link href="/replay" className="hover:text-foreground transition-colors">
                  Decision Replay
                </Link>
              </li>
              <li>
                <Link href="/scenario" className="hover:text-foreground transition-colors">
                  Scenario Lab
                </Link>
              </li>
              <li>
                <Link href="/optimizer" className="hover:text-foreground transition-colors">
                  Pareto Optimizer
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & DNA Col */}
          <div className="space-y-3 text-xs">
            <p className="font-bold uppercase tracking-wider text-foreground">
              Governance & DNA
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/decisions" className="hover:text-foreground transition-colors">
                  Decision Registry
                </Link>
              </li>
              <li>
                <Link href="/decision-dna" className="hover:text-foreground transition-colors">
                  Organizational DNA
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Executive Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Profile & Workspace
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprise Access */}
          <div className="space-y-3 text-xs">
            <p className="font-bold uppercase tracking-wider text-foreground">
              Authentication & SSO
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Enterprise Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">
                  Request Workspace
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="hover:text-foreground transition-colors">
                  Security Recovery
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DecisionOS Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
