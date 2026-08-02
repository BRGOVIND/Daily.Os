/**
 * Module 5 — Productivity Score.
 *
 * A blended 0..100 score that rewards *how* someone works, not just how many
 * boxes they tick: consistency, task and habit completion, planning, focus,
 * deep work and recovery. It also explains what moved the score versus the
 * previous window, so the number is never a mystery.
 */

import { format, parseISO, subDays } from "date-fns";
import type { DayRecord, HabitDef } from "@/types";
import {
  ANALYSIS_WINDOW_DAYS,
  HEAVY_DAY_MIN,
  PRODUCTIVITY_WEIGHTS,
} from "@/engine/models/constants";
import type {
  ProductivityBand,
  ProductivityScore,
  ScoreComponent,
} from "@/engine/models/types";
import { clamp01, mean, pct, round } from "@/engine/utils/math";
import { difficultyOf, energyOf, estMinutes } from "@/engine/utils/tasks";

interface DayMetric {
  tTotal: number;
  tDone: number;
  hDone: number;
  fTotal: number;
  fDone: number;
  hasReview: boolean;
  hasFocus: boolean;
  loadMin: number;
  hardDone: number;
  active: boolean;
}

interface Components {
  consistency: number;
  taskCompletion: number;
  habitCompletion: number;
  planningQuality: number;
  focusCompletion: number;
  deepWork: number;
  recovery: number;
}

function metricFor(day: DayRecord | undefined): DayMetric {
  if (!day) {
    return {
      tTotal: 0,
      tDone: 0,
      hDone: 0,
      fTotal: 0,
      fDone: 0,
      hasReview: false,
      hasFocus: false,
      loadMin: 0,
      hardDone: 0,
      active: false,
    };
  }
  const tDone = day.tasks.filter((t) => t.completed).length;
  const hardDone = day.tasks.filter(
    (t) => t.completed && (difficultyOf(t) === "hard" || energyOf(t) === "high"),
  ).length;
  const loadMin = day.tasks.reduce((m, t) => m + estMinutes(t), 0);
  const hDone = Object.values(day.habitLog ?? {}).filter(Boolean).length;
  return {
    tTotal: day.tasks.length,
    tDone,
    hDone,
    fTotal: day.focus.length,
    fDone: day.focus.filter((f) => f.done).length,
    hasReview: day.review !== null,
    hasFocus: day.focus.length > 0,
    loadMin,
    hardDone,
    active: day.tasks.length > 0 || hDone > 0 || day.focus.length > 0,
  };
}

function computeComponents(
  metrics: DayMetric[],
  habitCount: number,
): Components {
  const windowDays = metrics.length;
  const activeDays = metrics.filter((m) => m.active);
  const daysWithTasks = metrics.filter((m) => m.tTotal > 0);
  const daysWithFocus = metrics.filter((m) => m.fTotal > 0);

  const consistency = pct(
    metrics.filter((m) => m.tDone > 0 || m.hDone > 0).length,
    windowDays,
  );

  const taskCompletion =
    daysWithTasks.length === 0
      ? 0
      : Math.round(mean(daysWithTasks.map((m) => (m.tDone / m.tTotal) * 100)));

  const habitCompletion =
    habitCount === 0
      ? 50 // neutral baseline — no habits defined, don't punish
      : Math.round(
          (metrics.reduce((s, m) => s + m.hDone, 0) /
            (habitCount * windowDays)) *
            100,
        );

  const planningQuality = pct(
    activeDays.filter((m) => m.hasFocus).length,
    Math.max(1, activeDays.length),
  );

  const focusCompletion =
    daysWithFocus.length === 0
      ? 0
      : Math.round(mean(daysWithFocus.map((m) => (m.fDone / m.fTotal) * 100)));

  const deepWork = Math.round(
    clamp01(metrics.reduce((s, m) => s + m.hardDone, 0) / windowDays) * 100,
  );

  const restfulRatio = pct(
    metrics.filter((m) => m.loadMin < HEAVY_DAY_MIN).length,
    windowDays,
  );
  const reviewRatio = pct(
    activeDays.filter((m) => m.hasReview).length,
    Math.max(1, activeDays.length),
  );
  const recovery = Math.round(mean([restfulRatio, reviewRatio]));

  return {
    consistency,
    taskCompletion,
    habitCompletion,
    planningQuality,
    focusCompletion,
    deepWork,
    recovery,
  };
}

