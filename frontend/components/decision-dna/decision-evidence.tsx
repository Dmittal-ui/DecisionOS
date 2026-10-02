"use client";

import * as React from "react";
import {
  FileText,
  TrendingUp,
  Percent,
  Gauge,
  Package,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DecisionDNAEvidence } from "@/types/decision-dna";

interface DecisionEvidenceProps {
  evidence: DecisionDNAEvidence[];
  className?: string;
}

export function DecisionEvidence({ evidence, className }: DecisionEvidenceProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getEvidenceIcon = (type: DecisionDNAEvidence["type"]) => {
    switch (type) {
      case "efficiency":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "margin":
        return <Percent className="h-4 w-4 text-blue-500" />;
      case "sensitivity":
        return <Gauge className="h-4 w-4 text-amber-500" />;
      case "inventory":
        return <Package className="h-4 w-4 text-purple-500" />;
      case "price":
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case "telemetry":
      default:
        return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card className={`w-full ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Supporting Evidence & Empirical Signals
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {evidence.length} Telemetry Signals
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Corroborating evidence signals, econometric sensitivity models, and statistical weights synthesized during decision generation.
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted/60">
                      {getEvidenceIcon(item.type)}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {item.signal}
                    </span>
                  </div>
                  <Badge variant="positive" className="text-[10px] font-mono">
                    {item.metricImpact}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                  {item.detail}
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground pl-7">
                  <span>
                    Source: <strong className="text-foreground font-medium">{item.source}</strong>
                  </span>
                  <span className="font-mono text-primary font-semibold">
                    +{item.confidenceContribution}% weight
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
