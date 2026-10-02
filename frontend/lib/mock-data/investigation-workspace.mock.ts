import { InvestigationWorkspace } from "@/types/investigation-workspace";

// ─── Shared evidence pool ─────────────────────────────────────────────────────

const OPP9021_WORKSPACE: InvestigationWorkspace = {
  id: "ws_opp_1",
  opportunityCode: "OPP-9021",
  opportunityId: "opp_1",
  overallConfidence: 91,
  summary:
    "The strongest current hypothesis is declining Tier-2 channel conversion, supported by stable traffic and falling mobile conversion rates. A secondary competing hypothesis attributes the decline to paid channel cost inflation. These are current leading hypotheses in the mock investigation — not definitive real-world conclusions.",
  leadingHypothesisId: "hyp_a",

  // ─── Signals ───────────────────────────────────────────────────────────────
  signals: [
    // Positive
    {
      id: "sig_1",
      label: "Revenue Growth",
      metric: "Total Revenue",
      value: "+8.4%",
      direction: "positive",
      group: "positive",
      description: "Overall revenue continues to grow YoY despite efficiency decline.",
    },
    {
      id: "sig_2",
      label: "Margin Expansion",
      metric: "Gross Margin",
      value: "+2.4 pp",
      direction: "positive",
      group: "positive",
      description: "Gross margins expanded slightly due to product mix shift.",
    },
    {
      id: "sig_3",
      label: "Order Growth",
      metric: "New Orders",
      value: "+5.1%",
      direction: "positive",
      group: "positive",
      description: "New order count grew across premium segments.",
    },
    // Negative
    {
      id: "sig_4",
      label: "Conversion Decline",
      metric: "Conversion Rate",
      value: "−8.2%",
      direction: "negative",
      group: "negative",
      description: "Tier-2 channel conversion rate fell 8.2% over 60 days.",
    },
    {
      id: "sig_5",
      label: "CAC Increase",
      metric: "Customer Acquisition Cost",
      value: "+14.1%",
      direction: "negative",
      group: "negative",
      description: "CAC increased significantly in paid search and display channels.",
    },
    {
      id: "sig_6",
      label: "Channel Efficiency",
      metric: "Revenue per Paid Channel ₹",
      value: "−11.3%",
      direction: "negative",
      group: "negative",
      description: "Return on ad spend (ROAS) deteriorated across Tier-2 channels.",
    },
    // Monitoring
    {
      id: "sig_7",
      label: "Inventory Levels",
      metric: "Days of Inventory",
      value: "Stable",
      direction: "neutral",
      group: "monitoring",
      description: "Inventory levels remain within normal operating range.",
    },
    {
      id: "sig_8",
      label: "Capacity Utilization",
      metric: "Fulfilment Capacity",
      value: "74%",
      direction: "neutral",
      group: "monitoring",
      description: "Fulfilment capacity is operating at moderate levels with no constraints.",
    },
    {
      id: "sig_9",
      label: "Average Selling Price",
      metric: "ASP",
      value: "Stable",
      direction: "neutral",
      group: "monitoring",
      description: "ASP remains stable — pricing does not appear to be driving decline.",
    },
  ],

  // ─── Hypotheses ────────────────────────────────────────────────────────────
  hypotheses: [
    {
      id: "hyp_a",
      label: "A",
      title: "Tier-2 Conversion Deterioration",
      description:
        "Traffic from Tier-2 acquisition channels remains stable, but the ability to convert that traffic into customers has declined sharply. Mobile conversion in particular has deteriorated, suggesting a funnel friction issue specific to Tier-2 audiences.",
      confidenceScore: 84,
      status: "strong_evidence",
      affectedMetrics: [
        "Conversion Rate (−8.2%)",
        "Mobile Conversion (−11%)",
        "Tier-2 Traffic",
      ],
      supportingSignals: ["sig_4", "sig_5"],
      contradictingSignals: ["sig_1"],
      evidenceItems: [
        {
          id: "ev_a1",
          description: "Conversion rate fell 8.2% across Tier-2 channels over 60-day window.",
          metric: "Conversion Rate",
          value: "−8.2%",
          direction: "supporting",
          strength: "high",
          source: "Sales Telemetry",
        },
        {
          id: "ev_a2",
          description: "Mobile conversion specifically declined 11%, while desktop remained flat.",
          metric: "Mobile Conversion",
          value: "−11%",
          direction: "supporting",
          strength: "high",
          source: "Customer Behavior",
        },
        {
          id: "ev_a3",
          description: "Tier-2 traffic volume remained stable — decline is conversion-specific, not traffic-driven.",
          metric: "Traffic Volume",
          value: "Stable",
          direction: "supporting",
          strength: "medium",
          source: "Marketing Telemetry",
        },
        {
          id: "ev_a4",
          description: "Overall revenue remains positive, limiting severity but not invalidating the hypothesis.",
          metric: "Total Revenue",
          value: "+8.4%",
          direction: "contradicting",
          strength: "medium",
          source: "Sales Telemetry",
        },
      ],
    },
    {
      id: "hyp_b",
      label: "B",
      title: "Acquisition Cost Inflation",
      description:
        "Paid channel cost-per-click (CPC) has increased significantly, inflating customer acquisition costs without a proportional improvement in qualified lead quality. This creates a revenue efficiency gap even as raw revenue grows.",
      confidenceScore: 72,
      status: "moderate_evidence",
      affectedMetrics: [
        "Customer Acquisition Cost (+14.1%)",
        "Paid Channel CPC (+9%)",
        "ROAS (−11.3%)",
      ],
      supportingSignals: ["sig_5", "sig_6"],
      contradictingSignals: ["sig_2"],
      evidenceItems: [
        {
          id: "ev_b1",
          description: "CAC increased 14.1% across paid search and display channels over the same 60-day period.",
          metric: "CAC",
          value: "+14.1%",
          direction: "supporting",
          strength: "high",
          source: "Marketing Telemetry",
        },
        {
          id: "ev_b2",
          description: "Paid search CPC rose 9% following competitor bid escalation.",
          metric: "CPC",
          value: "+9%",
          direction: "supporting",
          strength: "medium",
          source: "Marketing Telemetry",
        },
        {
          id: "ev_b3",
          description: "Campaign efficiency (revenue per ₹ spent) declined 11.3% in the same channels.",
          metric: "ROAS",
          value: "−11.3%",
          direction: "supporting",
          strength: "medium",
          source: "Marketing Telemetry",
        },
        {
          id: "ev_b4",
          description: "Gross margin expanded slightly, suggesting cost inflation has not fully eroded profitability.",
          metric: "Gross Margin",
          value: "+2.4 pp",
          direction: "contradicting",
          strength: "medium",
          source: "Sales Telemetry",
        },
      ],
    },
    {
      id: "hyp_c",
      label: "C",
      title: "Pricing / Product-Mix Effect",
      description:
        "A shift toward lower-ASP products within the Mid-Market segment may be creating a revenue efficiency illusion — revenue grows in volume, but value per customer declines. However, current pricing data weakens this hypothesis.",
      confidenceScore: 46,
      status: "weak_evidence",
      affectedMetrics: [
        "Average Selling Price (Stable)",
        "Premium Product Mix Share",
        "Revenue per Customer",
      ],
      supportingSignals: [],
      contradictingSignals: ["sig_2", "sig_9"],
      evidenceItems: [
        {
          id: "ev_c1",
          description: "Premium product share within Mid-Market has declined 4.2 pp over the quarter.",
          metric: "Premium Product Share",
          value: "−4.2 pp",
          direction: "supporting",
          strength: "medium",
          source: "Sales Telemetry",
        },
        {
          id: "ev_c2",
          description: "Average selling price has remained stable — contradicting the mix-shift hypothesis.",
          metric: "ASP",
          value: "Stable",
          direction: "contradicting",
          strength: "high",
          source: "Sales Telemetry",
        },
        {
          id: "ev_c3",
          description: "Margin expansion (+2.4 pp) is inconsistent with product-mix deterioration scenario.",
          metric: "Gross Margin",
          value: "+2.4 pp",
          direction: "contradicting",
          strength: "high",
          source: "Sales Telemetry",
        },
      ],
    },
  ],

  // ─── Decision Tree ─────────────────────────────────────────────────────────
  treeRoot: {
    id: "node_root",
    label: "Revenue Efficiency Decline",
    metric: "Opportunity",
    value: "OPP-9021",
    status: "root",
    confidenceScore: 91,
    description:
      "Revenue is growing but efficiency is deteriorating — conversion is falling while acquisition cost rises.",
    children: [
      {
        id: "node_conversion",
        label: "Conversion Rate ↓",
        metric: "Conversion Rate",
        value: "−8.2%",
        status: "active",
        confidenceScore: 84,
        hypothesisId: "hyp_a",
        description: "Primary channel conversion has deteriorated over 60 days.",
        children: [
          {
            id: "node_tier2",
            label: "Tier-2 Channels",
            metric: "Traffic",
            value: "Stable",
            status: "supporting",
            confidenceScore: 84,
            hypothesisId: "hyp_a",
            description: "Traffic is stable — the problem is within the funnel, not traffic volume.",
            evidenceIds: ["ev_a3"],
            children: [
              {
                id: "node_mobile",
                label: "Mobile Conversion",
                metric: "Mobile Conversion",
                value: "−11%",
                status: "root_cause_candidate",
                confidenceScore: 84,
                hypothesisId: "hyp_a",
                description: "Mobile conversion fell 11% — strongest current root cause candidate.",
                evidenceIds: ["ev_a1", "ev_a2"],
              },
            ],
          },
        ],
      },
      {
        id: "node_cac",
        label: "CAC Increase ↑",
        metric: "Customer Acquisition Cost",
        value: "+14.1%",
        status: "active",
        confidenceScore: 72,
        hypothesisId: "hyp_b",
        description: "Acquisition cost inflated in paid channels — competing hypothesis.",
        children: [
          {
            id: "node_paid",
            label: "Paid Channels",
            metric: "Channel",
            value: "Search & Display",
            status: "supporting",
            confidenceScore: 72,
            hypothesisId: "hyp_b",
            description: "Paid search and display are the channels where CAC has risen.",
            children: [
              {
                id: "node_cpc",
                label: "CPC Increase",
                metric: "Cost per Click",
                value: "+9%",
                status: "supporting",
                confidenceScore: 72,
                hypothesisId: "hyp_b",
                description: "CPC rose following competitor bid escalation.",
                evidenceIds: ["ev_b2"],
              },
            ],
          },
        ],
      },
      {
        id: "node_mix",
        label: "Product Mix Shift",
        metric: "Premium Share",
        value: "−4.2 pp",
        status: "neutral",
        confidenceScore: 46,
        hypothesisId: "hyp_c",
        description: "Weak evidence — ASP is stable, contradicting this hypothesis.",
        evidenceIds: ["ev_c1"],
      },
    ],
  },

  // ─── Timeline ──────────────────────────────────────────────────────────────
  timeline: [
    {
      id: "tl_1",
      time: "14:32",
      label: "Opportunity Detected",
      description: "Revenue efficiency anomaly identified by continuous monitoring.",
      type: "detection",
    },
    {
      id: "tl_2",
      time: "14:36",
      label: "Revenue Signal Inspected",
      description: "Revenue growth confirmed positive (+8.4%); efficiency gap identified.",
      type: "signal",
    },
    {
      id: "tl_3",
      time: "14:39",
      label: "Conversion Hypothesis Generated",
      description: "Tier-2 conversion deterioration identified as primary hypothesis (84%).",
      type: "hypothesis",
    },
    {
      id: "tl_4",
      time: "14:42",
      label: "CAC Hypothesis Generated",
      description: "Acquisition cost inflation identified as competing hypothesis (72%).",
      type: "hypothesis",
    },
    {
      id: "tl_5",
      time: "14:45",
      label: "Evidence Comparison Completed",
      description: "Pricing/mix hypothesis reviewed and ranked as weak evidence (46%).",
      type: "comparison",
    },
    {
      id: "tl_6",
      time: "14:47",
      label: "Investigation Ready for Decision",
      description: "Root cause analysis complete. Decision options prepared.",
      type: "ready",
    },
  ],

  startedAt: "2026-09-29T09:02:00Z",
  updatedAt: "2026-09-29T09:17:00Z",
};

export const MOCK_INVESTIGATION_WORKSPACES: InvestigationWorkspace[] = [
  OPP9021_WORKSPACE,
];

export function getInvestigationWorkspace(
  opportunityCode: string
): InvestigationWorkspace | undefined {
  return MOCK_INVESTIGATION_WORKSPACES.find(
    (w) => w.opportunityCode === opportunityCode
  );
}

/** Default workspace when no opportunity is specified */
export const DEFAULT_INVESTIGATION_WORKSPACE = OPP9021_WORKSPACE;
