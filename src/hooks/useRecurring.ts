"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { createId } from "@/lib/utils";
import type { RecurringTask } from "@/types";

export interface UseRecurringResult {
  recurring: RecurringTask[];
  loading: boolean;
  create: (input: Omit<RecurringTask, "id" | "createdAt">) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

/** Global recurring-task definitions. Materialization happens per-day. */
export function useRecurring(): UseRecurringResult {
  const recurring = useLiveQuery(
    () => db.recurring.orderBy("createdAt").toArray(),
    [],
  );

  const create = useCallback(
    async (input: Omit<RecurringTask, "id" | "createdAt">) => {
      const id = createId();
      await db.recurring.add({ ...input, id, createdAt: Date.now() });
      return id;
    },
    [],
  );

  const remove = useCallback((id: string) => db.recurring.delete(id), []);

  return {
    recurring: recurring ?? [],
    loading: recurring === undefined,
    create,
    remove,
  };
}
