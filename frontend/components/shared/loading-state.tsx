import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "cards" | "table" | "spinner" | "detail";
  message?: string;
  count?: number;
  className?: string;
}

export function LoadingState({
  variant = "cards",
  message = "Synthesizing decision intelligence models...",
  count = 4,
  className,
}: LoadingStateProps) {
  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-3",
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
          className
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="p-5 pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3 rounded-lg border border-border p-4", className)}>
        <div className="flex justify-between items-center pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
