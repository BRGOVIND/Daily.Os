"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { buildIntelligenceReport, type IntelligenceReport } from "@/engine";
import type { DayRecord, HabitDef, Mission } from "@/types";

/**
 * Runs the full Intelligence Engine over the live database, memoized on the
 * underlying data so the (non-trivial) computation only re-runs when days,
 * habits or missions actually change. Inert when `today` is null — the modal
 * that consumes it is closed, so nothing is read or computed.
 */
export function useIntelligence(today: Date | null): IntelligenceReport | null {
  const days = useLiveQuery(
    () => (today ? db.days.toArray() : Promise.resolve<DayRecord[]>([])),
    [today !== null],
  );
  const habits = useLiveQuery(
    () => (today ? db.habits.toArray() : Promise.resolve<HabitDef[]>([])),
    [today !== null],
  );
  const missions = useLiveQuery(
    () => (today ? db.missions.toArray() : Promise.resolve<Mission[]>([])),
    [today !== null],
  );

  return useMemo(() => {
    if (!today || !days || !habits || !missions) return null;
    return buildIntelligenceReport({
      today: toDateKey(today),
      days,
      habits,
      missions,
    });
  }, [today, days, habits, missions]);
}
