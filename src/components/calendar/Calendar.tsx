"use client";

import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { useMonthSummary } from "@/hooks/useMonthSummary";

interface CalendarProps {
  month: Date;
  direction: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelect: (key: string) => void;
}

/** The hero: month header + animated grid, driven by live per-day summaries. */
export function Calendar({
  month,
  direction,
  onPrev,
  onNext,
  onToday,
  onSelect,
}: CalendarProps) {
  const summaries = useMonthSummary(month);

  return (
    <section aria-label="Calendar">
      <CalendarHeader
        month={month}
        direction={direction}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />
      <CalendarGrid
        month={month}
        direction={direction}
        summaries={summaries}
        onSelect={onSelect}
      />
    </section>
  );
}
