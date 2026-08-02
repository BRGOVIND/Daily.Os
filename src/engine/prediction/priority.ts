/**
 * Module 3 — Automatic Priority Engine.
 *
 * Turns a task's metadata into a 0..100 calculated priority and a band, with
 * human-readable reasons. Manual priority is one input among several, not the
 * whole story — a low-priority task that's overdue still rises.
 */

import type { Task } from "@/types";
import {
  MANUAL_PRIORITY_WEIGHT,
  PRIORITY_BANDS,
  PRIORITY_FACTOR_WEIGHTS,
} from "@/engine/models/constants";
import type {
  PriorityBand,
  PriorityBreakdown,
  PriorityDistribution,
  PriorityFactors,
} from "@/engine/models/types";
import { clamp01, round } from "@/engine/utils/math";
import {
  categoryWeight,
  daysUntilDeadline,
  difficultyScore,
  estMinutes,
  isOverdue,
  recurrenceWeight,
  timesDeferred,
} from "@/engine/utils/tasks";

/** Map days-until-deadline to a 0..1 urgency curve. No deadline → mild 0.2. */
function deadlineUrgency(task: Task, today: string): number {
  const days = daysUntilDeadline(task, today);
  if (days === null) return 0.2;
  if (days < 0) return 1; // overdue
  if (days === 0) return 0.95;
  if (days === 1) return 0.82;
  if (days === 2) return 0.68;
  if (days === 3) return 0.55;
  if (days <= 7) return 0.4;
  if (days <= 14) return 0.3;
  return 0.22;
}

/** Longer tasks nudge priority up a little (worth starting sooner). */
function durationPressure(task: Task): number {
  return clamp01(estMinutes(task) / 120);
}

/** Repeated postponement makes a task nag louder. */
function deferralPressure(task: Task): number {
  return clamp01(timesDeferred(task) / 3);
}

export function scoreToBand(score: number): PriorityBand {
  if (score >= PRIORITY_BANDS.critical) return "critical";
  if (score >= PRIORITY_BANDS.high) return "high";
  if (score >= PRIORITY_BANDS.medium) return "medium";
  return "low";
}

export const PRIORITY_BAND_LABEL: Record<PriorityBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Build the ordered list of human reasons behind a score. */
function buildReasons(task: Task, today: string, factors: PriorityFactors): string[] {
  const reasons: string[] = [];
  const days = daysUntilDeadline(task, today);

  if (days !== null) {
    if (days < 0) reasons.push(`Overdue by ${Math.abs(days)}d`);
    else if (days === 0) reasons.push("Due today");
    else if (days === 1) reasons.push("Due tomorrow");
    else if (days <= 7) reasons.push(`Due in ${days}d`);
  }
  const deferred = timesDeferred(task);
  if (deferred > 0) reasons.push(`Postponed ${deferred}×`);
  if (task.priority === "high") reasons.push("Marked high priority");
  if (factors.difficulty >= 0.9) reasons.push("Hard task");
  if (recurrenceWeight(task) >= 0.8) reasons.push("Daily commitment");
  if (reasons.length === 0) reasons.push("No urgent signals");
  return reasons;
}

/**
 * Calculate a task's priority. Completed tasks score 0 — they aren't
 * actionable, so they never compete for attention.
 */
export function computePriority(task: Task, today: string): PriorityBreakdown {
  if (task.completed) {
    return {
      score: 0,
      band: "low",
      factors: {
        deadline: 0,
        manual: 0,
        difficulty: 0,
        deferrals: 0,
        duration: 0,
        recurrence: 0,
        category: 0,
      },
      reasons: ["Completed"],
    };
  }

  const factors: PriorityFactors = {
    deadline: deadlineUrgency(task, today),
    manual: MANUAL_PRIORITY_WEIGHT[task.priority] / 3,
    difficulty: difficultyScore(task),
    deferrals: deferralPressure(task),
    duration: durationPressure(task),
    recurrence: recurrenceWeight(task),
    category: categoryWeight(task),
  };

  const raw =
    factors.deadline * PRIORITY_FACTOR_WEIGHTS.deadline +
    factors.manual * PRIORITY_FACTOR_WEIGHTS.manual +
    factors.difficulty * PRIORITY_FACTOR_WEIGHTS.difficulty +
    factors.deferrals * PRIORITY_FACTOR_WEIGHTS.deferrals +
    factors.duration * PRIORITY_FACTOR_WEIGHTS.duration +
    factors.recurrence * PRIORITY_FACTOR_WEIGHTS.recurrence +
    factors.category * PRIORITY_FACTOR_WEIGHTS.category;

  let score = round(clamp01(raw) * 100);
  // An overdue task is always at least Critical, regardless of other factors.
  if (isOverdue(task, today)) score = Math.max(score, PRIORITY_BANDS.critical);

  return {
    score,
    band: scoreToBand(score),
    factors,
    reasons: buildReasons(task, today, factors),
  };
}

/** Tally calculated bands across a set of (incomplete) tasks. */
export function priorityDistribution(
  tasks: Task[],
  today: string,
): PriorityDistribution {
  const dist: PriorityDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    total: 0,
  };
  for (const task of tasks) {
    if (task.completed) continue;
    const { band } = computePriority(task, today);
    dist[band] += 1;
    dist.total += 1;
  }
  return dist;
}
