"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import type { GraphModel, GraphNode, GraphNodeType } from "@/workspace";
import { COLOR_MAP } from "@/lib/constants";
import { EmptyState } from "./EmptyState";

interface GraphTabProps {
  graph: GraphModel;
}

const TYPE_COLOR: Record<GraphNodeType, string> = {
  workspace: "#8C1232",
  mission: "#7C5CBF",
  milestone: "#F0B429",
  task: "#3B82C4",
  note: "#3FA66B",
  resource: "#666666",
  journal: "#C13E6B",
};

const TYPE_RADIUS: Record<GraphNodeType, number> = {
  workspace: 4.4,
  mission: 3,
  milestone: 1.8,
  task: 1.8,
  note: 2,
  resource: 2,
  journal: 2,
};

/** Module 9 — a lightweight, deterministic knowledge graph of the workspace. */
export function GraphTab({ graph }: GraphTabProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n] as const)),
    [graph.nodes],
  );

  // Neighbours of the selected node, for highlight.
  const connected = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected]);
    for (const e of graph.edges) {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    }
    return set;
  }, [selected, graph.edges]);

  if (graph.nodes.length <= 1) {
    return (
      <EmptyState
        icon={<Share2 className="h-8 w-8" />}
        title="Nothing connected yet."
        hint="Add missions, tasks, notes and resources — the graph draws the relationships between them."
      />
    );
  }

  const color = (n: GraphNode) => (n.color ? COLOR_MAP[n.color].dot : TYPE_COLOR[n.type]);
  const px = (x: number) => 50 + x * 44;
  const py = (y: number) => 50 + y * 44;
  const dim = (id: string) => selected !== null && !connected.has(id);

  const selectedNode = selected ? nodeById.get(selected) ?? null : null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-card p-2">
        <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label="Knowledge graph">
          {graph.edges.map((e, i) => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            if (!from || !to) return null;
            const faded = selected !== null && !(connected.has(e.from) && connected.has(e.to));
            return (
              <line
                key={i}
                x1={px(from.x)}
                y1={py(from.y)}
                x2={px(to.x)}
                y2={py(to.y)}
                stroke="currentColor"
                className="text-line"
                strokeWidth={0.3}
                opacity={faded ? 0.25 : 0.7}
              />
            );
          })}
          {graph.nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${px(n.x)} ${py(n.y)})`}
              className="cursor-pointer"
              opacity={dim(n.id) ? 0.35 : 1}
              onClick={() => setSelected((s) => (s === n.id ? null : n.id))}
            >
              <circle
                r={TYPE_RADIUS[n.type]}
                fill={color(n)}
                stroke="#fff"
                strokeWidth={0.4}
              />
              {(n.type === "workspace" || n.type === "mission" || selected === n.id) && (
                <text
                  y={TYPE_RADIUS[n.type] + 2.6}
                  textAnchor="middle"
                  className="fill-ink"
                  style={{ fontSize: n.type === "workspace" ? 3 : 2.4 }}
                >
                  {n.label.length > 18 ? `${n.label.slice(0, 17)}…` : n.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
        {(["workspace", "mission", "task", "note", "resource", "journal"] as GraphNodeType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5 capitalize">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t] }} />
            {t}
          </span>
        ))}
      </div>

      {selectedNode && (
        <p className="text-[13px] text-ink">
          <span className="text-ink-muted capitalize">{selectedNode.type}:</span> {selectedNode.label}
        </p>
      )}
    </div>
  );
}
