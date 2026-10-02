"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, Plus, CheckCircle2 } from "lucide-react";
import { SavedScenario, DecisionLeverValues } from "@/types/scenario-workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SavedScenariosProps {
  savedScenarios: SavedScenario[];
  onSaveScenario: () => void;
  onLoadScenario: (scenario: SavedScenario) => void;
  saveSuccessMessage?: string;
  className?: string;
}

export function SavedScenarios({
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  saveSuccessMessage,
  className,
}: SavedScenariosProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Saved Scenarios & Iterations
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMessage && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {saveSuccessMessage}
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onSaveScenario}
            className="gap-1.5 h-8 text-xs"
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
            <span>Save Current Configuration</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {savedScenarios.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-2 flex flex-col justify-between hover:border-border transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground">
                  {item.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.createdAt}
                </span>
              </div>

              {/* Lever Snapshot */}
              <div className="pt-2 text-[10px] font-mono text-muted-foreground flex items-center justify-between border-t border-border/30 mt-2">
                <span>Budget: ₹{item.levers.marketingBudget} Cr</span>
                <span>Inv: {item.levers.workingInventory}</span>
                <span>Price: ₹{item.levers.unitPrice}</span>
              </div>

              {/* Outcome Snapshot */}
              <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono text-foreground font-semibold">
                <span>Rev: {item.projectedRevenue}</span>
                <span>Profit: {item.projectedProfit}</span>
                <span>Margin: {item.projectedMargin}</span>
              </div>
            </div>

            <Button
              variant="subtle"
              size="sm"
              onClick={() => onLoadScenario(item)}
              className="w-full text-xs h-7 mt-2"
            >
              Load Configuration
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
