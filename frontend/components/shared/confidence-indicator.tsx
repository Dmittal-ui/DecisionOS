import * as React from "react";
import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ConfidenceIndicator({
  score,
  showLabel = true,
  size = "md",
  className,
}: ConfidenceIndicatorProps) {
  const getProgressColor = () => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getTextColor = () => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 75) return "text-blue-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div
        className={cn(
          "relative w-16 overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full transition-all duration-500", getProgressColor())}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "font-mono font-semibold tracking-tight",
            getTextColor(),
            size === "sm" ? "text-[11px]" : "text-xs"
          )}
        >
          {score}%
        </span>
      )}
    </div>
  );
}
