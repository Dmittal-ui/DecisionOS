import * as React from "react";
import { GitCompare, ArrowRight, CheckCircle2, Sliders } from "lucide-react";
import { ScenarioPreset, ScenarioWorkspaceData } from "@/types/scenario-workspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioComparisonProps {
  currentWorkspace: ScenarioWorkspaceData;
  allPresets: ScenarioPreset[];
  allWorkspaces: Record<string, ScenarioWorkspaceData>;
  className?: string;
}

export function ScenarioComparison({
  currentWorkspace,
  allPresets,
  allWorkspaces,
  className,
}: ScenarioComparisonProps) {
  const [comparePresetId, setComparePresetId] = React.useState<string>(
    currentWorkspace.presetId === "preset_growth" ? "preset_efficiency" : "preset_growth"
  );

  const targetWorkspace = allWorkspaces[comparePresetId] ?? allWorkspaces["preset_baseline"];
  const targetPreset = allPresets.find((p) => p.id === comparePresetId);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-5 space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Scenario vs Scenario Comparative Delta
          </h3>
        </div>

        {/* Target Scenario Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Compare against:</span>
          <select
            value={comparePresetId}
            onChange={(e) => setComparePresetId(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {allPresets
              .filter((p) => p.id !== currentWorkspace.presetId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {currentWorkspace.metrics.map((currentMetric) => {
          const targetMetric = targetWorkspace.metrics.find((m) => m.key === currentMetric.key);
          const currentVal = currentMetric.simulatedValue;
          const targetVal = targetMetric?.simulatedValue ?? "—";

          return (
            <div
              key={currentMetric.key}
              className="rounded-md border border-border/60 bg-muted/20 p-3.5 space-y-2"
            >
              <span className="text-xs font-bold text-foreground block">
                {currentMetric.label}
              </span>

              <div className="space-y-1 pt-1 border-t border-border/30 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">
                    {currentWorkspace.scenarioName.split(" ")[0]}:
                  </span>
                  <span className="font-bold text-primary">{currentVal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">
                    {targetPreset?.name.split(" ")[0]}:
                  </span>
                  <span className="font-bold text-foreground">{targetVal}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
