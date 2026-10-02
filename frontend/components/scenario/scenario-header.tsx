import * as React from "react";
import Link from "next/link";
import {
  FlaskConical,
  Play,
  RotateCcw,
  BarChart2,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimulationStatus } from "@/types/scenario-workspace";
import { cn } from "@/lib/utils";

interface ScenarioHeaderProps {
  scenarioName: string;
  lastSimulatedAt: string;
  status: SimulationStatus;
  statusMessage?: string;
  onRunSimulation: () => void;
  onResetBaseline: () => void;
  className?: string;
}

export function ScenarioHeader({
  scenarioName,
  lastSimulatedAt,
  status,
  statusMessage,
  onRunSimulation,
  onResetBaseline,
  className,
}: ScenarioHeaderProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "running":
        return (
          <Badge variant="warning" className="gap-1 animate-pulse text-[11px]">
            <RotateCcw className="h-3 w-3 animate-spin" />
            Simulating business response...
          </Badge>
        );
      case "complete":
        return (
          <Badge variant="positive" className="gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3" />
            Simulation complete
          </Badge>
        );
      case "error":
        return (
          <Badge variant="critical" className="gap-1 text-[11px]">
            <AlertCircle className="h-3 w-3" />
            Simulation unavailable
          </Badge>
        );
      case "ready":
      default:
        return (
          <Badge variant="enterprise" className="gap-1 text-[11px]">
            <Sparkles className="h-3 w-3" />
            Scenario configured
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/replay">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Decision Replay</span>
          </Link>
        </Button>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Scenario Lab
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-mono text-muted-foreground">
                Flight Simulator Mode
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Scenario Lab & What-If Simulator
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
              Test alternative business decisions before committing them to the real world.
            </p>
          </div>

          {/* Metadata badges & Simulation Disclaimer */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs font-semibold">
              {scenarioName}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Simulated: {lastSimulatedAt}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Running progress notification */}
          {statusMessage && (
            <p className="text-xs font-mono text-amber-600 dark:text-amber-400 animate-pulse">
              ● {statusMessage}
            </p>
          )}

          {/* Crucial Enterprise Guardrail Notice */}
          <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded border border-border/50">
            <Info className="h-3 w-3 text-primary shrink-0" />
            <span>
              <strong>Simulation only</strong> — no production change or business action is executed.
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetBaseline}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Baseline</span>
          </Button>

          <Button
            size="sm"
            onClick={onRunSimulation}
            disabled={status === "running"}
            className="gap-1.5"
          >
            <Play className={cn("h-3.5 w-3.5", status === "running" && "animate-spin")} />
            <span>{status === "running" ? "Simulating..." : "Run Simulation"}</span>
          </Button>

          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/optimizer">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Open Optimizer</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
