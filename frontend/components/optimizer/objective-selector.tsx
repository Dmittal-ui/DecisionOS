"use client";

import { Target, TrendingUp, DollarSign, Percent, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OptimizerObjectiveOption, OptimizerObjectiveKey } from "@/types/optimizer-workspace";

interface ObjectiveSelectorProps {
  objectives: OptimizerObjectiveOption[];
  selectedObjective: OptimizerObjectiveKey;
  onSelect: (key: OptimizerObjectiveKey) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  DollarSign,
  Percent,
  Package,
};

export function ObjectiveSelector({
  objectives,
  selectedObjective,
  onSelect,
  disabled = false,
}: ObjectiveSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Optimization Objective</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {objectives.map((opt) => {
          const Icon = iconMap[opt.icon] || Target;
          const isSelected = selectedObjective === opt.key;
          return (
            <Card
              key={opt.key}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected ? "ring-2 ring-primary border-transparent" : "border-border",
                disabled && "pointer-events-none opacity-50 grayscale"
              )}
              onClick={() => !disabled && onSelect(opt.key)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                  {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <CardTitle className="mt-4 text-base">{opt.label}</CardTitle>
                <CardDescription className="text-xs">{opt.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
