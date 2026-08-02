/**
 * Module 2 — Planner Engine.
 *
 * Produces a *recommended* shape for a day: which work belongs in the morning,
 * afternoon, evening and night, given priority, difficulty, energy, deadlines
 * and the user's learned peak window. It returns suggestions only — it never
 * mutates the user's actual plan.
 */

import type { DayPart, DayRecord, HabitDef, Task } from "@/types";
import { DAILY_CAPACITY_MIN } from "@/engine/models/constants";
import type { DayPlan, PlanItem, PlanSection } from "@/engine/models/types";
import { DAY_PARTS, DAY_PART_LABEL } from "@/engine/utils/time";
import {
  difficultyOf,
  energyOf,
  estMinutes,
  isOverdue,
} from "@/engine/utils/tasks";
import { computePriority } from "@/engine/prediction/priority";

const HABIT_MINUTES = 15;
const RITUAL_MINUTES = 5;

/** Decide which part of the day a task should be recommended for. */
function placeTask(task: Task, today: string, peakPart: DayPart): DayPart {
  if (isOverdue(task, today)) return "morning"; // clear overdue work first
  const hard = difficultyOf(task) === "hard" || energyOf(task) === "high";
  if (hard) return peakPart; // demanding work → your best window

  const category = task.category.toLowerCase();
  const title = task.title.toLowerCase();
  if (/reflect|review|journal|plan tomorrow|wind ?down/.test(title)) return "night";
  if (category === "health") return "evening";
  if (category === "errands") return "afternoon";
  if (energyOf(task) === "low" && difficultyOf(task) === "easy") return "afternoon";
  return "afternoon";
}

/** Map a habit's name to a sensible part of day. */
function placeHabit(name: string): DayPart {
  const n = name.toLowerCase();
  if (/gym|work ?out|run|lift|exercise|walk/.test(n)) return "evening";
  if (/read|reflect|journal|sleep/.test(n)) return "night";
  if (/meditate|hydrate|stretch|plan/.test(n)) return "morning";
  return "evening";
}

/**
 * Build a recommended day plan. `peakPart` comes from the energy analysis and
 * defaults to "morning" when there's not enough data.
 */
export function buildDayPlan(
  date: string,
  day: DayRecord | undefined,
  habits: HabitDef[],
  today: string,
  peakPart: DayPart = "morning",
): DayPlan {
  const items: PlanItem[] = [];
  const openTasks = (day?.tasks ?? []).filter((t) => !t.completed);

  let overdueCount = 0;
  for (const task of openTasks) {
    const breakdown = computePriority(task, today);
    if (isOverdue(task, today)) overdueCount += 1;
    const part = placeTask(task, today, peakPart);
    items.push({
      id: `task-${task.id}`,
      title: task.title,
      part,
      source: "task",
      reason: isOverdue(task, today)
        ? "Overdue — do first"
        : breakdown.reasons[0] ?? "Scheduled",
      estimatedMinutes: estMinutes(task),
      priorityBand: breakdown.band,
      taskId: task.id,
    });
  }

  // Habits (only meaningful for today's plan, but harmless on any day).
  for (const habit of habits) {
    const part = placeHabit(habit.name);
    const alreadyDone = day?.habitLog?.[habit.id] === true;
    if (alreadyDone) continue;
    items.push({
      id: `habit-${habit.id}`,
      title: habit.name,
      part,
      source: "habit",
      reason: "Daily habit",
      estimatedMinutes: HABIT_MINUTES,
      priorityBand: null,
      taskId: null,
    });
  }

  // A gentle reflection ritual to close the day, if not already reviewed.
  if (!day?.review) {
    items.push({
      id: "ritual-reflect",
      title: "Reflect on today",
      part: "night",
      source: "ritual",
      reason: "Close the loop",
      estimatedMinutes: RITUAL_MINUTES,
      priorityBand: null,
      taskId: null,
    });
  }

  // Group into ordered sections; sort tasks within a part by priority.
  const bandRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sections: PlanSection[] = DAY_PARTS.map((part) => {
    const partItems = items
      .filter((i) => i.part === part)
      .sort((a, b) => {
        const ra = a.priorityBand ? bandRank[a.priorityBand] : 4;
        const rb = b.priorityBand ? bandRank[b.priorityBand] : 4;
        return ra - rb;
      });
    return {
      part,
      label: DAY_PART_LABEL[part],
      items: partItems,
      totalMinutes: partItems.reduce((m, i) => m + i.estimatedMinutes, 0),
    };
  }).filter((s) => s.items.length > 0);

  const totalMinutes = openTasks.reduce((m, t) => m + estMinutes(t), 0);

  const notes: string[] = [];
  if (overdueCount > 0) {
    notes.push(
      `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} placed first thing.`,
    );
  }
  if (totalMinutes > DAILY_CAPACITY_MIN) {
    const over = Math.round((totalMinutes - DAILY_CAPACITY_MIN) / 30) * 30;
    notes.push(
      `This is a heavy day (~${Math.round(totalMinutes / 60)}h). Consider moving ~${over} min to another day.`,
    );
  }

  return {
    date,
    sections,
    totalMinutes,
    notes,
    hasWork: openTasks.length > 0,
  };
}
