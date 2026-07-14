"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TodaysFocus } from "@/components/review/TodaysFocus";
import { TaskList } from "@/components/tasks/TaskList";
import { Habits } from "@/components/habits/Habits";
import { Notes } from "@/components/notes/Notes";
import { useDay } from "@/hooks/useDay";
import { useHabits } from "@/hooks/useHabits";
import { formatDayHeader, fromDateKey, isToday } from "@/lib/date";

interface DayModalProps {
  dateKey: string | null;
  today: Date | null;
  onOpenChange: (open: boolean) => void;
  onRequestAddTask: (dateKey: string) => void;
  onOpenReview: (dateKey: string) => void;
}

/**
 * The full-day workspace. Opens as an animated sheet over the calendar —
 * never a route change. Everything inside autosaves to IndexedDB.
 */
export function DayModal({
  dateKey,
  today,
  onOpenChange,
  onRequestAddTask,
  onOpenReview,
}: DayModalProps) {
  const open = dateKey !== null;
  const {
    day,
    addFocus,
    toggleFocus,
    removeFocus,
    toggleTask,
    deleteTask,
    toggleHabit,
    updateNotes,
  } = useDay(dateKey);
  const { habits, addHabit, removeHabit } = useHabits(today);

  const header = dateKey
    ? formatDayHeader(fromDateKey(dateKey))
    : { weekday: "", date: "" };
  const isCurrentDay = dateKey ? isToday(fromDateKey(dateKey)) : false;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${header.weekday}, ${header.date}`}
      description="Day workspace"
      variant="sheet"
    >
      <div className="relative flex max-h-[calc(100dvh-3rem)] flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-6 pt-8 sm:px-10 sm:pt-10">
          <div>
            {isCurrentDay && (
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                Today
              </span>
            )}
            <div className="mt-1 flex items-baseline gap-3">
              <h2 className="font-display text-[2rem] font-light leading-none tracking-tight text-ink sm:text-5xl">
                {header.weekday}
              </h2>
            </div>
            <p className="mt-2 font-display text-xl font-light text-ink-muted sm:text-2xl">
              {header.date}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="mr-10 mt-1"
            onClick={() => dateKey && onOpenReview(dateKey)}
          >
            <Sparkles className="h-4 w-4" /> Review
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-9 overflow-y-auto px-6 pb-28 sm:px-10">
          <TodaysFocus
            items={day.focus}
            onAdd={addFocus}
            onToggle={toggleFocus}
            onRemove={removeFocus}
          />

          <div className="h-px bg-line" />

          <TaskList
            tasks={day.tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAdd={() => dateKey && onRequestAddTask(dateKey)}
          />

          <div className="h-px bg-line" />

          <Habits
            habits={habits}
            log={day.habitLog}
            onToggle={toggleHabit}
            onAdd={addHabit}
            onRemove={removeHabit}
          />

          <div className="h-px bg-line" />

          <Notes value={day.notes} onChange={updateNotes} />
        </div>

        {/* Floating save/done — changes persist automatically */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-card via-card/95 to-transparent px-6 pb-6 pt-8 sm:px-10">
          <span className="pointer-events-none text-xs text-ink-muted/70">
            Saved automatically
          </span>
          <motion.button
            type="button"
            onClick={() => onOpenChange(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-colors hover:bg-accent-hover"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Done
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
