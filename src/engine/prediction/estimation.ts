/**
 * Module 9 — Time Estimation primitives.
 *
 * Turns tasks into committed-minute totals for a day, so the Workload Analyzer
 * and Planner speak a common language. Only incomplete tasks count as
 * "committed" — finished work no longer occupies the schedule.
 */

import type { DayRecord, Task } from "@/types";
import { estMinutes, isActionable } from "@/engine/utils/tasks";

/** Total remaining minutes committed on a single day. */
export function dayWorkloadMinutes(day: DayRecord | undefined): number {
  if (!day) return 0;
  return day.tasks.reduce(
    (total, t) => total + (isActionable(t) ? estMinutes(t) : 0),
    0,
  );
}

/** Count of remaining tasks on a day. */
export function dayOpenTaskCount(day: DayRecord | undefined): number {
  if (!day) return 0;
  return day.tasks.filter(isActionable).length;
}

/** Remaining minutes across an arbitrary set of tasks. */
export function tasksWorkloadMinutes(tasks: Task[]): number {
  return tasks.reduce(
    (total, t) => total + (isActionable(t) ? estMinutes(t) : 0),
    0,
  );
}
