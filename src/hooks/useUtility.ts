"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, saveUtility } from "@/lib/db";

export interface UseUtilityResult<T> {
  data: T;
  loaded: boolean;
  save: (next: T) => void;
}

/**
 * Live-bound persistence for a single small utility. Reads its blob from the
 * `utilities` table and writes it back on `save`. `fallback` is used until a
 * blob exists. Tools that host live text inputs should keep local state and
 * call `save` on change.
 */
export function useUtility<T>(id: string, fallback: T): UseUtilityResult<T> {
  const raw = useLiveQuery(() => db.utilities.get(id), [id]);
  const data = raw ? (raw.data as T) : fallback;
  const save = useCallback((next: T) => void saveUtility(id, next), [id]);
  return { data, loaded: raw !== undefined, save };
}
