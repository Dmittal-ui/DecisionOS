"use client";

import * as React from "react";
import Link from "next/link";
import { OpportunityRadarPoint } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpportunityRadarWidgetProps {
  points: OpportunityRadarPoint[];
}

// Map urgency/impact level to a quadrant position.
// Quadrant grid:  TL = high impact, low urgency
//                 TR = high impact, high urgency  ← critical focus
//                 BL = low impact, low urgency
//                 BR = low impact, high urgency
type Quadrant = "TL" | "TR" | "BL" | "BR";

function getQuadrant(p: OpportunityRadarPoint): Quadrant {
  const highImpact = p.impactLevel === "high";
  const highUrgency = p.urgencyLevel === "high";
  if (highImpact && highUrgency) return "TR";
  if (highImpact && !highUrgency) return "TL";
  if (!highImpact && highUrgency) return "BR";
  return "BL";
}

function formatImpactShort(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(1)} Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(0)} L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(0)}k`;
  return `₹${val}`;
}

const QUADRANT_STYLES: Record<Quadrant, string> = {
  TR: "border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/30 hover:border-rose-500",
  TL: "border-amber-500/30 bg-card/90 hover:border-amber-500",
  BR: "border-border/70 bg-card/90 hover:border-border",
  BL: "border-border/70 bg-card/90 hover:border-border",
};

const QUADRANT_CODE_COLORS: Record<Quadrant, string> = {
  TR: "text-rose-600 dark:text-rose-400",
  TL: "text-amber-500",
  BR: "text-primary",
  BL: "text-muted-foreground",
};

function RadarItem({ point, quadrant }: { point: OpportunityRadarPoint; quadrant: Quadrant }) {
  // Link to investigation if route is set, otherwise to opportunity detail
  const href = point.route ?? `/investigation?opportunity=${point.code}`;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border p-2 shadow-sm transition-all text-left max-w-[150px] group",
        QUADRANT_STYLES[quadrant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-mono font-bold", QUADRANT_CODE_COLORS[quadrant])}>
          {point.code}
        </span>
        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
          {formatImpactShort(point.netValue)}
        </span>
      </div>
      <p className="text-[10px] font-semibold text-foreground truncate group-hover:text-primary">
        {point.title}
      </p>
      {quadrant === "TR" && (
        <span className="text-[8px] text-rose-500 uppercase font-bold block">Critical Focus</span>
      )}
    </Link>
  );
}

function EmptySlot() {
  return (
    <div className="rounded-lg border border-dashed border-border/40 p-2 max-w-[150px] flex items-center justify-center">
      <span className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-wider">No signal</span>
    </div>
  );
}

export function OpportunityRadarWidget({ points }: OpportunityRadarWidgetProps) {
  // Distribute points into quadrants, taking the first match per quadrant
  const byQuadrant = React.useMemo(() => {
    const map: Partial<Record<Quadrant, OpportunityRadarPoint>> = {};
    for (const p of points) {
      const q = getQuadrant(p);
      if (!map[q]) map[q] = p;
    }
    return map;
  }, [points]);

  return (
    <Card className="border-border/80 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">Opportunity Radar Matrix</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            IMPACT × URGENCY
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          2D decision space mapping financial upside against resolution criticality.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col justify-between">
        {/* 2×2 Quadrant Grid */}
        <div className="relative rounded-xl border border-border/80 bg-muted/10 p-3.5 h-64 flex flex-col justify-between overflow-hidden">
          {/* Axis Labels */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70 bg-card px-2 py-0.5 rounded border border-border/60">
            HIGH IMPACT (↑)
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70 bg-card px-2 py-0.5 rounded border border-border/60">
            LOW IMPACT (↓)
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70 bg-card px-1 py-0.5 rounded border border-border/60">
            LOW URGENCY (←)
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70 bg-card px-1 py-0.5 rounded border border-border/60">
            HIGH URGENCY (→)
          </div>

          {/* Crosshair Dividers */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full border-b border-border/60 border-dashed" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-full border-r border-border/60 border-dashed" />
          </div>

          {/* Quadrant Items — data-driven from props */}
          <div className="grid grid-cols-2 grid-rows-2 h-full w-full p-4 gap-4 z-10">
            {/* Top-Left: High Impact, Low Urgency */}
            <div className="flex flex-col justify-start items-start p-2">
              {byQuadrant.TL
                ? <RadarItem point={byQuadrant.TL} quadrant="TL" />
                : <EmptySlot />}
            </div>

            {/* Top-Right: High Impact, High Urgency (Critical Focus) */}
            <div className="flex flex-col justify-start items-end p-2">
              {byQuadrant.TR
                ? <RadarItem point={byQuadrant.TR} quadrant="TR" />
                : <EmptySlot />}
            </div>

            {/* Bottom-Left: Low Impact, Low Urgency */}
            <div className="flex flex-col justify-end items-start p-2">
              {byQuadrant.BL
                ? <RadarItem point={byQuadrant.BL} quadrant="BL" />
                : <EmptySlot />}
            </div>

            {/* Bottom-Right: Low Impact, High Urgency */}
            <div className="flex flex-col justify-end items-end p-2">
              {byQuadrant.BR
                ? <RadarItem point={byQuadrant.BR} quadrant="BR" />
                : <EmptySlot />}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 text-[11px] text-muted-foreground">
          <span>Click any quadrant vector to open full telemetry trace.</span>
          <Link href="/opportunities" className="text-primary hover:underline font-semibold flex items-center gap-1">
            <span>Explore All</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
