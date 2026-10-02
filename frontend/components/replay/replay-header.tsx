import * as React from "react";
import Link from "next/link";
import {
  RotateCcw,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReplayStatus } from "@/types/replay-workspace";
import { cn } from "@/lib/utils";

interface ReplayHeaderProps {
  decisionTitle: string;
  decisionCode: string;
  decisionDate: string;
  decisionStatus: string;
  replayStatus: ReplayStatus;
  statusMessage?: string;
  onRunReplay: () => void;
  className?: string;
}

export function ReplayHeader({
  decisionTitle,
  decisionCode,
  decisionDate,
  decisionStatus,
  replayStatus,
  statusMessage,
  onRunReplay,
  className,
}: ReplayHeaderProps) {
  const getReplayStatusBadge = () => {
    switch (replayStatus) {
      case "running":
        return (
          <Badge variant="warning" className="gap-1 animate-pulse text-[11px]">
            <RotateCcw className="h-3 w-3 animate-spin" />
            Reconstructing...
          </Badge>
        );
      case "complete":
        return (
          <Badge variant="positive" className="gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3" />
            Replay Completed
          </Badge>
        );
      case "error":
        return (
          <Badge variant="critical" className="gap-1 text-[11px]">
            <AlertCircle className="h-3 w-3" />
            Replay Unavailable
          </Badge>
        );
      case "idle":
      default:
        return (
          <Badge variant="neutral" className="gap-1 text-[11px]">
            <Clock className="h-3 w-3" />
            Ready to Replay
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </Link>
        </Button>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Counterfactual Engine
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-mono text-muted-foreground">
                {decisionCode}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Decision Replay
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
              Rewind a historical decision and compare what happened with what could have happened.
            </p>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs font-medium">
              {decisionTitle}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{decisionDate}</span>
            </div>
            <Badge variant="enterprise" className="text-[10px] uppercase">
              {decisionStatus}
            </Badge>
            {getReplayStatusBadge()}
          </div>

          {/* Running progress notification */}
          {statusMessage && (
            <p className="text-xs font-mono text-amber-600 dark:text-amber-400 animate-pulse">
              ● {statusMessage}
            </p>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunReplay}
            disabled={replayStatus === "running"}
            className="gap-1.5"
          >
            <RotateCcw
              className={cn("h-3.5 w-3.5", replayStatus === "running" && "animate-spin")}
            />
            <span>{replayStatus === "running" ? "Replaying..." : "Run Replay"}</span>
          </Button>

          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/scenario">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Open Scenario Lab</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
