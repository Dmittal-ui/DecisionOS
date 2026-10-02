import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Telemetry Synchronization Error",
  description = "An unexpected error occurred while fetching optimization parameters. The decision engine was unable to complete the request.",
  errorCode = "ERR_ENGINE_TIMEOUT_504",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-destructive/30 bg-destructive/5 text-foreground", className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {errorCode && (
          <div className="rounded border border-border bg-background px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
            Code: {errorCode}
          </div>
        )}

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Operation</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
