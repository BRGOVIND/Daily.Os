"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDaysInRange } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { endOfMonth, startOfMonth } from "date-fns";

export interface DaySummary {
  total: number;
  completed: number;
}

/**
 * Reactive per-day summary (task totals + completed) for every stored day in
 * the visible month, keyed by date. Powers the activity indicators on cells.
 */
export function useMonthSummary(month: Date): Record<string, DaySummary> {
  const fromKey = toDateKey(startOfMonth(month));
  const toKey = toDateKey(endOfMonth(month));

  const records = useLiveQuery(
    () => getDaysInRange(fromKey, toKey),
    [fromKey, toKey],
  );

  return useMemo(() => {
    const map: Record<string, DaySummary> = {};
    for (const rec of records ?? []) {
      map[rec.date] = {
        total: rec.tasks.length,
        completed: rec.tasks.filter((t) => t.completed).length,
      };
    }
    return map;
  }, [records]);
}
