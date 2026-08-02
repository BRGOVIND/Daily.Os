/**
 * Module 12 — Workspace Statistics.
 *
 * Per-workspace numbers derived from a scoped snapshot: task throughput, mission
 * completion, note/resource/journal counts, the journalling streak, time
 * invested and a seven-day activity sparkline.
 */

import type { WorkspaceSnapshot, WorkspaceStats } from "@/workspace/models/types";
import { WEEKLY_ACTIVITY_DAYS } from "@/workspace/models/constants";
import { journalStreak } from "@/workspace/journal/journal";
import { DEFAULT_ESTIMATE_MIN } from "@/engine";
import { fromDateKey, toDateKey } from "@/lib/date";
import { addDays } from "date-fns";

/** Compute a workspace's statistics as of `todayKey`. */
export function computeWorkspaceStats(
  snapshot: WorkspaceSnapshot,
  todayKey: string,
): WorkspaceStats {
  const taskTotal = snapshot.tasks.length;
  const completed = snapshot.tasks.filter((t) => t.task.completed);
  const taskCompleted = completed.length;

  const missionTotal = snapshot.missions.length;
  const missionCompleted = snapshot.missions.filter(
    (m) => m.milestones.length > 0 && m.milestones.every((ms) => ms.done),
  ).length;

  const timeInvestedMinutes = completed.reduce(
    (sum, t) => sum + (t.task.estimatedMinutes ?? DEFAULT_ESTIMATE_MIN),
    0,
  );

  // Seven-day activity: completions attributed to the day they live on.
  const completionsByDate = new Map<string, number>();
  for (const t of completed) {
    completionsByDate.set(t.date, (completionsByDate.get(t.date) ?? 0) + 1);
  }
  const weeklyActivity: number[] = [];
  const start = addDays(fromDateKey(todayKey), -(WEEKLY_ACTIVITY_DAYS - 1));
  for (let i = 0; i < WEEKLY_ACTIVITY_DAYS; i += 1) {
    const key = toDateKey(addDays(start, i));
    weeklyActivity.push(completionsByDate.get(key) ?? 0);
  }

  return {
    taskTotal,
    taskCompleted,
    taskCompletionRate: taskTotal === 0 ? 0 : taskCompleted / taskTotal,
    missionTotal,
    missionCompleted,
    noteCount: snapshot.notes.length,
    resourceCount: snapshot.resources.length,
    journalCount: snapshot.journal.length,
    journalStreak: journalStreak(snapshot.journal, todayKey),
    timeInvestedMinutes,
    weeklyActivity,
  };
}
