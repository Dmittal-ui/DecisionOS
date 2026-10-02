import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { OpportunityStatus, OpportunityUrgency } from "@/types/opportunity";
import { DecisionStatus } from "@/types/decision";
import { InvestigationStatus } from "@/types/investigation";

interface StatusBadgeProps {
  status: OpportunityStatus | DecisionStatus | InvestigationStatus | OpportunityUrgency | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      // Urgency
      case "critical":
        return { label: "CRITICAL", variant: "critical" as const };
      case "high":
        return { label: "HIGH", variant: "warning" as const };
      case "medium":
        return { label: "MEDIUM", variant: "neutral" as const };
      case "low":
        return { label: "LOW", variant: "neutral" as const };

      // Opportunity status
      case "detected":
        return { label: "DETECTED", variant: "enterprise" as const };
      case "in_investigation":
        return { label: "IN INVESTIGATION", variant: "warning" as const };
      case "decision_ready":
        return { label: "DECISION READY", variant: "positive" as const };
      case "executed":
        return { label: "EXECUTED", variant: "positive" as const };
      case "dismissed":
        return { label: "DISMISSED", variant: "neutral" as const };

      // Decision status
      case "draft":
        return { label: "DRAFT", variant: "neutral" as const };
      case "pending_approval":
        return { label: "PENDING APPROVAL", variant: "warning" as const };
      case "approved":
        return { label: "APPROVED", variant: "positive" as const };
      case "executing":
        return { label: "EXECUTING", variant: "enterprise" as const };
      case "rejected":
        return { label: "REJECTED", variant: "critical" as const };
      case "rolled_back":
        return { label: "ROLLED BACK", variant: "critical" as const };

      // Investigation status
      case "open":
        return { label: "OPEN", variant: "enterprise" as const };
      case "in_progress":
        return { label: "IN PROGRESS", variant: "warning" as const };
      case "synthesizing":
        return { label: "SYNTHESIZING", variant: "enterprise" as const };
      case "completed":
        return { label: "COMPLETED", variant: "positive" as const };

      default:
        return { label: status.toUpperCase().replace(/_/g, " "), variant: "neutral" as const };
    }
  };

  const { label, variant } = getBadgeConfig();

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
