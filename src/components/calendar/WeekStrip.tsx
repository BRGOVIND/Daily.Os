"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { addDays, format, startOfWeek } from "date-fns";
import { getDaysInRange } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

interface WeekStripProps {
  today: Date;
  onSelect: (dateKey: string) => void;
}

/** Phone-sized week overview with direct access to each day's workspace. */
export function WeekStrip({ today, onSelect }: WeekStripProps) {
  const todayKey = toDateKey(today);
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const fromKey = toDateKey(days[0]);
  const toKey = toDateKey(days[6]);
  const records = useLiveQuery(() => getDaysInRange(fromKey, toKey), [fromKey, toKey]);
  const taskCounts = useMemo(
    () => new Map((records ?? []).map((record) => [record.date, record.tasks.length])),
    [records],
  );

  return (
    <section aria-label="This week" className="mb-4 rounded-3xl border border-line bg-card px-3 pb-3 pt-3 shadow-soft sm:hidden">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">This week</h2>
        <span className="text-xs text-ink-muted">{format(days[0], "MMM d")}–{format(days[6], "MMM d")}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const key = toDateKey(date);
          const current = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={format(date, "EEEE, MMMM d, yyyy")}
              aria-current={current ? "date" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-2xl px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                current ? "bg-accent text-white" : "text-ink hover:bg-canvas",
              )}
            >
              <span className={cn("text-[10px] font-medium", current ? "text-white" : "text-ink-muted")}>{format(date, "EEE")}</span>
              <span className="mt-0.5 text-sm font-semibold tabular-nums">{format(date, "d")}</span>
              <span aria-hidden className={cn("mt-1 h-1 w-1 rounded-full", taskCounts.get(key) ? current ? "bg-white" : "bg-accent" : "bg-transparent")} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
