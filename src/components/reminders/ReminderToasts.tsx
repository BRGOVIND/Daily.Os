"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import type { ReminderTarget } from "@/hooks/useReminders";

export interface FiredReminder extends ReminderTarget {
  /** Unique per firing so re-fires stack rather than dedupe. */
  fireId: string;
}

interface ReminderToastsProps {
  items: FiredReminder[];
  onSnooze: (item: FiredReminder, minutes: number) => void;
  onTomorrow: (item: FiredReminder) => void;
  onDismiss: (item: FiredReminder) => void;
  onClose: (fireId: string) => void;
}

/**
 * A stack of actionable reminder banners. Each offers snooze (5m / 10m /
 * tomorrow) and dismiss, so a fired reminder can be acted on without hunting
 * for the task.
 */
export function ReminderToasts({
  items,
  onSnooze,
  onTomorrow,
  onDismiss,
  onClose,
}: ReminderToastsProps) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[70] flex w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col gap-2 sm:left-6 sm:translate-x-0">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.fireId}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto rounded-2xl bg-card p-3.5 shadow-lift ring-1 ring-fill/5"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Reminder
                </p>
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
              </div>
              <button
                type="button"
                onClick={() => onClose(item.fireId)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <ActionChip label="5 min" onClick={() => onSnooze(item, 5)} />
              <ActionChip label="10 min" onClick={() => onSnooze(item, 10)} />
              <ActionChip label="Tomorrow" onClick={() => onTomorrow(item)} />
              <ActionChip label="Dismiss" onClick={() => onDismiss(item)} solid />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
  solid = false,
}: {
  label: string;
  onClick: () => void;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        solid
          ? "rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          : "rounded-full bg-fill/[0.05] px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-fill/[0.09]"
      }
    >
      {label}
    </button>
  );
}
