/**
 * Module 4 — Workload Analyzer.
 *
 * Estimates committed work for today, tomorrow and the rest of the week, flags
 * unhealthy load, and *suggests* lighter days for specific tasks. It never
 * moves anything — the UI presents suggestions the user can act on.
 */

import { addDays, endOfWeek, format, parseISO } from "date-fns";
import type { DayRecord, Task } from "@/types";
import {
  DAILY_CAPACITY_MIN,
  WEEKLY_CAPACITY_MIN,
} from "@/engine/models/constants";
import type {
  MoveSuggestion,
  WorkloadBucket,
  WorkloadReport,
  WorkloadStatus,
} from "@/engine/models/types";
import { clamp01, round } from "@/engine/utils/math";
import { estMinutes, isActionable } from "@/engine/utils/tasks";
import {
  dayOpenTaskCount,
  dayWorkloadMinutes,
} from "@/engine/prediction/estimation";
import { computePriority } from "@/engine/prediction/priority";

function bucket(
  label: string,
  minutes: number,
  taskCount: number,
  capacity: number,
): WorkloadBucket {
  return {
    label,
    minutes,
    taskCount,
    capacityMinutes: capacity,
    ratio: round(clamp01(minutes / capacity), 2),
    overloaded: minutes > capacity,
  };
}

function statusFor(ratio: number): WorkloadStatus {
  if (ratio > 1) return "overloaded";
  if (ratio >= 0.8) return "heavy";
  if (ratio >= 0.35) return "balanced";
  return "light";
}

/**
 * Choose which of today's tasks to suggest moving when overloaded: shed the
 * lowest-priority, non-overdue tasks first until we're back under capacity.
 */
function suggestMoves(
  today: string,
  todayTasks: Task[],
): MoveSuggestion[] {
  const open = todayTasks.filter(isActionable);
  const overBy =
    open.reduce((m, t) => m + estMinutes(t), 0) - DAILY_CAPACITY_MIN;
  if (overBy <= 0) return [];

  // Lowest calculated priority first — but never suggest moving something
  // that's due today or overdue.
  const movable = open
    .map((t) => ({ task: t, p: computePriority(t, today) }))
    .filter(({ task }) => !task.deadline || task.deadline > today)
    .sort((a, b) => a.p.score - b.p.score);

  const suggestions: MoveSuggestion[] = [];
  let shed = 0;
  const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");
  for (const { task } of movable) {
    if (shed >= overBy) break;
    const minutes = estMinutes(task);
    suggestions.push({
      taskId: task.id,
      title: task.title,
      fromDate: today,
      toDate: tomorrow,
      minutes,
      reason: "Lightens an overloaded day",
    });
    shed += minutes;
  }
  return suggestions;
}

export function analyzeWorkload(
  today: string,
  byDate: Map<string, DayRecord>,
): WorkloadReport {
  const todayDate = parseISO(today);
  const tomorrowKey = format(addDays(todayDate, 1), "yyyy-MM-dd");

  const todayDay = byDate.get(today);
  const tomorrowDay = byDate.get(tomorrowKey);

  // Remaining days of the week, today inclusive.
  const weekEnd = endOfWeek(todayDate, { weekStartsOn: 1 });
  let weekMinutes = 0;
  let weekTasks = 0;
  for (let cursor = todayDate; cursor <= weekEnd; cursor = addDays(cursor, 1)) {
    const key = format(cursor, "yyyy-MM-dd");
    const day = byDate.get(key);
    weekMinutes += dayWorkloadMinutes(day);
    weekTasks += dayOpenTaskCount(day);
  }

  const todayBucket = bucket(
    "Today",
    dayWorkloadMinutes(todayDay),
    dayOpenTaskCount(todayDay),
    DAILY_CAPACITY_MIN,
  );
  const tomorrowBucket = bucket(
    "Tomorrow",
    dayWorkloadMinutes(tomorrowDay),
    dayOpenTaskCount(tomorrowDay),
    DAILY_CAPACITY_MIN,
  );
  // Capacity for the remainder of the week scales with days left.
  const daysLeft = Math.max(
    1,
    Math.round((weekEnd.getTime() - todayDate.getTime()) / 86_400_000) + 1,
  );
  const weekBucket = bucket(
    "Rest of week",
    weekMinutes,
    weekTasks,
    Math.min(WEEKLY_CAPACITY_MIN, DAILY_CAPACITY_MIN * daysLeft),
  );

  return {
    today: todayBucket,
    tomorrow: tomorrowBucket,
    week: weekBucket,
    status: statusFor(todayBucket.ratio),
    suggestions: suggestMoves(today, todayDay?.tasks ?? []),
    impossibleToday: todayBucket.overloaded,
  };
}
