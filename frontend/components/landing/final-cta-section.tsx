import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-card to-background p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-2xl relative">
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Enterprise Decision Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Move From Reporting What Happened to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Deciding What Happens Next.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Eliminate cognitive bias, simulate multi-factor business scenarios, and deploy constraint-aware Pareto decisions with mathematical certainty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button size="lg" className="w-full sm:w-auto gap-2 px-8 text-sm font-semibold shadow-lg" asChild>
              <Link href="/dashboard">
                <span>Enter DecisionOS</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 px-8 text-sm font-semibold border-border hover:bg-muted"
              asChild
            >
              <Link href="/dashboard">
                <Activity className="h-4 w-4 text-primary" />
                <span>Explore the Command Center</span>
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6 text-xs text-muted-foreground border-t border-border/50 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              SOC2 Type II Certified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              SAML 2.0 / SSO Ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
