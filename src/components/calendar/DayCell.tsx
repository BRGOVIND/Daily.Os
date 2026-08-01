"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { dayProgress } from "@/lib/status";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { CalendarCell } from "@/lib/date";
import type { DaySummary } from "@/hooks/useMonthSummary";

interface DayCellProps {
  cell: CalendarCell;
  summary?: DaySummary;
  onSelect: (key: string) => void;
  /** Phone geometry — smaller rings so cells stay square without overflow. */
  compact?: boolean;
}

/**
 * A single calendar day. Large touch target, quiet by default, with an
 * animated status ring (grey/green/yellow/red) when the day holds tasks and a
 * burgundy fill on today.
 *
 * Memoized with a value-based comparison so that changing one day's tallies
 * re-renders only that cell — not all 42 rings — when the month summary updates.
 */
function DayCellBase({ cell, summary, onSelect, compact = false }: DayCellProps) {
  const { date, key, inMonth, isToday } = cell;
  const total = summary?.total ?? 0;
  const completed = summary?.completed ?? 0;
  const { ratio, color, status } = dayProgress(total, completed);
  const dayNumber = format(date, "d");
  const hasTasks = total > 0;

  // Ring sizes scale with the cell: compact fits ~40px phone cells; the larger
  // desktop sizes fill the roomier grid. The number bubble stays a hair smaller
  // than the ring's inner diameter so the ring reads as a clean outer track,
  // Apple-activity-ring style.
  const ringToday = compact ? 34 : 46;
  const ringTask = compact ? 32 : 40;
  const stroke = compact ? 2.5 : 3;
  const bubble = compact ? "h-7 w-7 text-[13px]" : "h-9 w-9 text-base";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(key)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      aria-label={`${format(date, "EEEE, MMMM d, yyyy")}${
        hasTasks ? `, ${completed} of ${total} tasks done` : ""
      }`}
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "group relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:aspect-[4/5]",
        inMonth
          ? "border-line bg-card hover:border-ink/15 hover:shadow-soft"
          : "border-transparent bg-transparent",
      )}
    >
      {isToday ? (
        <span className="relative flex items-center justify-center">
          {hasTasks && status !== "complete" && (
            // inset-0 + flex centers the ring squarely over the number — the
            // previous bare `absolute` pinned it to the top-left, off-centre.
            <span className="absolute inset-0 flex items-center justify-center">
              <ProgressRing
                ratio={ratio}
                color={color}
                size={ringToday}
                stroke={stroke}
                trackColor="transparent"
              />
            </span>
          )}
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-accent font-semibold text-white shadow-glow",
              bubble,
            )}
          >
            {dayNumber}
          </span>
        </span>
      ) : hasTasks && inMonth ? (
        <ProgressRing ratio={ratio} color={color} size={ringTask} stroke={stroke}>
          <span
            className={cn(
              "font-medium tabular-nums text-ink",
              compact ? "text-[13px]" : "text-base",
            )}
          >
            {dayNumber}
          </span>
        </ProgressRing>
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full tabular-nums",
            bubble,
            inMonth ? "font-medium text-ink" : "text-ink-muted/40",
          )}
        >
          {dayNumber}
        </span>
      )}

      {/* Completed check dot */}
      {status === "complete" && (
        <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-success sm:bottom-2" />
      )}
    </motion.button>
  );
}

export const DayCell = memo(DayCellBase, (prev, next) => {
  return (
    prev.cell.key === next.cell.key &&
    prev.cell.inMonth === next.cell.inMonth &&
    prev.cell.isToday === next.cell.isToday &&
    prev.compact === next.compact &&
    (prev.summary?.total ?? 0) === (next.summary?.total ?? 0) &&
    (prev.summary?.completed ?? 0) === (next.summary?.completed ?? 0) &&
    prev.onSelect === next.onSelect
  );
});
