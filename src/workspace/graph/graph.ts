/**
 * Module 9 — Knowledge Graph.
 *
 * A lightweight relationship map — no AI, no embeddings. It lays the workspace
 * at the centre, missions on an inner ring, each mission's milestones and linked
 * tasks orbiting it, and loose knowledge (notes, resources, journal) on an outer
 * ring. Coordinates are deterministic and normalized to a [-1, 1] square so the
 * UI can scale them to any SVG viewport.
 */

import type { Workspace } from "@/types";
import type {
  GraphEdge,
  GraphModel,
  GraphNode,
  WorkspaceSnapshot,
} from "@/workspace/models/types";
import {
  GRAPH_MAX_LEAVES_PER_MISSION,
  GRAPH_MAX_LOOSE,
  GRAPH_MAX_MISSIONS,
} from "@/workspace/models/constants";

const MISSION_RING = 0.5;
const LEAF_ORBIT = 0.2;
const LOOSE_RING = 0.92;

/** Build the workspace's knowledge graph. */
export function buildGraph(
  snapshot: WorkspaceSnapshot,
  workspace: Workspace,
): GraphModel {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const rootId = `ws-${workspace.id}`;
  nodes.push({
    id: rootId,
    type: "workspace",
    label: workspace.name,
    x: 0,
    y: 0,
    color: workspace.color,
    refId: workspace.id,
  });

  const missions = snapshot.missions.slice(0, GRAPH_MAX_MISSIONS);
  missions.forEach((mission, mi) => {
    const angle = (mi / Math.max(missions.length, 1)) * Math.PI * 2;
    const mx = Math.cos(angle) * MISSION_RING;
    const my = Math.sin(angle) * MISSION_RING;
    const missionNodeId = `mission-${mission.id}`;
    nodes.push({
      id: missionNodeId,
      type: "mission",
      label: mission.title,
      x: mx,
      y: my,
      color: mission.color,
      refId: mission.id,
    });
    edges.push({ from: rootId, to: missionNodeId });

    // Leaves: milestones + tasks linked to this mission.
    const leaves: GraphNode[] = [];
    for (const ms of mission.milestones) {
      leaves.push({
        id: `milestone-${ms.id}`,
        type: "milestone",
        label: ms.title,
        x: 0,
        y: 0,
        color: mission.color,
        refId: ms.id,
      });
    }
    for (const { task } of snapshot.tasks) {
      if (task.missionId === mission.id) {
        leaves.push({
          id: `task-${task.id}`,
          type: "task",
          label: task.title,
          x: 0,
          y: 0,
          color: task.color,
          refId: task.id,
        });
      }
    }

    const shown = leaves.slice(0, GRAPH_MAX_LEAVES_PER_MISSION);
    shown.forEach((leaf, li) => {
      const spread = (li / Math.max(shown.length, 1)) * Math.PI * 2;
      leaf.x = mx + Math.cos(angle + spread) * LEAF_ORBIT;
      leaf.y = my + Math.sin(angle + spread) * LEAF_ORBIT;
      nodes.push(leaf);
      edges.push({ from: missionNodeId, to: leaf.id });
    });
  });

  // Loose knowledge orbits the workspace directly.
  const loose: GraphNode[] = [
    ...snapshot.notes.map<GraphNode>((n) => ({
      id: `note-${n.id}`,
      type: "note",
      label: n.title || "Note",
      x: 0,
      y: 0,
      color: null,
      refId: n.id,
    })),
    ...snapshot.resources.map<GraphNode>((r) => ({
      id: `resource-${r.id}`,
      type: "resource",
      label: r.title,
      x: 0,
      y: 0,
      color: null,
      refId: r.id,
    })),
    ...snapshot.journal.map<GraphNode>((e) => ({
      id: `journal-${e.id}`,
      type: "journal",
      label: `Journal · ${e.date}`,
      x: 0,
      y: 0,
      color: null,
      refId: e.id,
    })),
  ].slice(0, GRAPH_MAX_LOOSE);

  loose.forEach((node, i) => {
    // Offset the loose ring so it interleaves with the mission spokes.
    const angle = (i / Math.max(loose.length, 1)) * Math.PI * 2 + Math.PI / missionsSafe(missions.length);
    node.x = Math.cos(angle) * LOOSE_RING;
    node.y = Math.sin(angle) * LOOSE_RING;
    nodes.push(node);
    edges.push({ from: rootId, to: node.id });
  });

  return { nodes, edges };
}

function missionsSafe(n: number): number {
  return n > 0 ? n : 4;
}
