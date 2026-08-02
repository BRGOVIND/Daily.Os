/**
 * Tunable weights and thresholds for the Intelligence Engine.
 *
 * These live in one place so the scoring behaviour can be reasoned about (and,
 * one day, learned per-user) without hunting through the algorithms. Nothing
 * here touches React, Dexie or the DOM — the engine is a pure domain.
 */

import type { Difficulty, EnergyLevel, Priority, RecurrenceRule } from "@/types";

/** Used whenever a task has no user-supplied duration estimate. */
export const DEFAULT_ESTIMATE_MIN = 30;

/** A healthy day's worth of planned work (minutes). ~6 focused hours. */
export const DAILY_CAPACITY_MIN = 360;

/** A healthy week (minutes) — assumes one lighter/rest day. */
export const WEEKLY_CAPACITY_MIN = DAILY_CAPACITY_MIN * 6;

/** Above this, a single day counts as "heavy" for burnout detection. */
export const HEAVY_DAY_MIN = 300;

/** Completions at/after this hour (local) count as late-night workload. */
export const LATE_NIGHT_HOUR = 23;

/** Analysis window (days) for productivity, energy and burnout. */
export const ANALYSIS_WINDOW_DAYS = 14;

/** Effort weight by required energy (0..1 after /3). */
export const ENERGY_WEIGHT: Record<EnergyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Effort weight by difficulty (0..1 after /3). */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Manual priority as an importance signal (0..1 after /3). */
export const MANUAL_PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** How strongly a recurrence rule implies "this matters daily" (0..1). */
export const RECURRENCE_WEIGHT: Record<RecurrenceRule, number> = {
  none: 0,
  monthly: 0.3,
  weekly: 0.5,
  weekends: 0.55,
  weekdays: 0.8,
  daily: 1,
};

/** Category importance (0..1). Unknown categories fall back to NEUTRAL. */
export const CATEGORY_IMPORTANCE: Record<string, number> = {
  Work: 0.9,
  Learning: 0.85,
  Health: 0.7,
  Personal: 0.5,
  Errands: 0.4,
  Ideas: 0.35,
};
export const CATEGORY_IMPORTANCE_NEUTRAL = 0.5;

/**
 * Priority factor weights. These sum to 1 so the raw score lands in 0..1
 * before scaling to 0..100.
 */
export const PRIORITY_FACTOR_WEIGHTS = {
  deadline: 0.3,
  manual: 0.2,
  difficulty: 0.15,
  deferrals: 0.15,
  duration: 0.08,
  recurrence: 0.07,
  category: 0.05,
} as const;

/** Score cut-offs for the four priority bands. */
export const PRIORITY_BANDS = {
  medium: 25,
  high: 50,
  critical: 75,
} as const;

/**
 * Productivity score component weights (sum to 1). Each component is measured
 * 0..100 over the analysis window, then blended.
 */
export const PRODUCTIVITY_WEIGHTS = {
  consistency: 0.22,
  taskCompletion: 0.2,
  habitCompletion: 0.16,
  planningQuality: 0.14,
  focusCompletion: 0.12,
  deepWork: 0.1,
  recovery: 0.06,
} as const;

/** Local hour ranges for each part of day (used by the Planner). */
export const DAY_PART_HOURS = {
  morning: [5, 11],
  afternoon: [12, 16],
  evening: [17, 20],
  night: [21, 4], // wraps past midnight
} as const;
