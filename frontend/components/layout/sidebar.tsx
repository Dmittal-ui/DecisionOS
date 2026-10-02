"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION, APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  getOpportunityRepository,
  getDecisionRepository,
} from "@/lib/repositories";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [oppCount, setOppCount] = React.useState<number | null>(null);
  const [pendingDecisionCount, setPendingDecisionCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const oppRepo = getOpportunityRepository();
        const decRepo = getDecisionRepository();

        const [opps, decStats] = await Promise.all([
          oppRepo.getOpportunities().catch(() => []),
          decRepo.getDecisionSummaryStats().catch(() => null),
        ]);

        if (cancelled) return;

        if (Array.isArray(opps)) {
          // Count active/new opportunities
          const activeOpps = opps.filter((o) =>
            ["active", "new", "identified", "investigating"].includes(o.status || "")
          ).length;
          setOppCount(activeOpps > 0 ? activeOpps : opps.length);
        }

        if (decStats && typeof decStats.pending === "number") {
          setPendingDecisionCount(decStats.pending);
        } else {
          // Fallback query if summary stats format differs
          const decs = await decRepo.getDecisions().catch(() => []);
          if (Array.isArray(decs)) {
            const pending = decs.filter((d) =>
              ["under_review", "proposed"].includes(d.status)
            ).length;
            setPendingDecisionCount(pending);
          }
        }
      } catch {
        // Silently preserve clean UI without fake counts
      }
    }

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  const getDynamicBadge = (href: string, staticBadge?: string): { text: string; variant: "enterprise" | "secondary" | "warning" } | null => {
    if (href === "/opportunities") {
      if (oppCount !== null && oppCount > 0) {
        return { text: `${oppCount} New`, variant: "enterprise" };
      }
      return null;
    }
    if (href === "/decisions") {
      if (pendingDecisionCount !== null && pendingDecisionCount > 0) {
        return { text: `${pendingDecisionCount} Pending`, variant: "warning" };
      }
      return null;
    }
    if (staticBadge) {
      return { text: staticBadge, variant: "secondary" };
    }
    return null;
  };

  const coreNav = MAIN_NAVIGATION.filter((n) => n.category === "core");
  const intelligenceNav = MAIN_NAVIGATION.filter(
    (n) => n.category === "intelligence"
  );
  const governanceNav = MAIN_NAVIGATION.filter(
    (n) => n.category === "governance"
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-16" : "w-64",
        "h-screen sticky top-0 shrink-0 z-30"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-foreground">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Intelligence OS
              </span>
            </div>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Core Operations
            </p>
          )}
          <nav className="space-y-1">
            {coreNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const badgeInfo = getDynamicBadge(item.href, item.badge);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.title}</span>
                      {badgeInfo && (
                        <Badge
                          variant={badgeInfo.variant}
                          className="ml-auto text-[9px] px-1 py-0 h-4"
                        >
                          {badgeInfo.text}
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Intelligence Engines */}
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Engines & Simulations
            </p>
          )}
          <nav className="space-y-1">
            {intelligenceNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const badgeInfo = getDynamicBadge(item.href, item.badge);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.title}</span>
                      {badgeInfo && (
                        <Badge
                          variant={badgeInfo.variant}
                          className="ml-auto text-[9px] px-1 py-0 h-4"
                        >
                          {badgeInfo.text}
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Governance & DNA */}
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Governance & DNA
            </p>
          )}
          <nav className="space-y-1">
            {governanceNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const badgeInfo = getDynamicBadge(item.href, item.badge);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.title}</span>
                      {badgeInfo && (
                        <Badge
                          variant={badgeInfo.variant}
                          className="ml-auto text-[9px] px-1 py-0 h-4"
                        >
                          {badgeInfo.text}
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Enterprise System Status Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="rounded-md border border-border/70 bg-card p-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-foreground">
                Engine Active
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                99.98% SLA
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Autonomous agents operational
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
