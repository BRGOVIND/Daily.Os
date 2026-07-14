"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Target } from "lucide-react";
import { format } from "date-fns";
import { useDay } from "@/hooks/useDay";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TodayPreviewProps {
  today: Date;
  onOpen: (key: string) => void;
}

/**
 * A quiet card beneath the calendar that previews today at a glance and is the
 * fastest path into today's workspace.
 */
export function TodayPreview({ today, onOpen }: TodayPreviewProps) {
  const key = toDateKey(today);
  const { day } = useDay(key);

  const open = day.tasks.filter((t) => !t.completed).length;
  const done = day.tasks.filter((t) => t.completed).length;
  const focus = day.focus;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(key)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="group mt-10 flex w-full items-center justify-between gap-6 rounded-3xl border border-line bg-card p-6 text-left shadow-soft transition-all hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:p-8"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          Today
        </p>
        <p className="mt-1 font-display text-2xl font-light tracking-tight text-ink sm:text-3xl">
          {format(today, "EEEE, MMMM d")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent/70" />
            {open} {open === 1 ? "task" : "tasks"} open
          </span>
          {done > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              {done} done
            </span>
          )}
          {focus.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {focus.length} focus
            </span>
          )}
          {day.tasks.length === 0 && focus.length === 0 && (
            <span className="text-ink-muted/70">A clean slate. Tap to begin.</span>
          )}
        </div>
      </div>

      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-all",
          "group-hover:border-accent group-hover:bg-accent group-hover:text-white",
        )}
      >
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </motion.button>
  );
}
