"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Users,
  TrendingUp,
  Zap,
  RotateCcw,
  AlertCircle,
  BarChart3,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { OpportunityStatusLifecycle } from "@/components/opportunities/opportunity-status-lifecycle";
import { getOpportunityRepository } from "@/lib/repositories";
import { Opportunity } from "@/types/opportunity";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatImpactValue(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
  return `₹${val.toLocaleString()}`;
}

// ─── mock per-opportunity evidence signals ───────────────────────────────────

interface EvidenceSignal {
  label: string;
  detail: string;
  severity: "critical" | "high" | "medium";
}

const EVIDENCE_MAP: Record<string, EvidenceSignal[]> = {
  opp_1: [
    {
      label: "Conversion Rate Drop",
      detail: "−8.2% over 60-day rolling window across Tier-2 channels",
      severity: "critical",
    },
    {
      label: "Customer Acquisition Cost Spike",
      detail: "+14.1% CAC increase in Paid Search & Display",
      severity: "critical",
    },
    {
      label: "Pipeline Velocity Slowdown",
      detail: "Avg deal close time increased from 18 to 24 days",
      severity: "high",
    },
    {
      label: "Direct Sales Contribution Decline",
      detail: "Direct sales share fell from 42% to 36% in the same period",
      severity: "medium",
    },
  ],
  opp_2: [
    {
      label: "Safety Stock Overage",
      detail: "Western hubs hold 31% excess safety stock vs. demand models",
      severity: "high",
    },
    {
      label: "Working Capital Lock-up",
      detail: "₹84 L in inventory not turning within target cycle",
      severity: "high",
    },
    {
      label: "Rebalancing Feasibility",
      detail: "Express fulfillment capacity available across 3 facilities",
      severity: "medium",
    },
  ],
  opp_3: [
    {
      label: "API Invocation Decline",
      detail: "34 enterprise healthcare accounts show >30% API call drop",
      severity: "critical",
    },
    {
      label: "Renewal Risk Index",
      detail: "Behavioral telemetry scores 26 accounts as high-risk renewals",
      severity: "high",
    },
    {
      label: "Support Ticket Volume",
      detail: "Healthcare verticals show 2.1× support ticket rate vs. average",
      severity: "medium",
    },
  ],
  opp_4: [
    {
      label: "Propensity Model Score",
      detail: "82% willingness-to-pay signal for real-time risk add-ons",
      severity: "high",
    },
    {
      label: "Tier-1 Banking Engagement",
      detail: "Risk API usage up 28% in the last 30 days",
      severity: "medium",
    },
  ],
};

// ─── mock "why it matters" reasoning ────────────────────────────────────────

const WHY_MAP: Record<string, string[]> = {
  opp_1: [
    "Revenue efficiency decline in mid-market SaaS is a leading indicator of broader competitive pressure or positioning misalignment.",
    "A simultaneous conversion drop and CAC increase suggests that current channel spend is not reaching the right buyer profile — increasing cost without proportional return.",
    "If not addressed within the 14-day realization window, the compounding effect on pipeline velocity could extend ARR attainment timelines by 1–2 quarters.",
  ],
  opp_2: [
    "Excess safety stock in western distribution hubs represents trapped working capital that could be redeployed into higher-yield operational priorities.",
    "Rebalancing now avoids the Q4 peak-season risk of stockouts in under-served eastern hubs while freeing ₹84 L in idle inventory.",
    "This is a low-risk, high-certainty optimization — demand models confirm current buffer exceeds 60-day historical demand variance.",
  ],
  opp_3: [
    "Healthcare B2B accounts exhibit high switching costs, making early churn intervention significantly more cost-effective than re-acquisition.",
    "The 34 at-risk accounts represent approximately ₹1.97 Cr of ARR. If even 40% churn, the revenue impact would exceed acquisition costs by a 3× multiplier.",
    "A targeted intervention — proactive success check-ins, SLA commitment, and integration support — can recover engagement before contract renewal dates.",
  ],
  opp_4: [
    "Tier-1 banking clients with high real-time risk API usage represent the highest-value cross-sell opportunity in the current portfolio.",
    "Dynamic pricing for risk scoring add-ons is feasible given existing billing infrastructure and would not require product changes.",
    "The 45-day realization window aligns with the upcoming banking sector Q1 budget refresh cycle.",
  ],
};

// ─── severity color helper ────────────────────────────────────────────────

const SEVERITY_STYLES = {
  critical:
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  high: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  medium:
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
};

