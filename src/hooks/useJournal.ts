"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteJournal, upsertJournal, type JournalInput } from "@/lib/db";
import { belongsTo, sortJournal } from "@/workspace";
import type { JournalEntry } from "@/types";

export interface UseJournalResult {
  entries: JournalEntry[];
  loading: boolean;
  entryFor: (date: string) => JournalEntry | null;
  save: (input: JournalInput) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

/**
 * Live-bound journal for a workspace, newest first. Legacy null-workspace
 * entries resolve to the default workspace via {@link belongsTo}, so nothing is
 * hidden. There is at most one entry per (date, workspace) — `save` upserts.
 */
export function useJournal(workspaceId: string | null): UseJournalResult {
  const raw = useLiveQuery(() => db.journal.toArray(), []);

  const entries = sortJournal(
    (raw ?? []).filter((e) => (workspaceId ? belongsTo(e.workspaceId, workspaceId) : false)),
  );

  const entryFor = useCallback(
    (date: string) => entries.find((e) => e.date === date) ?? null,
    [entries],
  );
  const save = useCallback((input: JournalInput) => upsertJournal(input), []);
  const remove = useCallback((id: string) => deleteJournal(id), []);

  return { entries, loading: raw === undefined, entryFor, save, remove };
}
