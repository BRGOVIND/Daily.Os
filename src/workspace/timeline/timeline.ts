/**
 * Module 5 — Timeline.
 *
 * Every workspace automatically builds a chronological history from the data it
 * already owns: created, missions started, milestones finished, tasks
 * completed, journal entries, resources added, notes updated and reviews done.
 * The timeline is *derived* on read — never stored — so it can never drift.
 */

import type { Workspace } from "@/types";
import type { TimelineEvent, WorkspaceSnapshot } from "@/workspace/models/types";
import { notePreview } from "@/workspace/notes/notes";
import { hasContent } from "@/workspace/journal/journal";
import { MOOD_MAP, RESOURCE_KIND_MAP } from "@/lib/constants";

/** Build a workspace's full timeline, newest event first. */
export function buildTimeline(
  snapshot: WorkspaceSnapshot,
  workspace: Workspace,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: `ws-${workspace.id}`,
    kind: "workspace-created",
    title: "Workspace created",
    detail: workspace.name,
    timestamp: workspace.createdAt,
    date: dayOf(workspace.createdAt),
    icon: workspace.icon,
    color: workspace.color,
    refId: workspace.id,
  });

  for (const m of snapshot.missions) {
    events.push({
      id: `mission-${m.id}`,
      kind: "mission-created",
      title: "Mission started",
      detail: m.title,
      timestamp: m.createdAt,
      date: dayOf(m.createdAt),
      icon: m.icon || "🚀",
      color: m.color,
      refId: m.id,
    });
    // Milestones carry no timestamp of their own, so completed ones are
    // anchored to the mission's last-updated time (best-effort, documented).
    for (const ms of m.milestones.filter((x) => x.done)) {
      events.push({
        id: `milestone-${ms.id}`,
        kind: "milestone-completed",
        title: "Milestone reached",
        detail: `${ms.title} · ${m.title}`,
        timestamp: m.updatedAt,
        date: dayOf(m.updatedAt),
        icon: "🏁",
        color: m.color,
        refId: m.id,
      });
    }
  }

  for (const { task, date } of snapshot.tasks) {
    if (task.completed && task.completedAt) {
      events.push({
        id: `task-${task.id}`,
        kind: "task-completed",
        title: "Task completed",
        detail: task.title,
        timestamp: task.completedAt,
        date,
        icon: "✅",
        color: task.color,
        refId: task.id,
      });
    }
  }

  for (const e of snapshot.journal.filter(hasContent)) {
    events.push({
      id: `journal-${e.id}`,
      kind: "journal-entry",
      title: "Journal entry",
      detail: e.mood ? `Feeling ${MOOD_MAP[e.mood].label.toLowerCase()}` : "Reflection",
      timestamp: e.createdAt,
      date: e.date,
      icon: e.mood ? MOOD_MAP[e.mood].emoji : "📓",
      color: null,
      refId: e.id,
    });
  }

  for (const r of snapshot.resources) {
    events.push({
      id: `resource-${r.id}`,
      kind: "resource-added",
      title: "Resource saved",
      detail: r.title,
      timestamp: r.createdAt,
      date: dayOf(r.createdAt),
      icon: RESOURCE_KIND_MAP[r.kind].icon,
      color: null,
      refId: r.id,
    });
  }

  for (const n of snapshot.notes) {
    events.push({
      id: `note-${n.id}`,
      kind: "note-updated",
      title: "Note updated",
      detail: n.title || notePreview(n),
      timestamp: n.updatedAt,
      date: dayOf(n.updatedAt),
      icon: "📝",
      color: null,
      refId: n.id,
    });
  }

  for (const rv of snapshot.reviews) {
    events.push({
      id: `review-${rv.date}`,
      kind: "review-completed",
      title: "Daily review",
      detail: "Reflected on the day",
      timestamp: rv.completedAt,
      date: rv.date,
      icon: "🌙",
      color: null,
      refId: rv.date,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

/** Epoch ms → yyyy-MM-dd (local), without pulling in date-fns for one call. */
function dayOf(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