// ─── section wrapper ─────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── 404 state ───────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <AppLayout>
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="rounded-full border border-dashed border-border/60 p-5">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Opportunity Not Found
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              This opportunity may have been resolved, dismissed, or the link is
              incorrect.
            </p>
          </div>
          <Button asChild>
            <Link href="/opportunities">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to Opportunity Center
            </Link>
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [opportunity, setOpportunity] = React.useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const opportunityRepo = React.useMemo(() => getOpportunityRepository(), []);

  React.useEffect(() => {
    let isMounted = true;
    if (id) {
      opportunityRepo.getOpportunityById(id).then((opp) => {
        if (isMounted) {
          setOpportunity(opp);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [id, opportunityRepo]);

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="py-24 text-center text-sm text-muted-foreground">
            Loading opportunity...
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!opportunity) {
    return <NotFound />;
  }

  const rawSignals = (opportunity as any).signals;
  const evidence: EvidenceSignal[] = Array.isArray(rawSignals) && rawSignals.length > 0
    ? rawSignals.map((s: any) => ({
        label: s.label || s.metric || "Telemetry Signal",
        detail: s.description || `${s.metric || "Metric"}: ${s.value || ""}`,
        severity: (s.group === "negative" ? "critical" : s.direction === "negative" ? "high" : "medium") as "critical" | "high" | "medium",
      }))
    : (EVIDENCE_MAP[opportunity.id] ?? EVIDENCE_MAP[opportunity.code] ?? []);

  const whyMatters = WHY_MAP[opportunity.id] ?? WHY_MAP[opportunity.code] ?? [
    opportunity.summary,
    `Projected net economic value of ${formatImpactValue(opportunity.impact.netValue)} within a ${opportunity.impact.timeToRealizationDays}-day realization window.`,
    `Algorithmic telemetry confidence score assessed at ${opportunity.impact.confidenceScore}%.`,
  ];

  return (
    <AppLayout>
      <PageContainer maxWidth="default">
        {/* Back nav */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="h-3.5 w-3.5" />
              Opportunity Center
            </Link>
          </Button>
        </div>

        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {opportunity.code}
              </span>
              <StatusBadge status={opportunity.urgency} />
              <StatusBadge status={opportunity.status} />
              <Badge variant="outline" className="text-[10px] capitalize">
                {opportunity.category.replace(/_/g, " ")}
              </Badge>
            </div>
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {opportunity.title}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {opportunity.summary}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button size="sm" className="gap-1.5" asChild>
              <Link href={`/investigation?opportunity=${opportunity.code}`}>
                <Zap className="h-3.5 w-3.5" />
                Investigate
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/replay">
                <RotateCcw className="h-3.5 w-3.5" />
                Replay Decision
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/optimizer">
                <BarChart3 className="h-3.5 w-3.5" />
                Optimize
              </Link>
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column — 2/3 wide */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview */}
            <Section icon={FileText} title="Overview">
              <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    {
                      label: "Detected",
                      value: formatRelativeTime(opportunity.detectedAt),
                    },
                    {
                      label: "Detection Date",
                      value: formatDate(opportunity.detectedAt),
                    },
                    {
                      label: "Expires",
                      value: opportunity.expiresAt
                        ? formatDate(opportunity.expiresAt)
                        : "—",
                    },
                    {
                      label: "Owner",
                      value: opportunity.ownerName ?? "Unassigned",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {opportunity.affectedSegments.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Affected Segments
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.affectedSegments.map((seg) => (
                        <Badge key={seg} variant="secondary" className="text-[10px]">
                          {seg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {opportunity.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Evidence signals */}
            {evidence.length > 0 && (
              <Section icon={AlertCircle} title="Evidence Signals">
                <div className="space-y-2">
                  {evidence.map((signal, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm",
                        SEVERITY_STYLES[signal.severity]
                      )}
                    >
                      <AlertCircle className="h-4 w-4 mt-px shrink-0" />
                      <div>
                        <p className="font-semibold text-xs">{signal.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{signal.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Why it matters */}
            {whyMatters.length > 0 && (
              <Section icon={TrendingUp} title="Why It Matters">
                <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                  {whyMatters.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-px" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Decision path lifecycle */}
            <Section icon={ExternalLink} title="Decision Path">
              <OpportunityStatusLifecycle status={opportunity.status} />
            </Section>
          </div>

          {/* Right column — 1/3 wide — Impact panel */}
          <div className="space-y-4">
            <Section icon={BarChart3} title="Business Impact">
              <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
                {/* Net Value */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Projected Net Value
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatImpactValue(opportunity.impact.netValue)}
                  </p>
                </div>

                {/* Revenue */}
                {opportunity.impact.projectedRevenue > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Projected Revenue
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {formatImpactValue(opportunity.impact.projectedRevenue)}
                    </p>
                  </div>
                )}

                {/* Cost Reduction */}
                {opportunity.impact.costReduction > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cost Reduction
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatImpactValue(opportunity.impact.costReduction)}
                    </p>
                  </div>
                )}

                <div className="border-t border-border/40 pt-3 space-y-3">
                  {/* Confidence */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Confidence Score
                    </p>
                    <ConfidenceIndicator
                      score={opportunity.impact.confidenceScore}
                      size="md"
                    />
                  </div>

                  {/* Time to realization */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {opportunity.impact.timeToRealizationDays}-day realization window
                    </span>
                  </div>

                  {/* Expiry warning */}
                  {opportunity.expiresAt && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Expires {formatRelativeTime(opportunity.expiresAt)}</span>
                    </div>
                  )}

                  {/* Owner */}
                  {opportunity.ownerName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{opportunity.ownerName}</span>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Quick actions */}
            <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </p>
              <Button size="sm" className="w-full gap-1.5" asChild>
                <Link href={`/investigation?opportunity=${opportunity.code}`}>
                  <Zap className="h-3.5 w-3.5" />
                  Start Investigation
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                <Link href="/replay">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Replay Past Decision
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                <Link href="/optimizer">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Run Optimizer
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                <Link href="/decisions">
                  <FileText className="h-3.5 w-3.5" />
                  Create Decision
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
