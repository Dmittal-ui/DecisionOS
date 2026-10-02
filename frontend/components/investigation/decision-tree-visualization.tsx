"use client";

import * as React from "react";
import {
  InvestigationTreeNode,
  InvestigationTreeNodeStatus,
} from "@/types/investigation-workspace";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { cn } from "@/lib/utils";

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 140;
const NODE_H = 76;
const H_GAP = 36; // horizontal gap between siblings
const V_GAP = 60; // vertical gap between levels

// ─── Status styling ───────────────────────────────────────────────────────────

interface NodeStyle {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
}

const NODE_STYLES: Record<InvestigationTreeNodeStatus, NodeStyle> = {
  root: {
    bg: "#1e40af",
    border: "#3b82f6",
    text: "#ffffff",
    dot: "#93c5fd",
    label: "Root",
  },
  active: {
    bg: "#92400e",
    border: "#f59e0b",
    text: "#ffffff",
    dot: "#fcd34d",
    label: "Active",
  },
  supporting: {
    bg: "#064e3b",
    border: "#10b981",
    text: "#ffffff",
    dot: "#6ee7b7",
    label: "Supporting",
  },
  conflicting: {
    bg: "#7f1d1d",
    border: "#ef4444",
    text: "#ffffff",
    dot: "#fca5a5",
    label: "Conflicting",
  },
  neutral: {
    bg: "#1e293b",
    border: "#475569",
    text: "#94a3b8",
    dot: "#64748b",
    label: "Neutral",
  },
  root_cause_candidate: {
    bg: "#4c1d95",
    border: "#8b5cf6",
    text: "#ffffff",
    dot: "#c4b5fd",
    label: "Root Cause?",
  },
};

/** Safe accessor — returns a neutral fallback style for any tree node status
 *  value not yet listed in NODE_STYLES (guards against future backend enum
 *  expansion without crashing the SVG visualization). */
const FALLBACK_NODE_STYLE: NodeStyle = {
  bg: "#1e293b",
  border: "#475569",
  text: "#94a3b8",
  dot: "#64748b",
  label: "Unknown",
};

function getNodeStyle(status: string): NodeStyle {
  return (
    NODE_STYLES[status as InvestigationTreeNodeStatus] ?? FALLBACK_NODE_STYLE
  );
}

// ─── Tree layout engine ───────────────────────────────────────────────────────

interface PositionedNode {
  node: InvestigationTreeNode;
  x: number; // center x
  y: number; // top y
  width: number; // subtree width
  children: PositionedNode[];
}

function layoutNode(
  node: InvestigationTreeNode,
  depth: number,
  offsetX: number
): PositionedNode {
  const children = node.children ?? [];
  if (children.length === 0) {
    return {
      node,
      x: offsetX + NODE_W / 2,
      y: depth * (NODE_H + V_GAP),
      width: NODE_W,
      children: [],
    };
  }

  const posChildren: PositionedNode[] = [];
  let curX = offsetX;
  for (const child of children) {
    const pc = layoutNode(child, depth + 1, curX);
    posChildren.push(pc);
    curX += pc.width + H_GAP;
  }
  const totalW = curX - H_GAP - offsetX;
  const cx = posChildren[0].x + (posChildren[posChildren.length - 1].x - posChildren[0].x) / 2;

  return {
    node,
    x: cx,
    y: depth * (NODE_H + V_GAP),
    width: Math.max(totalW, NODE_W),
    children: posChildren,
  };
}

function collectNodes(pn: PositionedNode): PositionedNode[] {
  return [pn, ...pn.children.flatMap(collectNodes)];
}

function collectEdges(
  pn: PositionedNode
): Array<{ x1: number; y1: number; x2: number; y2: number; status: InvestigationTreeNodeStatus }> {
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; status: InvestigationTreeNodeStatus }> = [];
  for (const child of pn.children) {
    edges.push({
      x1: pn.x,
      y1: pn.y + NODE_H,
      x2: child.x,
      y2: child.y,
      status: child.node.status,
    });
    edges.push(...collectEdges(child));
  }
  return edges;
}

// ─── SVG Node ─────────────────────────────────────────────────────────────────

interface SvgNodeProps {
  pn: PositionedNode;
  isSelected: boolean;
  onClick: () => void;
}

function SvgNode({ pn, isSelected, onClick }: SvgNodeProps) {
  const { node, x, y } = pn;
  const style = getNodeStyle(node.status);
  const left = x - NODE_W / 2;

  return (
    <g
      transform={`translate(${left}, ${y})`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={`${node.label}${node.value ? `: ${node.value}` : ""}`}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      {/* Selection ring */}
      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={10}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}
      {/* Node background */}
      <rect
        x={0}
        y={0}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill={style.bg}
        stroke={style.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* Status dot */}
      <circle cx={12} cy={12} r={4} fill={style.dot} />
      {/* Label */}
      <text
        x={NODE_W / 2}
        y={22}
        textAnchor="middle"
        fill={style.text}
        fontSize={11}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {node.label.length > 18 ? node.label.slice(0, 17) + "…" : node.label}
      </text>
      {/* Value */}
      {node.value && (
        <text
          x={NODE_W / 2}
          y={40}
          textAnchor="middle"
          fill={style.dot}
          fontSize={13}
          fontWeight="800"
          fontFamily="ui-monospace, monospace"
        >
          {node.value.length > 12 ? node.value.slice(0, 11) + "…" : node.value}
        </text>
      )}
      {/* Confidence */}
      {node.confidenceScore !== undefined && (
        <text
          x={NODE_W / 2}
          y={58}
          textAnchor="middle"
          fill={style.text}
          fontSize={9}
          opacity={0.7}
          fontFamily="system-ui, sans-serif"
        >
          {node.confidenceScore}% confidence
        </text>
      )}
      {/* Status label (bottom-right) */}
      <text
        x={NODE_W - 6}
        y={NODE_H - 6}
        textAnchor="end"
        fill={style.dot}
        fontSize={8}
        opacity={0.8}
        fontFamily="system-ui, sans-serif"
      >
        {style.label}
      </text>
    </g>
  );
}