function blend(c: Components): { score: number; components: ScoreComponent[] } {
  const rows: Array<[keyof Components, string, number]> = [
    ["consistency", "Consistency", PRODUCTIVITY_WEIGHTS.consistency],
    ["taskCompletion", "Task completion", PRODUCTIVITY_WEIGHTS.taskCompletion],
    ["habitCompletion", "Habit completion", PRODUCTIVITY_WEIGHTS.habitCompletion],
    ["planningQuality", "Planning", PRODUCTIVITY_WEIGHTS.planningQuality],
    ["focusCompletion", "Focus", PRODUCTIVITY_WEIGHTS.focusCompletion],
    ["deepWork", "Deep work", PRODUCTIVITY_WEIGHTS.deepWork],
    ["recovery", "Recovery", PRODUCTIVITY_WEIGHTS.recovery],
  ];
  const components: ScoreComponent[] = rows.map(([key, label, weight]) => ({
    key,
    label,
    value: c[key],
    weight,
    contribution: round(c[key] * weight, 1),
  }));
  const score = Math.round(
    components.reduce((s, comp) => s + comp.contribution, 0),
  );
  return { score, components };
}

function bandFor(score: number): ProductivityBand {
  if (score >= 80) return "thriving";
  if (score >= 60) return "steady";
  if (score >= 35) return "building";
  return "struggling";
}

function buildReasons(
  current: Components,
  previous: Components,
  delta: number,
): string[] {
  const reasons: string[] = [];
  const diffs = (Object.keys(current) as Array<keyof Components>).map((k) => ({
    key: k,
    change: current[k] - previous[k],
  }));
  diffs.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const LABELS: Record<keyof Components, string> = {
    consistency: "consistency",
    taskCompletion: "task completion",
    habitCompletion: "habit completion",
    planningQuality: "planning",
    focusCompletion: "focus follow-through",
    deepWork: "deep work",
    recovery: "recovery",
  };

  if (delta > 1) reasons.push(`Up ${Math.round(delta)} points from last cycle.`);
  else if (delta < -1)
    reasons.push(`Down ${Math.abs(Math.round(delta))} points from last cycle.`);
  else reasons.push("Holding steady from last cycle.");

  for (const d of diffs.slice(0, 2)) {
    if (Math.abs(d.change) < 4) continue;
    const dir = d.change > 0 ? "improved" : "slipped";
    reasons.push(
      `Your ${LABELS[d.key]} ${dir} (${d.change > 0 ? "+" : ""}${Math.round(
        d.change,
      )}).`,
    );
  }
  return reasons;
}

/**
 * Compute the productivity score over the trailing window ending at `today`,
 * comparing against the window immediately before it for the delta/reasons.
 */
export function computeProductivity(
  today: string,
  byDate: Map<string, DayRecord>,
  habits: HabitDef[],
): ProductivityScore {
  const windowDays = ANALYSIS_WINDOW_DAYS;
  const todayDate = parseISO(today);

  const current: DayMetric[] = [];
  const previous: DayMetric[] = [];
  for (let i = 0; i < windowDays; i += 1) {
    const curKey = format(subDays(todayDate, i), "yyyy-MM-dd");
    const prevKey = format(subDays(todayDate, i + windowDays), "yyyy-MM-dd");
    current.push(metricFor(byDate.get(curKey)));
    previous.push(metricFor(byDate.get(prevKey)));
  }

  const curComp = computeComponents(current, habits.length);
  const prevComp = computeComponents(previous, habits.length);
  const { score, components } = blend(curComp);
  const prevScore = blend(prevComp).score;
  const delta = score - prevScore;

  return {
    score,
    band: bandFor(score),
    components,
    delta,
    reasons: buildReasons(curComp, prevComp, delta),
  };
}
