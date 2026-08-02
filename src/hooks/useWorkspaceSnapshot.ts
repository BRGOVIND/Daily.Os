"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { DatedTask, ReviewMark, WorkspaceSnapshot } from "@/workspace";
import type {
  DayRecord,
  HabitDef,
  JournalEntry,
  Mission,
  Resource,
  Template,
  Workspace,
  WorkspaceNote,
} from "@/types";

/** Small helper: an empty query result typed to the table's element type. */
function none<T>(): Promise<T[]> {
  return Promise.resolve<T[]>([]);
}

const EMPTY: WorkspaceSnapshot = {
  workspaces: [],
  tasks: [],
  missions: [],
  notes: [],
  resources: [],
  journal: [],
  reviews: [],
  habits: [],
  templates: [],
};

/**
 * Reads every table the Workspace OS domain reasons over and folds them into a
 * single {@link WorkspaceSnapshot}, memoized on the underlying arrays so the
 * (pure) domain functions only re-run when data actually changes. When `enabled`
 * is false the hook stays inert — no snapshot is built.
 */
export function useWorkspaceSnapshot(enabled = true): WorkspaceSnapshot {
  const days = useLiveQuery(() => (enabled ? db.days.toArray() : none<DayRecord>()), [enabled]);
  const workspaces = useLiveQuery(() => (enabled ? db.workspaces.toArray() : none<Workspace>()), [enabled]);
  const missions = useLiveQuery(() => (enabled ? db.missions.toArray() : none<Mission>()), [enabled]);
  const notes = useLiveQuery(() => (enabled ? db.notes.toArray() : none<WorkspaceNote>()), [enabled]);
  const resources = useLiveQuery(() => (enabled ? db.resources.toArray() : none<Resource>()), [enabled]);
  const journal = useLiveQuery(() => (enabled ? db.journal.toArray() : none<JournalEntry>()), [enabled]);
  const habits = useLiveQuery(() => (enabled ? db.habits.toArray() : none<HabitDef>()), [enabled]);
  const templates = useLiveQuery(() => (enabled ? db.templates.toArray() : none<Template>()), [enabled]);

  return useMemo<WorkspaceSnapshot>(() => {
    if (!enabled || !days) return EMPTY;

    const tasks: DatedTask[] = [];
    const reviews: ReviewMark[] = [];
    for (const day of days) {
      for (const task of day.tasks) tasks.push({ task, date: day.date });
      if (day.review) reviews.push({ date: day.date, completedAt: day.review.completedAt });
    }

    return {
      workspaces: workspaces ?? [],
      tasks,
      missions: missions ?? [],
      notes: notes ?? [],
      resources: resources ?? [],
      journal: journal ?? [],
      reviews,
      habits: habits ?? [],
      templates: templates ?? [],
    };
  }, [enabled, days, workspaces, missions, notes, resources, journal, habits, templates]);
}
