"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import {
  Dna,
  ExternalLink,
  Search,
  History,
  FileCheck2,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";
import type { DecisionDNARecord } from "@/types/decision-dna";

interface DecisionDNAHeaderProps {
  record: DecisionDNARecord;
  onExportSummary?: () => void;
}

export function DecisionDNAHeader({
  record,
  onExportSummary,
}: DecisionDNAHeaderProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-5 shadow-sm space-y-4">
      {/* Top Row: DNA ID, Title, Status & Navigation CTAs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
              <Dna className="h-3.5 w-3.5" />
              <span>{record.id}</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <span className="font-mono text-xs text-muted-foreground">
              {record.decisionId}
            </span>
            <Badge
              variant={
                record.status === "approved"
                  ? "positive"
                  : record.status === "modified"
                  ? "enterprise"
                  : record.status === "rejected"
                  ? "critical"
                  : "warning"
              }
              className="text-[10px] uppercase font-mono"
            >
              {record.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {record.type}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {record.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Decided {new Date(record.decisionDate).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Owner: <strong className="text-foreground font-medium">{record.owner}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span>Confidence:</span>
              <ConfidenceIndicator score={record.confidence} size="sm" />
            </span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/opportunities`}>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <span>Opportunity ({record.opportunityId})</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Button>
          </Link>

          <Link href="/investigation">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Search className="h-3 w-3" />
              <span>Investigation</span>
            </Button>
          </Link>

          <Link href="/replay">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <History className="h-3 w-3" />
              <span>Replay</span>
            </Button>
          </Link>

          <Link href="/decisions">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <FileCheck2 className="h-3 w-3" />
              <span>Registry</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
