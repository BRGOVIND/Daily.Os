"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { usePlanner, formatDuration } from "@/hooks/usePlanner";
import { cn } from "@/lib/utils";
import type { DayPart } from "@/types";
import type { PlanItem } from "@/engine";

interface PlannerCardProps {
  dateKey: string | null;
  today: Date | null;
}

const PART_ICON: Record<DayPart, typeof Sun> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const BAND_DOT: Record<string, string> = {
  critical: "#E5484D",
  high: "#C13E6B",
  medium: "#F0B429",
  low: "#9AA0A6",
};

/**
 * A recommended schedule for the day, produced by the Planner Engine. Purely
 * advisory — it never edits the user's tasks. Collapsed by default so it stays
 * out of the way until asked for.
 */
export function PlannerCard({ dateKey, today }: PlannerCardProps) {
  const plan = usePlanner(dateKey, today);
  const [open, setOpen] = useState(false);

  if (!plan || !plan.hasWork) return null;

  return (
    <section className="rounded-2xl border border-line bg-canvas/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Suggested plan
          </span>
          <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-ink-muted">
            ~{formatDuration(plan.totalMinutes)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4">
              {plan.notes.length > 0 && (
                <div className="rounded-xl bg-accent/[0.06] px-3 py-2">
                  {plan.notes.map((note) => (
                    <p key={note} className="text-[12px] text-ink-muted">
                      {note}
                    </p>
                  ))}
                </div>
              )}

              {plan.sections.map((section) => {
                const Icon = PART_ICON[section.part];
                return (
                  <div key={section.part}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-ink-muted" />
                      <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        {section.label}
                      </span>
                      <span className="text-[11px] text-ink-muted/60">
                        {formatDuration(section.totalMinutes)}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {section.items.map((item) => (
                        <PlanRow key={item.id} item={item} />
                      ))}
                    </ul>
                  </div>
                );
              })}

              <p className="text-center text-[11px] text-ink-muted/60">
                A suggestion, not a schedule — your plan is yours to keep.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PlanRow({ item }: { item: PlanItem }) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg bg-card px-3 py-2">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: item.priorityBand
            ? BAND_DOT[item.priorityBand]
            : "#C9CED4",
        }}
      />
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
        {item.title}
      </span>
      <span className="shrink-0 text-[11px] text-ink-muted/70">
        {item.reason}
      </span>
    </li>
  );
}
