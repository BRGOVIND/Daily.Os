"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import type { PomodoroSession } from "@/types";

export interface PomodoroDayStats {
  sessions: PomodoroSession[];
  /** Focus intervals completed today. */
  focusCompleted: number;
  /** Total focused minutes today (completed + partial). */
  focusMinutes: number;
  /** Break intervals completed today. */
  breaks: number;
  loading: boolean;
}

/** Today's Pomodoro history and aggregates, live from IndexedDB. */
export function usePomodoroStats(today: Date | null): PomodoroDayStats {
  const key = today ? toDateKey(today) : null;
  const rows = useLiveQuery(
    () =>
      key
        ? db.pomodoroSessions.where("date").equals(key).toArray()
        : Promise.resolve([] as PomodoroSession[]),
    [key],
  );

  return useMemo(() => {
    const sessions = (rows ?? [])
      .slice()
      .sort((a, b) => b.startedAt - a.startedAt);
    const focus = sessions.filter((s) => s.phase === "focus");
    const focusSeconds = focus.reduce((sum, s) => sum + s.elapsedSeconds, 0);
    return {
      sessions,
      focusCompleted: focus.filter((s) => s.completed).length,
      focusMinutes: Math.round(focusSeconds / 60),
      breaks: sessions.filter((s) => s.phase !== "focus" && s.completed).length,
      loading: rows === undefined,
    };
  }, [rows]);
}
