import * as React from "react";
import { Sparkles, Layers, Check } from "lucide-react";
import { ScenarioPreset } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioPresetsProps {
  presets: ScenarioPreset[];
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  className?: string;
}

export function ScenarioPresets({
  presets,
  activePresetId,
  onSelectPreset,
  className,
}: ScenarioPresetsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Scenario Presets
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Quickly load tested operational strategies
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-lg border p-4 text-left transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
              )}
              aria-pressed={isActive}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {preset.name}
                  </span>
                  {preset.badge && (
                    <Badge
                      variant={isActive ? "enterprise" : "outline"}
                      className="text-[9px] px-1.5 py-0 uppercase"
                    >
                      {preset.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-muted-foreground">
                  {preset.tagline}
                </p>

                <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-1 border-t border-border/30 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              {/* Lever Snapshot */}
              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>Budget: ₹{preset.levers.marketingBudget} Cr</span>
                <span>Inv: {preset.levers.workingInventory}</span>
                <span>Price: ₹{preset.levers.unitPrice}</span>
              </div>

              {isActive && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
