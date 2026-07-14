"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Repeat, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { COLOR_MAP, RECURRENCE_LABEL } from "@/lib/constants";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Memoized: with stable onToggle/onDelete callbacks, only the task whose
 * identity actually changed re-renders (and re-runs Framer layout), so
 * toggling one row no longer re-animates the whole list.
 */
export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onDelete,
}: TaskItemProps) {
  const swatch = COLOR_MAP[task.color];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border bg-card p-3.5 transition-colors sm:p-4",
        task.completed ? "border-transparent bg-canvas/60" : "border-line hover:border-ink/15",
      )}
    >
      {/* Color rail */}
      <span
        aria-hidden
        className="mt-0.5 h-[calc(100%-2px)] w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: task.completed ? "#E2E2E2" : swatch.dot }}
      />

      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={task.completed}
        aria-label={task.completed ? "Mark as not done" : "Mark as done"}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          task.completed
            ? "border-success bg-success text-white"
            : "border-line text-transparent hover:border-accent",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: task.completed ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[15px] leading-snug transition-colors",
            task.completed ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {task.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: swatch.soft, color: swatch.text }}
          >
            {task.category}
          </span>
          {task.priority === "high" && !task.completed && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          {task.recurrence !== "none" && (
            <span className="flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              <Repeat className="h-2.5 w-2.5" />
              {RECURRENCE_LABEL[task.recurrence]}
            </span>
          )}
          {task.reminderAt && (
            <span className="flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              <Bell className="h-2.5 w-2.5" />
              {format(task.reminderAt, "p")}
            </span>
          )}
          {task.notes && (
            <span className="truncate text-xs text-ink-muted/80">
              {task.notes}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted/50 opacity-0 transition-all hover:bg-accent/10 hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.li>
  );
});
