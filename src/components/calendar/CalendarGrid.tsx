"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buildMonthGrid, WEEKDAY_LABELS } from "@/lib/date";
import { format } from "date-fns";
import { DayCell } from "./DayCell";
import type { DaySummary } from "@/hooks/useMonthSummary";

interface CalendarGridProps {
  month: Date;
  direction: number;
  summaries: Record<string, DaySummary>;
  onSelect: (key: string) => void;
}

/** The animated 7×6 grid. The whole grid slides on month change. */
export function CalendarGrid({
  month,
  direction,
  summaries,
  onSelect,
}: CalendarGridProps) {
  const monthKey = format(month, "yyyy-MM");
  // Stable cell objects per month so memoized DayCells aren't re-rendered by
  // grid rebuilds on unrelated state changes.
  const cells = useMemo(() => buildMonthGrid(month), [month]);

  return (
    <div>
      <div className="mb-3 grid grid-cols-7 gap-2 sm:gap-3">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted/70"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={monthKey}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="grid grid-cols-7 gap-2 sm:gap-3"
          >
            {cells.map((cell) => (
              <DayCell
                key={cell.key}
                cell={cell}
                summary={summaries[cell.key]}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
