/**
 * Module 7 — Burnout Detection.
 *
 * Quietly watches for unsustainable patterns — heavy days back-to-back, no
 * breaks, work piling up unfinished, habits slipping, late-night grind — and
 * suggests easing off. It's advisory and gentle, never intrusive or alarmist.
 */

import { format, parseISO, subDays } from "date-fns";
import type { DayRecord, HabitDef } from "@/types";
import type { DatedTask } from "@/engine/models/types";
import {
  ANALYSIS_WINDOW_DAYS,
  HEAVY_DAY_MIN,
  LATE_NIGHT_HOUR,
} from "@/engine/models/constants";
import type {
  BurnoutReport,
  BurnoutRisk,
  BurnoutSignal,
} from "@/engine/models/types";
import { clamp01 } from "@/engine/utils/math";
import {
  completionHour,
  estMinutes,
  isOverdue,
  timesDeferred,
} from "@/engine/utils/tasks";

function riskFor(score: number): BurnoutRisk {
  if (score >= 60) return "high";
  if (score >= 35) return "elevated";
  if (score >= 15) return "low";
  return "none";
}

export function detectBurnout(
  today: string,
  byDate: Map<string, DayRecord>,
  habits: HabitDef[],
  windowTasks: DatedTask[],
): BurnoutReport {
  const todayDate = parseISO(today);
  const loads: number[] = [];
  for (let i = 0; i < ANALYSIS_WINDOW_DAYS; i += 1) {
    const day = byDate.get(format(subDays(todayDate, i), "yyyy-MM-dd"));
    loads.push(day ? day.tasks.reduce((m, t) => m + estMinutes(t), 0) : 0);
  }
  // loads[0] is today, loads[1] yesterday, …

  // 1) Consecutive heavy days ending most recently.
  let heavyRun = 0;
  for (const load of loads) {
    if (load >= HEAVY_DAY_MIN) heavyRun += 1;
    else break;
  }

  // 2) Too few breaks in the last 7 days.
  const last7 = loads.slice(0, 7);
  const restfulLast7 = last7.filter((l) => l < HEAVY_DAY_MIN).length;

  // 3) Repeated unfinished work.
  const stalled = windowTasks.filter(
    (t) => !t.completed && (timesDeferred(t) >= 2 || isOverdue(t, today)),
  ).length;

  // 4) Low habit completion (last 7 days).
  let habitRatio = 1;
  if (habits.length > 0) {
    let done = 0;
    for (let i = 0; i < 7; i += 1) {
      const day = byDate.get(format(subDays(todayDate, i), "yyyy-MM-dd"));
      done += day ? Object.values(day.habitLog ?? {}).filter(Boolean).length : 0;
    }
    habitRatio = done / (habits.length * 7);
  }

  // 5) Late-night workload.
  const lateNight = windowTasks.filter((t) => {
    const h = completionHour(t);
    return h !== null && (h >= LATE_NIGHT_HOUR || h < 5);
  }).length;

  const candidates: BurnoutSignal[] = [
    {
      key: "consecutive-heavy",
      label: "Heavy days in a row",
      detail: `${heavyRun} demanding day${heavyRun === 1 ? "" : "s"} back-to-back.`,
      severity: clamp01((heavyRun - 1) / 4),
    },
    {
      key: "few-breaks",
      label: "Too few breaks",
      detail:
        restfulLast7 === 0
          ? "No lighter days this week."
          : `Only ${restfulLast7} lighter day${restfulLast7 === 1 ? "" : "s"} this week.`,
      severity: clamp01((2 - restfulLast7) / 2),
    },
    {
      key: "unfinished",
      label: "Work piling up",
      detail: `${stalled} task${stalled === 1 ? "" : "s"} repeatedly unfinished or overdue.`,
      severity: clamp01(stalled / 5),
    },
    {
      key: "habits-slipping",
      label: "Habits slipping",
      detail:
        habits.length === 0
          ? ""
          : `Habit completion at ${Math.round(habitRatio * 100)}% this week.`,
      severity:
        habits.length === 0 || habitRatio >= 0.4
          ? 0
          : clamp01((0.4 - habitRatio) / 0.4),
    },
    {
      key: "late-night",
      label: "Late-night workload",
      detail: `${lateNight} task${lateNight === 1 ? "" : "s"} finished late at night.`,
      severity: clamp01(lateNight / 5),
    },
  ];

  const signals = candidates.filter((s) => s.severity > 0.05);

  // Composite emphasises the strongest signal but accounts for breadth.
  const maxSeverity = signals.reduce((m, s) => Math.max(m, s.severity), 0);
  const avgSeverity =
    signals.length === 0
      ? 0
      : signals.reduce((s, x) => s + x.severity, 0) / signals.length;
  const score = Math.round((maxSeverity * 0.6 + avgSeverity * 0.4) * 100);
  const risk = riskFor(score);

  const suggestions: string[] = [];
  if (risk === "none") {
    suggestions.push("Your pace looks sustainable — keep it up.");
  } else {
    if (signals.some((s) => s.key === "consecutive-heavy" || s.key === "few-breaks"))
      suggestions.push("Plan a deliberately lighter day this week.");
    if (signals.some((s) => s.key === "unfinished"))
      suggestions.push("Move or drop a few stalled tasks to clear the backlog.");
    if (signals.some((s) => s.key === "late-night"))
      suggestions.push("Try shifting demanding work earlier in the day.");
    if (signals.some((s) => s.key === "habits-slipping"))
      suggestions.push("Scale habits back to the essentials until you recover.");
  }

  return { risk, score, signals, suggestions };
}
