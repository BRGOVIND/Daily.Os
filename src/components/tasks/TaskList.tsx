"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, Plus, SlidersHorizontal } from "lucide-react";
import { sortTasks } from "@/hooks/useDay";
import { cn } from "@/lib/utils";
import { TaskItem } from "./TaskItem";
import {
  DEFAULT_FILTER,
  TaskFilterBar,
  type TaskFilter,
} from "./TaskFilterBar";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function matches(task: Task, filter: TaskFilter): boolean {
  if (filter.hideCompleted && task.completed) return false;
  if (filter.priority !== "all" && task.priority !== filter.priority) return false;
  if (filter.category !== "all" && task.category !== filter.category) return false;
  return true;
}

/** Ordered, filterable task list — completed items animate to the bottom. */
export function TaskList({ tasks, onToggle, onDelete, onAdd }: TaskListProps) {
  const [filter, setFilter] = useState<TaskFilter>(DEFAULT_FILTER);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category))).sort(),
    [tasks],
  );

  const ordered = useMemo(
    () => sortTasks(tasks).filter((t) => matches(t, filter)),
    [tasks, filter],
  );
  const remaining = tasks.filter((t) => !t.completed).length;
  const canFilter = tasks.length > 1;

  return (
    <section aria-label="Tasks">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <ListChecks className="h-4 w-4" />
          Tasks
          {tasks.length > 0 && (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
              {remaining} left
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {canFilter && (
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-pressed={showFilters}
              aria-label="Filter tasks"
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors",
                showFilters
                  ? "bg-accent/10 text-accent"
                  : "text-ink-muted hover:bg-black/[0.04]",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && canFilter && (
          <TaskFilterBar
            filter={filter}
            categories={categories}
            onChange={setFilter}
          />
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-12 text-center"
        >
          <div>
            <p className="font-display text-xl font-light tracking-tight text-ink">
              A fresh day.
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">
              What would you like to build today?
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-soft transition-all hover:bg-accent-hover hover:shadow-glow active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            Add your first task
          </button>
        </motion.div>
      ) : ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-ink-muted">
          No tasks match these filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {ordered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
