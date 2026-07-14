"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { emptyDay, getDay, updateDay } from "@/lib/db";
import { createId } from "@/lib/utils";
import { makeTask, taskFromTemplateItem } from "@/lib/tasks";
import { materializeRecurring } from "@/lib/recurringApply";
import { PRIORITY_WEIGHT } from "@/lib/constants";
import type {
  DailyReview,
  DayRecord,
  FocusItem,
  Task,
  TaskDraft,
  Template,
} from "@/types";

/** Completed tasks sink to the bottom; within a group, sort by priority then order. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const p = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (p !== 0) return p;
    return a.order - b.order;
  });
}

export interface UseDayResult {
  day: DayRecord;
  loading: boolean;
  addTask: (draft: TaskDraft) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskReminder: (id: string, reminderAt: number | null) => Promise<void>;
  applyTemplate: (template: Template) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  addFocus: (title: string) => Promise<void>;
  toggleFocus: (id: string) => Promise<void>;
  removeFocus: (id: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  saveReview: (review: Omit<DailyReview, "completedAt">) => Promise<void>;
}

/**
 * Live-bound workspace for a single day. Reads reactively via Dexie's
 * useLiveQuery and exposes transactional mutations. On date change it also
 * materializes any due recurring tasks. When `date` is null the hook is inert.
 */
export function useDay(date: string | null): UseDayResult {
  // Pull due recurring tasks into the day before/while we read it.
  useEffect(() => {
    if (date) void materializeRecurring(date);
  }, [date]);

  const live = useLiveQuery(
    () => (date ? getDay(date) : Promise.resolve(undefined)),
    [date],
  );

  const day = useMemo<DayRecord>(
    () => live ?? emptyDay(date ?? ""),
    [live, date],
  );

  const mutate = useCallback(
    (fn: (d: DayRecord) => DayRecord) => {
      if (!date) return Promise.resolve();
      return updateDay(date, fn).then(() => undefined);
    },
    [date],
  );

  const addTask = useCallback(
    (draft: TaskDraft) =>
      mutate((d) => ({ ...d, tasks: [...d.tasks, makeTask(draft, d.tasks.length)] })),
    [mutate],
  );

  const toggleTask = useCallback(
    (id: string) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        ),
      })),
    [mutate],
  );

  const deleteTask = useCallback(
    (id: string) =>
      mutate((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
    [mutate],
  );

  const setTaskReminder = useCallback(
    (id: string, reminderAt: number | null) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, reminderAt } : t)),
      })),
    [mutate],
  );

  const applyTemplate = useCallback(
    (template: Template) =>
      mutate((d) => {
        const base = d.tasks.length;
        const added = template.items.map((item, i) =>
          taskFromTemplateItem(item, base + i),
        );
        return { ...d, tasks: [...d.tasks, ...added] };
      }),
    [mutate],
  );

  const updateNotes = useCallback(
    (notes: string) => mutate((d) => ({ ...d, notes })),
    [mutate],
  );

  const addFocus = useCallback(
    (title: string) =>
      mutate((d) => {
        if (!title.trim()) return d;
        const item: FocusItem = { id: createId(), title: title.trim(), done: false };
        // Prepend so the newest focus appears immediately after the anchored
        // Add card. No limit — users can set as many intentions as they like.
        return { ...d, focus: [item, ...d.focus] };
      }),
    [mutate],
  );

  const toggleFocus = useCallback(
    (id: string) =>
      mutate((d) => ({
        ...d,
        focus: d.focus.map((f) => (f.id === id ? { ...f, done: !f.done } : f)),
      })),
    [mutate],
  );

  const removeFocus = useCallback(
    (id: string) =>
      mutate((d) => ({ ...d, focus: d.focus.filter((f) => f.id !== id) })),
    [mutate],
  );

  const toggleHabit = useCallback(
    (habitId: string) =>
      mutate((d) => ({
        ...d,
        habitLog: { ...d.habitLog, [habitId]: !d.habitLog[habitId] },
      })),
    [mutate],
  );

  const saveReview = useCallback(
    (review: Omit<DailyReview, "completedAt">) =>
      mutate((d) => ({
        ...d,
        review: { ...review, completedAt: Date.now() },
      })),
    [mutate],
  );

  return {
    day,
    loading: date !== null && live === undefined,
    addTask,
    toggleTask,
    deleteTask,
    setTaskReminder,
    applyTemplate,
    updateNotes,
    addFocus,
    toggleFocus,
    removeFocus,
    toggleHabit,
    saveReview,
  };
}
