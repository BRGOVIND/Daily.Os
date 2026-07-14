"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { JournalStats } from "@/hooks/useJournalStats";

interface YearInReviewProps {
  review: JournalStats["yearInReview"];
}

/** Section 6 — a quiet retrospective of the last year. */
export function YearInReview({ review }: YearInReviewProps) {
  const items: {
    label: string;
    text?: string;
    value?: number;
    suffix?: string;
  }[] = [
    { label: "Most productive month", text: review.mostProductiveMonth.label },
    { label: "Best habit", text: review.bestHabit?.name ?? "—" },
    { label: "Average completion", value: review.averageCompletion, suffix: "%" },
    { label: "Longest streak", value: review.longestStreak, suffix: " days" },
    { label: "Most active day", text: review.mostActiveWeekday.label },
    { label: "Best week", text: review.bestWeek.label },
  ];

  return (
    <section aria-label="Year in review" className="flex flex-col gap-4">
      <h3 className="font-display text-xl font-light tracking-tight text-ink">
        Year in review
      </h3>

      <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-2xl border border-line sm:grid-cols-2 sm:divide-y-0">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex items-center justify-between gap-4 px-5 py-4 sm:border-b sm:border-line even:sm:border-l"
          >
            <span className="text-[13px] text-ink-muted">{item.label}</span>
            <span className="font-display text-xl font-light tabular-nums text-ink">
              {item.value != null ? (
                <AnimatedNumber value={item.value} suffix={item.suffix} />
              ) : (
                item.text
              )}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
