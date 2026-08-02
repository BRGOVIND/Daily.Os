"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  addStickyNote,
  db,
  deleteStickyNote,
  updateStickyNote,
} from "@/lib/db";
import type { StickyNote } from "@/types";

export interface UseStickyNotesResult {
  notes: StickyNote[];
  loading: boolean;
  add: () => Promise<string>;
  update: (id: string, patch: Partial<Omit<StickyNote, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Live-bound sticky notes for the workspace board. */
export function useStickyNotes(): UseStickyNotesResult {
  const notes = useLiveQuery(() => db.stickyNotes.toArray(), []);
  return {
    notes: (notes ?? []).slice().sort((a, b) => a.createdAt - b.createdAt),
    loading: notes === undefined,
    add: addStickyNote,
    update: updateStickyNote,
    remove: deleteStickyNote,
  };
}
