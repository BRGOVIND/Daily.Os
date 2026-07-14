"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/hooks/useJournalStats";

interface AchievementsProps {
  achievements: Achievement[];
}

/** Section 5 — milestone cards; unlocked ones glow, locked ones show progress. */
export function Achievements({ achievements }: AchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <section aria-label="Achievements" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-light tracking-tight text-ink">
          Milestones
        </h3>
        <span className="text-[13px] text-ink-muted">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-4 transition-colors",
              a.unlocked
                ? "border-accent/20 bg-accent/[0.04]"
                : "border-line bg-canvas/50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("text-2xl", !a.unlocked && "opacity-40 grayscale")}>
                {a.icon}
              </span>
              {a.unlocked && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Done
                </span>
              )}
            </div>
            <div>
              <p className={cn("text-[15px] font-medium", a.unlocked ? "text-ink" : "text-ink-muted")}>
                {a.title}
              </p>
              <p className="text-xs text-ink-muted/80">{a.description}</p>
            </div>
            {!a.unlocked && (
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full bg-accent/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(a.progress * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
