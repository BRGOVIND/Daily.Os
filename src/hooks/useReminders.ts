"use client";

import { useEffect, useRef } from "react";
import { showNotification } from "@/lib/notifications";
import { format } from "date-fns";

export interface ReminderTarget {
  id: string;
  title: string;
  reminderAt: number;
}

const MAX_HORIZON_MS = 24 * 60 * 60 * 1000;

/**
 * Schedules in-session browser notifications for upcoming task reminders.
 * Only reminders within the next 24h are timed; past-due ones are skipped.
 * Timers are rebuilt whenever the target set changes and cleared on unmount.
 */
export function useReminders(
  targets: ReminderTarget[],
  enabled: boolean,
): void {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();

    for (const t of targets) {
      const delay = t.reminderAt - now;
      const fireKey = `${t.id}:${t.reminderAt}`;
      if (delay <= 0 || delay > MAX_HORIZON_MS) continue;
      if (firedRef.current.has(fireKey)) continue;

      const timer = setTimeout(() => {
        firedRef.current.add(fireKey);
        showNotification(
          "Reminder · Daily OS",
          `${t.title} — ${format(t.reminderAt, "p")}`,
        );
      }, delay);
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [targets, enabled]);
}
