"use client";

import * as React from "react";
import { Sliders, RotateCcw, Info, DollarSign, Package, Tag } from "lucide-react";
import {
  DecisionLeverConfig,
  DecisionLeverValues,
} from "@/types/scenario-workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DecisionLeverPanelProps {
  configs: DecisionLeverConfig[];
  values: DecisionLeverValues;
  onChange: (key: keyof DecisionLeverValues, value: number) => void;
  onResetLever: (key: keyof DecisionLeverValues) => void;
  className?: string;
}

export function DecisionLeverPanel({
  configs,
  values,
  onChange,
  onResetLever,
  className,
}: DecisionLeverPanelProps) {
  const getLeverIcon = (key: keyof DecisionLeverValues) => {
    switch (key) {
      case "marketingBudget":
        return <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "workingInventory":
        return <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "unitPrice":
        return <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-5 shadow-sm",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Decision Lever Controls (What-If Parameters)
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Adjust controllable operational variables to project simulated business impacts
        </span>
      </div>

      {/* Grid of Sliders */}
      <div className="grid gap-6 md:grid-cols-3">
        {configs.map((config) => {
          const currentValue = values[config.key];
          const isAtBaseline = currentValue === config.baseline;
          const deltaFromBaseline = currentValue - config.baseline;

          return (
            <div
              key={config.key}
              className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4 flex flex-col justify-between hover:border-border transition-colors"
            >
              {/* Lever Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {getLeverIcon(config.key)}
                    <span className="text-xs font-bold text-foreground">
                      {config.label}
                    </span>
                  </div>

                  <button
                    onClick={() => onResetLever(config.key)}
                    disabled={isAtBaseline}
                    className={cn(
                      "text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-opacity",
                      isAtBaseline ? "opacity-30 cursor-not-allowed" : "opacity-100 underline"
                    )}
                    title="Reset to baseline value"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  {config.description}
                </p>
              </div>

              {/* Large Current Value Readout */}
              <div className="bg-background rounded-md p-3 border border-border/50 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Simulated Value
                  </span>
                  <span className="font-mono text-lg font-bold text-foreground">
                    {config.key === "marketingBudget"
                      ? `₹${currentValue.toFixed(2)} Cr`
                      : config.key === "unitPrice"
                      ? `₹${currentValue}`
                      : `${currentValue.toLocaleString()} units`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Baseline
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {config.key === "marketingBudget"
                      ? `₹${config.baseline.toFixed(2)} Cr`
                      : config.key === "unitPrice"
                      ? `₹${config.baseline}`
                      : `${config.baseline.toLocaleString()} units`}
                  </span>
                </div>
              </div>

              {/* Slider Input Control */}
              <div className="space-y-2 pt-1">
                <div className="relative flex items-center select-none touch-none">
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={currentValue}
                    onChange={(e) =>
                      onChange(config.key, parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={config.label}
                  />
                </div>

                {/* Min & Max Labels */}
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>
                    Min: {config.key === "marketingBudget" ? `₹${config.min} Cr` : config.key === "unitPrice" ? `₹${config.min}` : `${config.min} units`}
                  </span>
                  <span className={cn("font-bold", !isAtBaseline ? "text-primary" : "text-muted-foreground")}>
                    {deltaFromBaseline > 0
                      ? `+${config.key === "marketingBudget" ? deltaFromBaseline.toFixed(2) : deltaFromBaseline} delta`
                      : deltaFromBaseline < 0
                      ? `${config.key === "marketingBudget" ? deltaFromBaseline.toFixed(2) : deltaFromBaseline} delta`
                      : "Matches baseline"}
                  </span>
                  <span>
                    Max: {config.key === "marketingBudget" ? `₹${config.max} Cr` : config.key === "unitPrice" ? `₹${config.max}` : `${config.max} units`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
