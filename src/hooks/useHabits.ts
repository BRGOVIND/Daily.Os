"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getDaysInRange } from "@/lib/db";
import { createId } from "@/lib/utils";
import { toDateKey } from "@/lib/date";
import { subDays } from "date-fns";
import type { HabitDef, TaskColor } from "@/types";

const STREAK_WINDOW_DAYS = 120;

export interface HabitView extends HabitDef {
  doneToday: boolean;
  streak: number;
}

export interface UseHabitsResult {
  habits: HabitView[];
  loading: boolean;
  addHabit: (name: string, color: TaskColor) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
}

/**
 * Global habits with today's completion and current streak.
 *
 * Streak = consecutive days ending today (or yesterday, if today isn't done
 * yet) on which the habit was completed. Computed from the day log over a
 * bounded window so it stays cheap.
 */
export function useHabits(today: Date | null): UseHabitsResult {
  const defs = useLiveQuery(() => db.habits.orderBy("order").toArray(), []);

  const fromKey = today
    ? toDateKey(subDays(today, STREAK_WINDOW_DAYS))
    : null;
  const toKey = today ? toDateKey(today) : null;

  const logDays = useLiveQuery(
    () => (fromKey && toKey ? getDaysInRange(fromKey, toKey) : Promise.resolve([])),
    [fromKey, toKey],
  );

  const habits = useMemo<HabitView[]>(() => {
    if (!defs || !today) return [];

    // Map date-key -> habitLog for O(1) lookups while walking backwards.
    const logByDate = new Map<string, Record<string, boolean>>();
    for (const d of logDays ?? []) logByDate.set(d.date, d.habitLog ?? {});

    const todayKey = toDateKey(today);

    return defs.map((def) => {
      const doneToday = logByDate.get(todayKey)?.[def.id] ?? false;

      let streak = 0;
      let cursor = new Date(today);
      // If today isn't done yet, the streak can still be "alive" up to yesterday.
      if (!doneToday) cursor = subDays(cursor, 1);
      for (let i = 0; i < STREAK_WINDOW_DAYS; i += 1) {
        const key = toDateKey(cursor);
        if (logByDate.get(key)?.[def.id]) {
          streak += 1;
          cursor = subDays(cursor, 1);
        } else {
          break;
        }
      }

      return { ...def, doneToday, streak };
    });
  }, [defs, logDays, today]);

  const addHabit = useCallback(async (name: string, color: TaskColor) => {
    if (!name.trim()) return;
    const order = (await db.habits.count()) + 1;
    await db.habits.add({
      id: createId(),
      name: name.trim(),
      color,
      order,
      createdAt: Date.now(),
    });
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await db.habits.delete(id);
  }, []);

  return {
    habits,
    loading: defs === undefined,
    addHabit,
    removeHabit,
  };
}
