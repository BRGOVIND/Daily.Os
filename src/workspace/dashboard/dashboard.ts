/**
 * Module 8 — Workspace Dashboard.
 *
 * Aggregates a scoped snapshot into everything the dashboard surface shows:
 * headline stats, the active-task queue, recent notes and resources, a recent
 * slice of the timeline and the active missions. Pure — the UI merges the
 * Intelligence Engine's mission progress on top.
 */

import type { Workspace } from "@/types";
import type { DashboardData, WorkspaceSnapshot } from "@/workspace/models/types";
import { computeWorkspaceStats } from "@/workspace/stats/stats";
import { buildTimeline } from "@/workspace/timeline/timeline";
import { DASHBOARD_RECENT, DASHBOARD_TIMELINE } from "@/workspace/models/constants";

export function buildDashboard(
  snapshot: WorkspaceSnapshot,
  workspace: Workspace,
  todayKey: string,
): DashboardData {
  const activeTasks = snapshot.tasks
    .filter((t) => !t.task.completed)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const recentNotes = [...snapshot.notes]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    })
    .slice(0, DASHBOARD_RECENT);

  const recentResources = [...snapshot.resources]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, DASHBOARD_RECENT);

  const activeMissions = snapshot.missions.filter((m) => !m.archived);

  return {
    workspace,
    stats: computeWorkspaceStats(snapshot, todayKey),
    activeTasks,
    recentNotes,
    recentResources,
    recentTimeline: buildTimeline(snapshot, workspace).slice(0, DASHBOARD_TIMELINE),
    activeMissions,
  };
}
