"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  InvestigationWorkspaceHypothesis,
  InvestigationHypothesisStatus,
  InvestigationEvidenceDirection,
  InvestigationEvidenceStrength,
} from "@/types/investigation-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}

const STATUS_CONFIG: Record<InvestigationHypothesisStatus, StatusConfig> = {
  // "leading" is the backend status for the highest-ranked hypothesis in every
  // investigation case branch (investigation_builder.py sets status="leading").
  // It must be a first-class entry here — any omission causes cfg to be
  // undefined and crashes cfg.borderClass at runtime.
  leading: {
    label: "Leading Hypothesis",
    bgClass: "bg-violet-50 dark:bg-violet-950/20",
    borderClass: "border-violet-400 dark:border-violet-600",
    textClass: "text-violet-700 dark:text-violet-400",
    dotClass: "bg-violet-500",
  },
  strong_evidence: {
    label: "Strong Evidence",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
    borderClass: "border-emerald-300 dark:border-emerald-700",
    textClass: "text-emerald-700 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  moderate_evidence: {
    label: "Moderate Evidence",
    bgClass: "bg-amber-50 dark:bg-amber-950/20",
    borderClass: "border-amber-300 dark:border-amber-700",
    textClass: "text-amber-700 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  weak_evidence: {
    label: "Weak Evidence",
    bgClass: "bg-slate-50 dark:bg-slate-900/20",
    borderClass: "border-slate-200 dark:border-slate-700",
    textClass: "text-slate-500 dark:text-slate-400",
    dotClass: "bg-slate-400",
  },
  under_investigation: {
    label: "Under Investigation",
    bgClass: "bg-blue-50 dark:bg-blue-950/20",
    borderClass: "border-blue-300 dark:border-blue-700",
    textClass: "text-blue-700 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
};

/** Safe accessor — returns a neutral fallback config for any status value not
 *  yet listed in STATUS_CONFIG (guards against future backend enum expansion). */
const FALLBACK_STATUS_CONFIG: StatusConfig = {
  label: "Under Investigation",
  bgClass: "bg-blue-50 dark:bg-blue-950/20",
  borderClass: "border-blue-300 dark:border-blue-700",
  textClass: "text-blue-700 dark:text-blue-400",
  dotClass: "bg-blue-500",
};

function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status as InvestigationHypothesisStatus] ??
    FALLBACK_STATUS_CONFIG
  );
}

// ─── Evidence direction styles ────────────────────────────────────────────────

const EVIDENCE_DIR_STYLES: Record<InvestigationEvidenceDirection, string> = {
  supporting: "text-emerald-600 dark:text-emerald-400",
  contradicting: "text-rose-600 dark:text-rose-400",
  neutral: "text-muted-foreground",
};

const STRENGTH_LABELS: Record<InvestigationEvidenceStrength, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STRENGTH_VARIANT: Record<
  InvestigationEvidenceStrength,
  "positive" | "warning" | "neutral"
> = {
  high: "positive",
  medium: "warning",
  low: "neutral",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface HypothesisCardProps {
  hypothesis: InvestigationWorkspaceHypothesis;
  isSelected: boolean;
  isLeading: boolean;
  onSelect: () => void;
}

export function HypothesisCard({
  hypothesis,
  isSelected,
  isLeading,
  onSelect,
}: HypothesisCardProps) {
  const [expanded, setExpanded] = React.useState(isSelected);
  const cfg = getStatusConfig(hypothesis.status);

  const supporting = hypothesis.evidenceItems.filter(
    (e) => e.direction === "supporting"
  );
  const contradicting = hypothesis.evidenceItems.filter(
    (e) => e.direction === "contradicting"
  );

  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-all duration-200",
        isSelected
          ? "border-primary shadow-md bg-card"
          : cn("border-border/60 bg-card hover:border-border cursor-pointer"),
        cfg.borderClass
      )}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      aria-pressed={isSelected}
      aria-label={`Hypothesis ${hypothesis.label}: ${hypothesis.title}`}
    >
      {/* Card header */}
      <div className={cn("rounded-t-[6px] px-4 py-3", cfg.bgClass)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Label badge */}
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                cfg.dotClass
              )}
            >
              {hypothesis.label}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.textClass)}>
                  {cfg.label}
                </span>
                {isLeading && (
                  <Badge variant="enterprise" className="text-[9px] h-4 px-1.5">
                    Leading
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug mt-0.5">
                {hypothesis.title}
              </h3>
            </div>
          </div>
          <div className="shrink-0 text-right space-y-1">
            <ConfidenceIndicator
              score={hypothesis.confidenceScore}
              size="md"
            />
            <button
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>Collapse <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Expand <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-3">
        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {hypothesis.description}
        </p>

        {/* Affected metrics chips */}
        <div className="flex flex-wrap gap-1">
          {hypothesis.affectedMetrics.map((m) => (
            <Badge key={m} variant="outline" className="text-[10px] font-normal">
              {m}
            </Badge>
          ))}
        </div>

        {/* Evidence counts */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-semibold">{supporting.length}</span>
            <span className="text-muted-foreground">supporting</span>
          </div>
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            <span className="font-semibold">{contradicting.length}</span>
            <span className="text-muted-foreground">contradicting</span>
          </div>
        </div>

        {/* Expanded evidence */}
        {expanded && (
          <div className="space-y-1.5 border-t border-border/40 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence
            </p>
            {hypothesis.evidenceItems.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-2 text-xs py-1.5 border-b border-border/20 last:border-0"
              >
                {ev.direction === "supporting" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-px shrink-0 text-emerald-500" />
                ) : ev.direction === "contradicting" ? (
                  <XCircle className="h-3.5 w-3.5 mt-px shrink-0 text-rose-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("leading-snug", EVIDENCE_DIR_STYLES[ev.direction] ?? "text-muted-foreground")}>
                    {ev.description}
                  </p>
                  {ev.value && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {ev.metric}: {ev.value}
                    </span>
                  )}
                </div>
                <Badge
                  variant={(STRENGTH_VARIANT[ev.strength] ?? "neutral") as "positive" | "warning" | "neutral"}
                  className="text-[9px] h-4 px-1.5 shrink-0"
                >
                  {STRENGTH_LABELS[ev.strength] ?? "Medium"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hypothesis List ──────────────────────────────────────────────────────────

interface HypothesisListProps {
  hypotheses: InvestigationWorkspaceHypothesis[];
  leadingHypothesisId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function HypothesisList({
  hypotheses,
  leadingHypothesisId,
  selectedId,
  onSelect,
  className,
}: HypothesisListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Root-Cause Hypotheses
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {hypotheses.length} competing hypotheses
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        These are competing hypotheses generated by the deterministic investigation engine. Select a hypothesis to explore its supporting evidence.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {hypotheses.map((h) => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            isSelected={selectedId === h.id}
            isLeading={h.id === leadingHypothesisId}
            onSelect={() => onSelect(h.id)}
          />
        ))}
      </div>
    </div>
  );
}
