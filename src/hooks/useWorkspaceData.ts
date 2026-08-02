"use client";

import { useMemo } from "react";
import { useWorkspaceSnapshot } from "@/hooks/useWorkspaceSnapshot";
import {
  buildDashboard,
  buildGraph,
  buildTimeline,
  computeWorkspaceStats,
  scopeSnapshot,
  type DashboardData,
  type GraphModel,
  type TimelineEvent,
  type WorkspaceSnapshot,
  type WorkspaceStats,
} from "@/workspace";
import type { Workspace } from "@/types";

export interface WorkspaceData {
  scoped: WorkspaceSnapshot;
  dashboard: DashboardData | null;
  timeline: TimelineEvent[];
  graph: GraphModel | null;
  stats: WorkspaceStats | null;
}

const EMPTY: WorkspaceData = {
  scoped: {
    workspaces: [],
    tasks: [],
    missions: [],
    notes: [],
    resources: [],
    journal: [],
    reviews: [],
    habits: [],
    templates: [],
  },
  dashboard: null,
  timeline: [],
  graph: null,
  stats: null,
};

/**
 * All derived, workspace-scoped views in one memoized pass: the scoped
 * snapshot, dashboard aggregate, full timeline, knowledge graph and statistics.
 * Inert (returns EMPTY) until a workspace and today key are provided.
 */
export function useWorkspaceData(
  workspace: Workspace | null,
  todayKey: string | null,
  enabled = true,
): WorkspaceData {
  const snapshot = useWorkspaceSnapshot(enabled && workspace !== null);

  return useMemo<WorkspaceData>(() => {
    if (!enabled || !workspace || !todayKey) return EMPTY;
    const scoped = scopeSnapshot(snapshot, workspace.id);
    return {
      scoped,
      dashboard: buildDashboard(scoped, workspace, todayKey),
      timeline: buildTimeline(scoped, workspace),
      graph: buildGraph(scoped, workspace),
      stats: computeWorkspaceStats(scoped, todayKey),
    };
  }, [enabled, snapshot, workspace, todayKey]);
}
