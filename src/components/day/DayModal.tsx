"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TodaysFocus } from "@/components/review/TodaysFocus";
import { TaskList } from "@/components/tasks/TaskList";
import { PlannerCard } from "@/components/day/PlannerCard";
import { Habits } from "@/components/habits/Habits";
import { Notes } from "@/components/notes/Notes";
import { useDay } from "@/hooks/useDay";
import { useHabits } from "@/hooks/useHabits";
import { moveTaskToDay, restoreDeletedTask, restoreMovedTask } from "@/lib/db";
import { formatDayHeader, fromDateKey, isToday, nextDayKey, toDateKey } from "@/lib/date";

interface UndoAction {
  message: string;
  restore?: () => Promise<boolean>;
}

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
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  useEffect(() => setUndoAction(null), [dateKey]);
  useEffect(() => {
    if (!undoAction) return;
    const timer = window.setTimeout(() => setUndoAction(null), 10000);
    return () => window.clearTimeout(timer);
  }, [undoAction]);

  const header = dateKey
    ? formatDayHeader(fromDateKey(dateKey))
    : { weekday: "", date: "" };
  const isCurrentDay = dateKey ? isToday(fromDateKey(dateKey)) : false;

  const handleDeleteTask = (id: string) => {
    if (!dateKey) return;
    const task = day.tasks.find((item) => item.id === id);
    if (!task) return;
    const sourceKey = dateKey;
    void deleteTask(id)
      .then(() => setUndoAction({
        message: "Task deleted",
        restore: () => restoreDeletedTask(sourceKey, task),
      }))
      .catch(() => setUndoAction({ message: "Could not delete task" }));
  };

  const handleMoveTask = (id: string) => {
    if (!dateKey) return;
    const sourceKey = dateKey;
    const targetKey = nextDayKey(sourceKey);
    void moveTaskToDay(sourceKey, targetKey, id)
      .then((original) => {
        if (!original) return;
        setUndoAction({
          message: isCurrentDay ? "Moved to tomorrow" : "Moved to next day",
          restore: () => restoreMovedTask(sourceKey, targetKey, original),
        });
      })
      .catch(() => setUndoAction({ message: "Could not move task" }));
  };

  const handleUndo = () => {
    const restore = undoAction?.restore;
    if (!restore) return;
    setUndoAction(null);
    void restore().then((restored) => {
      if (!restored) setUndoAction({ message: "Undo unavailable" });
    }).catch(() => {
      setUndoAction({ message: "Undo failed" });
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${header.weekday}, ${header.date}`}
      description="Day workspace"
      variant="sheet"
    >
      <div className="relative flex max-h-[94dvh] flex-col sm:max-h-[calc(100dvh-3rem)]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-6 pt-9 sm:px-10 sm:pt-10">
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
            onDelete={handleDeleteTask}
            onMoveToNextDay={handleMoveTask}
            onAdd={() => dateKey && onRequestAddTask(dateKey)}
            today={today ? toDateKey(today) : undefined}
          />

          <PlannerCard dateKey={dateKey} today={today} />

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

        {undoAction && (
          <div role="status" className="absolute inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 rounded-2xl bg-[#242127] px-4 py-3 text-sm text-white shadow-lift sm:inset-x-10">
            <span>{undoAction.message}</span>
            {undoAction.restore && (
              <button type="button" onClick={handleUndo} className="shrink-0 rounded-full px-3 py-1 font-semibold text-white underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Undo
              </button>
            )}
          </div>
        )}

        {/* Floating save/done — changes persist automatically */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-card via-card/95 to-transparent px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-10">
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
