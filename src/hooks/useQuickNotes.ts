"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addQuickNote,
  db,
  deleteQuickNote,
  toggleQuickNotePinned,
  updateQuickNote,
} from "@/lib/db";
import type { QuickNote } from "@/types";

export interface UseQuickNotesResult {
  /** Pinned notes plus the current day's notes, newest first. */
  visible: QuickNote[];
  /** Every quick note, for search. */
  all: QuickNote[];
  loading: boolean;
  add: (color?: QuickNote["color"]) => Promise<string>;
  update: (id: string, patch: Partial<Omit<QuickNote, "id" | "createdAt">>) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Live-bound quick notes for a day. Pinned notes surface on every day; the rest
 * belong to the day they were created on. Adding creates a note owned by `date`.
 */
export function useQuickNotes(date: string | null): UseQuickNotesResult {
  const all = useLiveQuery(() => db.quickNotes.toArray(), []);

  const visible = useMemo(() => {
    const rows = all ?? [];
    return rows
      .filter((n) => n.pinned || n.date === date)
      .sort((a, b) => {
        // Pinned first, then most-recently updated.
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [all, date]);

  const sortedAll = useMemo(
    () => (all ?? []).slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [all],
  );

  return {
    visible,
    all: sortedAll,
    loading: all === undefined,
    add: (color) => addQuickNote(date ?? new Date().toISOString().slice(0, 10), "", color),
    update: updateQuickNote,
    togglePin: toggleQuickNotePinned,
    remove: deleteQuickNote,
  };
}
