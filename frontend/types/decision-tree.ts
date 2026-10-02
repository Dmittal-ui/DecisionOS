export type NodeType = "root" | "decision_branch" | "condition_split" | "outcome" | "risk_mitigation";

export interface DecisionNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  probability?: number; // 0 - 1
  expectedPayoff?: number;
  riskScore?: number;
  childrenNodeIds: string[];
  attributes?: Record<string, string | number | boolean>;
}

export interface DecisionEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface DecisionTree {
  id: string;
  title: string;
  decisionId?: string;
  rootNodeId: string;
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  optimalPathNodeIds: string[];
  calculatedExpectedValue: number;
  confidenceInterval: {
    min: number;
    max: number;
  };
  createdAt: string;
  updatedAt: string;
}
