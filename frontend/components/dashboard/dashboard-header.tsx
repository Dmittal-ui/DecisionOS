"use client";

import * as React from "react";
import { RefreshCw, Calendar, Sparkles, Activity, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  timeframe: "7D" | "30D" | "90D";
  onTimeframeChange: (tf: "7D" | "30D" | "90D") => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: string;
}

export function DashboardHeader({
  timeframe,
  onTimeframeChange,
  onRefresh,
  isRefreshing,
  lastRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/80 pb-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Executive Command Center
          </h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Badge variant="positive" className="text-xs font-semibold px-2 py-0.5">
              Business Health: Healthy (96/100)
            </Badge>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Monitor enterprise business performance, surface algorithmic decision opportunities, and evaluate what to do next.
        </p>
      </div>

      {/* Controls: Timeframe, Refresh & Export */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
        {/* Live Refresh Status */}
        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline mr-1">
          {lastRefresh}
        </span>

        {/* 7D / 30D / 90D Selector */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          {(["7D", "30D", "90D"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === tf
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 gap-1.5 text-xs border-border"
          title="Refresh real-time telemetry metrics"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>

        {/* Export Brief Button */}
        <Button size="sm" variant="subtle" className="h-8 gap-1.5 text-xs hidden md:inline-flex">
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Export Brief</span>
        </Button>
      </div>
    </div>
  );
}
