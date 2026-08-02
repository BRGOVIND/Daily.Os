/**
 * Defaulting accessors over the smart-task metadata. Every getter tolerates a
 * missing field so the engine treats a bare pre-Phase-4 task exactly like a
 * fully-annotated one — the whole engine reads tasks through these, never off
 * the raw optional fields.
 */

import { differenceInCalendarDays, parseISO } from "date-fns";
import type { DayRecord, Difficulty, EnergyLevel, Task } from "@/types";
import {
  CATEGORY_IMPORTANCE,
  CATEGORY_IMPORTANCE_NEUTRAL,
  DEFAULT_ESTIMATE_MIN,
  DIFFICULTY_WEIGHT,
  ENERGY_WEIGHT,
  RECURRENCE_WEIGHT,
} from "@/engine/models/constants";
import type { DatedTask } from "@/engine/models/types";

/** Estimated duration in minutes, defaulted. */
export function estMinutes(task: Task): number {
  const v = task.estimatedMinutes;
  return typeof v === "number" && v > 0 ? v : DEFAULT_ESTIMATE_MIN;
}

/** Difficulty, defaulted to "medium". */
export function difficultyOf(task: Task): Difficulty {
  return task.difficulty ?? "medium";
}

/** Required energy, defaulted to "medium". */
export function energyOf(task: Task): EnergyLevel {
  return task.energy ?? "medium";
}

/** Difficulty weight normalized to 0..1. */
export function difficultyScore(task: Task): number {
  return DIFFICULTY_WEIGHT[difficultyOf(task)] / 3;
}

/** Energy weight normalized to 0..1. */
export function energyScore(task: Task): number {
  return ENERGY_WEIGHT[energyOf(task)] / 3;
}

/** Recurrence weight (0..1). */
export function recurrenceWeight(task: Task): number {
  return RECURRENCE_WEIGHT[task.recurrence] ?? 0;
}

/** Category importance (0..1). */
export function categoryWeight(task: Task): number {
  return CATEGORY_IMPORTANCE[task.category] ?? CATEGORY_IMPORTANCE_NEUTRAL;
}

export function timesDeferred(task: Task): number {
  return task.timesDeferred ?? 0;
}

/** Combined effort a task represents (minutes × difficulty), for burnout/energy. */
export function effortOf(task: Task): number {
  return estMinutes(task) * (DIFFICULTY_WEIGHT[difficultyOf(task)] / 2);
}

/** True when a task has a deadline strictly before `today` and isn't done. */
export function isOverdue(task: Task, today: string): boolean {
  if (task.completed || !task.deadline) return false;
  return task.deadline < today;
}

/** Whole days until the deadline (negative = overdue); null when none set. */
export function daysUntilDeadline(task: Task, today: string): number | null {
  if (!task.deadline) return null;
  return differenceInCalendarDays(parseISO(task.deadline), parseISO(today));
}

/** A task that still needs doing. */
export function isActionable(task: Task): boolean {
  return !task.completed;
}

/** Flatten day records into dated tasks — the engine's primary input shape. */
export function flattenTasks(days: DayRecord[]): DatedTask[] {
  const out: DatedTask[] = [];
  for (const d of days) {
    for (const t of d.tasks) out.push({ ...t, date: d.date });
  }
  return out;
}

/** Local hour a task was completed, or null when unknown. */
export function completionHour(task: Task): number | null {
  if (!task.completed || !task.completedAt) return null;
  return new Date(task.completedAt).getHours();
}
