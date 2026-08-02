"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { addDays, toDateKey } from "@/lib/date";
import { sortTasks } from "@/hooks/useDay";
import type { DayRecord, Task } from "@/types";

export interface AgendaDay {
  key: string;
  date: Date;
  tasks: Task[];
}

export interface Agenda {
  today: AgendaDay;
  tomorrow: AgendaDay;
  /** Days beyond tomorrow (within the horizon) that have open tasks. */
  upcoming: AgendaDay[];
  /** Total open tasks across the whole horizon. */
  openCount: number;
  loading: boolean;
}

/**
 * A forward-looking agenda: today, tomorrow and the upcoming days within
 * `horizonDays`. Only open (incomplete) tasks are surfaced; empty upcoming days
 * are dropped so the list stays tight.
 */
export function useAgenda(today: Date | null, horizonDays = 14): Agenda {
  const fromKey = today ? toDateKey(today) : null;
  const toKey = today ? toDateKey(addDays(today, horizonDays)) : null;

  const rows = useLiveQuery(
    () =>
      fromKey && toKey
        ? db.days.where("date").between(fromKey, toKey, true, true).toArray()
        : Promise.resolve([] as DayRecord[]),
    [fromKey, toKey],
  );

  return useMemo(() => {
    const base = today ?? new Date();
    const byKey = new Map((rows ?? []).map((d) => [d.date, d]));
    const openTasks = (key: string): Task[] =>
      sortTasks((byKey.get(key)?.tasks ?? []).filter((t) => !t.completed));

    const dayFor = (offset: number): AgendaDay => {
      const date = addDays(base, offset);
      const key = toDateKey(date);
      return { key, date, tasks: openTasks(key) };
    };

    const todayDay = dayFor(0);
    const tomorrowDay = dayFor(1);
    const upcoming: AgendaDay[] = [];
    for (let i = 2; i <= horizonDays; i++) {
      const d = dayFor(i);
      if (d.tasks.length > 0) upcoming.push(d);
    }

    const openCount =
      todayDay.tasks.length +
      tomorrowDay.tasks.length +
      upcoming.reduce((sum, d) => sum + d.tasks.length, 0);

    return {
      today: todayDay,
      tomorrow: tomorrowDay,
      upcoming,
      openCount,
      loading: rows === undefined,
    };
  }, [rows, today, horizonDays]);
}
