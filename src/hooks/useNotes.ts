"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { addNote, db, deleteNote, updateNote } from "@/lib/db";
import { makeBlock } from "@/workspace";
import type { NoteBlock, NoteBlockType, WorkspaceNote } from "@/types";

export interface UseNotesResult {
  notes: WorkspaceNote[];
  loading: boolean;
  create: (title?: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
  setTitle: (id: string, title: string) => Promise<void>;
  setPinned: (id: string, pinned: boolean) => Promise<void>;
  setBlocks: (id: string, blocks: NoteBlock[]) => Promise<void>;
  addBlock: (id: string, after: string | null, type?: NoteBlockType) => Promise<void>;
}

/**
 * Live-bound notes for a single workspace, pinned-first then newest-updated.
 * Block editing goes through `setBlocks`; the editor owns block-level state and
 * persists the whole array (debounced) so autosave stays simple and atomic.
 */
export function useNotes(workspaceId: string | null): UseNotesResult {
  const raw = useLiveQuery(
    () =>
      workspaceId
        ? db.notes.where("workspaceId").equals(workspaceId).toArray()
        : Promise.resolve<WorkspaceNote[]>([]),
    [workspaceId],
  );

  const notes = (raw ?? []).slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  const create = useCallback(
    (title = "Untitled note") =>
      workspaceId ? addNote(workspaceId, title) : Promise.resolve(""),
    [workspaceId],
  );
  const remove = useCallback((id: string) => deleteNote(id), []);
  const setTitle = useCallback((id: string, title: string) => updateNote(id, { title }), []);
  const setPinned = useCallback((id: string, pinned: boolean) => updateNote(id, { pinned }), []);
  const setBlocks = useCallback((id: string, blocks: NoteBlock[]) => updateNote(id, { blocks }), []);

  const addBlock = useCallback(
    async (id: string, after: string | null, type: NoteBlockType = "text") => {
      const note = await db.notes.get(id);
      if (!note) return;
      const block = makeBlock(type);
      const idx = after ? note.blocks.findIndex((b) => b.id === after) : -1;
      const blocks =
        idx >= 0
          ? [...note.blocks.slice(0, idx + 1), block, ...note.blocks.slice(idx + 1)]
          : [...note.blocks, block];
      await updateNote(id, { blocks });
    },
    [],
  );

  return {
    notes,
    loading: raw === undefined,
    create,
    remove,
    setTitle,
    setPinned,
    setBlocks,
    addBlock,
  };
}
