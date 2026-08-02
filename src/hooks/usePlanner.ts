"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { subDays } from "date-fns";
import { db, getDay, getDaysInRange } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import {
  analyzeEnergy,
  buildDayPlan,
  flattenTasks,
  type DayPlan,
} from "@/engine";
import type { DayRecord, HabitDef } from "@/types";

/**
 * A recommended plan for a single day. Reads the target day, all habits, and
 * the last 30 days (to learn the user's energy peak), then asks the Planner
 * Engine to shape a suggested schedule. Recommendations only — nothing is
 * written back. Inert when `dateKey` is null.
 */
export function usePlanner(
  dateKey: string | null,
  today: Date | null,
): DayPlan | null {
  const day = useLiveQuery(
    () => (dateKey ? getDay(dateKey) : Promise.resolve<DayRecord | undefined>(undefined)),
    [dateKey],
  );
  const habits = useLiveQuery(
    () => (dateKey ? db.habits.toArray() : Promise.resolve<HabitDef[]>([])),
    [dateKey],
  );
  const recentDays = useLiveQuery(() => {
    if (!dateKey || !today) return Promise.resolve<DayRecord[]>([]);
    const from = toDateKey(subDays(today, 30));
    return getDaysInRange(from, toDateKey(today));
  }, [dateKey, today ? toDateKey(today) : null]);

  return useMemo(() => {
    if (!dateKey || !today || !day || !habits || !recentDays) return null;
    const todayKey = toDateKey(today);
    const energy = analyzeEnergy(flattenTasks(recentDays));
    return buildDayPlan(
      dateKey,
      day,
      habits,
      todayKey,
      energy.peakPart ?? "morning",
    );
  }, [dateKey, today, day, habits, recentDays]);
}

/** Convenience: format a plan's total minutes as a compact "2h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
