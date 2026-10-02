"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Minus,
  Database,
  Search,
} from "lucide-react";
import {
  InvestigationWorkspaceHypothesis,
  InvestigationWorkspaceEvidence,
  InvestigationEvidenceStrength,
} from "@/types/investigation-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Strength badge variant ───────────────────────────────────────────────────

const STRENGTH_CONFIG: Record<
  InvestigationEvidenceStrength,
  { label: string; variant: "positive" | "warning" | "neutral"; pattern: string }
> = {
  high: {
    label: "High",
    variant: "positive",
    pattern: "▰▰▰",
  },
  medium: {
    label: "Medium",
    variant: "warning",
    pattern: "▰▰▱",
  },
  low: {
    label: "Low",
    variant: "neutral",
    pattern: "▰▱▱",
  },
};

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceRow({ ev }: { ev: InvestigationWorkspaceEvidence }) {
  const FALLBACK_STRENGTH_CONFIG = {
    label: "Medium",
    variant: "warning" as const,
    pattern: "▰▰▱",
  };
  const cfg = STRENGTH_CONFIG[ev.strength] ?? FALLBACK_STRENGTH_CONFIG;

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      {/* Direction icon */}
      <div className="shrink-0 mt-0.5">
        {ev.direction === "supporting" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Supporting evidence" />
        ) : ev.direction === "contradicting" ? (
          <XCircle className="h-4 w-4 text-rose-500" aria-label="Contradicting evidence" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" aria-label="Neutral evidence" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs text-foreground leading-snug">{ev.description}</p>
        {ev.value && ev.metric && (
          <p className="font-mono text-[11px] text-muted-foreground">
            {ev.metric}: <span className="font-bold">{ev.value}</span>
          </p>
        )}
        {ev.source && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Database className="h-2.5 w-2.5" />
            <span>{ev.source}</span>
          </div>
        )}
      </div>

      {/* Strength indicator */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <Badge variant={cfg.variant} className="text-[9px] h-4 px-1.5">
          {cfg.label}
        </Badge>
        <span
          className="text-[9px] tracking-widest text-muted-foreground/50"
          aria-label={`Strength: ${cfg.label}`}
        >
          {cfg.pattern}
        </span>
      </div>
    </div>
  );
}

// ─── Evidence Explorer ────────────────────────────────────────────────────────

interface EvidenceExplorerProps {
  selectedHypothesis: InvestigationWorkspaceHypothesis | null;
  className?: string;
}

export function EvidenceExplorer({
  selectedHypothesis,
  className,
}: EvidenceExplorerProps) {
  const supporting =
    selectedHypothesis?.evidenceItems.filter((e) => e.direction === "supporting") ?? [];
  const contradicting =
    selectedHypothesis?.evidenceItems.filter((e) => e.direction === "contradicting") ?? [];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Evidence Explorer
        </h2>
        {selectedHypothesis ? (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {selectedHypothesis.evidenceItems.length} evidence items for{" "}
            <span className="font-semibold">{selectedHypothesis.title}</span>
          </span>
        ) : (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Select a hypothesis to explore evidence
          </span>
        )}
      </div>

      {!selectedHypothesis ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-10 text-center px-4">
          <Search className="h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            No hypothesis selected
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Select a hypothesis above to explore its supporting and contradicting evidence.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Supporting */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Supporting Evidence
              </h3>
              <span className="ml-auto font-mono text-xs text-emerald-600 dark:text-emerald-400">
                {supporting.length}
              </span>
            </div>
            {supporting.length > 0 ? (
              <div>
                {supporting.map((ev) => (
                  <EvidenceRow key={ev.id} ev={ev} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No supporting evidence found.</p>
            )}
          </div>

          {/* Contradicting */}
          <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Contradictory Evidence
              </h3>
              <span className="ml-auto font-mono text-xs text-rose-600 dark:text-rose-400">
                {contradicting.length}
              </span>
            </div>
            {contradicting.length > 0 ? (
              <div>
                {contradicting.map((ev) => (
                  <EvidenceRow key={ev.id} ev={ev} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No contradictory evidence found.</p>
            )}
          </div>

          {/* Data sources — derived from actual evidence items, not a static list */}
          <div className="md:col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data Sources
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                // Collect unique, non-empty source labels from the hypothesis evidence items.
                const sources = Array.from(
                  new Set(
                    selectedHypothesis.evidenceItems
                      .map((ev) => ev.source)
                      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
                  )
                );
                return sources.length > 0 ? (
                  sources.map((src) => (
                    <Badge key={src} variant="outline" className="text-[10px] font-normal">
                      {src}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground">No data sources available</span>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