// ─── Node Detail Panel ────────────────────────────────────────────────────────

interface NodeDetailPanelProps {
  node: InvestigationTreeNode | null;
  hypotheses: { id: string; title: string }[];
  onClose: () => void;
}

function NodeDetailPanel({ node, hypotheses, onClose }: NodeDetailPanelProps) {
  if (!node) return null;
  const style = getNodeStyle(node.status);
  const linkedHyp = node.hypothesisId
    ? hypotheses.find((h) => h.id === node.hypothesisId)
    : null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3 shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{ background: style.border }}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: style.border }}
            >
              {style.label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs"
          aria-label="Close node detail"
        >
          ✕
        </button>
      </div>

      {node.value && (
        <div>
          <p className="text-[10px] text-muted-foreground">Change / Value</p>
          <p className="font-mono text-lg font-bold text-foreground">{node.value}</p>
        </div>
      )}

      {node.metric && (
        <div>
          <p className="text-[10px] text-muted-foreground">Metric</p>
          <p className="text-xs font-medium text-foreground">{node.metric}</p>
        </div>
      )}

      {node.confidenceScore !== undefined && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
          <ConfidenceIndicator score={node.confidenceScore} size="md" />
        </div>
      )}

      {node.description && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
          {node.description}
        </p>
      )}

      {linkedHyp && (
        <div className="border-t border-border/40 pt-2">
          <p className="text-[10px] text-muted-foreground">Linked Hypothesis</p>
          <p className="text-xs font-semibold text-foreground">{linkedHyp.title}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Decision Tree Component ─────────────────────────────────────────────

interface DecisionTreeVisualizationProps {
  treeRoot: InvestigationTreeNode;
  hypotheses: { id: string; title: string }[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  className?: string;
}

export function DecisionTreeVisualization({
  treeRoot,
  hypotheses,
  selectedNodeId,
  onNodeSelect,
  className,
}: DecisionTreeVisualizationProps) {
  const positioned = React.useMemo(() => layoutNode(treeRoot, 0, 0), [treeRoot]);
  const allNodes = React.useMemo(() => collectNodes(positioned), [positioned]);
  const allEdges = React.useMemo(() => collectEdges(positioned), [positioned]);

  // SVG viewport
  const maxX = Math.max(...allNodes.map((n) => n.x + NODE_W / 2));
  const maxY = Math.max(...allNodes.map((n) => n.y + NODE_H));
  const svgW = maxX + 20;
  const svgH = maxY + 20;

  const selectedNode =
    selectedNodeId ? allNodes.find((n) => n.node.id === selectedNodeId)?.node ?? null : null;

  const edgeColor = (status: InvestigationTreeNodeStatus) =>
    getNodeStyle(status).border;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="3" r="2" />
          <circle cx="3" cy="13" r="2" />
          <circle cx="13" cy="13" r="2" />
          <path d="M8 5v3M8 8l-4 3M8 8l4 3" />
        </svg>
        <h2 className="text-sm font-semibold text-foreground">
          Decision Tree Visualization
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Click a node to inspect
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        {(
          [
            "root",
            "active",
            "supporting",
            "root_cause_candidate",
            "neutral",
          ] as InvestigationTreeNodeStatus[]
        ).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: NODE_STYLES[s].border }}
            />
            <span className="text-muted-foreground">{NODE_STYLES[s].label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* SVG Tree */}
        <div
          className="lg:col-span-2 overflow-x-auto rounded-lg border border-border/60 bg-slate-950 dark:bg-slate-950 p-4"
          style={{ minHeight: svgH + 40 }}
        >
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            aria-label="Decision Tree"
            role="img"
            style={{ display: "block", minWidth: svgW }}
          >
            {/* Edges */}
            {allEdges.map((edge, i) => {
              const midY = (edge.y1 + edge.y2) / 2;
              return (
                <path
                  key={i}
                  d={`M${edge.x1},${edge.y1} C${edge.x1},${midY} ${edge.x2},${midY} ${edge.x2},${edge.y2}`}
                  fill="none"
                  stroke={edgeColor(edge.status)}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              );
            })}

            {/* Nodes */}
            {allNodes.map((pn) => (
              <SvgNode
                key={pn.node.id}
                pn={pn}
                isSelected={selectedNodeId === pn.node.id}
                onClick={() => onNodeSelect(pn.node.id)}
              />
            ))}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              hypotheses={hypotheses}
              onClose={() => onNodeSelect("")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-10 text-center px-4">
              <p className="text-xs font-medium text-muted-foreground">
                Select a node in the tree
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Click any node to view its details, linked hypothesis, and evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
