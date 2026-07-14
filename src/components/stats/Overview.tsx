"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ACCENTS } from "@/lib/constants";
import type { JournalStats } from "@/hooks/useJournalStats";

interface OverviewProps {
  stats: JournalStats;
  accentHex: string;
}

/** Section 1 — a calm hero: today's ring beside the week's headline numbers. */
export function Overview({ stats, accentHex }: OverviewProps) {
  const metrics = [
    { label: "This week", value: stats.weekCompletion, suffix: "%" },
    { label: "Habit streak", value: stats.currentStreak, suffix: "", flame: true },
    { label: "Tasks this week", value: stats.tasksThisWeek, suffix: "" },
    { label: "Longest streak", value: stats.longestStreak, suffix: "d" },
    { label: "This month", value: stats.monthProgress, suffix: "%" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-line bg-card p-6 shadow-soft sm:p-8"
      aria-label="Productivity overview"
    >
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <ProgressRing
            ratio={stats.todayCompletion / 100}
            size={132}
            stroke={10}
            color={accentHex}
            colorTo={ACCENTS.burgundy.hex === accentHex ? "#C6416A" : accentHex}
            shadow
          >
            <div className="flex flex-col items-center">
              <AnimatedNumber
                value={stats.todayCompletion}
                suffix="%"
                className="font-display text-3xl font-light tabular-nums text-ink"
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                Today
              </span>
            </div>
          </ProgressRing>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col">
              <span className="flex items-baseline gap-1 font-display text-3xl font-light tabular-nums text-ink">
                {m.flame && stats.currentStreak > 0 && (
                  <Flame className="h-5 w-5 text-accent" />
                )}
                <AnimatedNumber value={m.value} suffix={m.suffix} />
              </span>
              <span className="mt-0.5 text-[13px] text-ink-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
