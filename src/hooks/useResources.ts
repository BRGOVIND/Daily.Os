"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addResource,
  db,
  deleteResource,
  updateResource,
  type ResourceInput,
} from "@/lib/db";
import type { Resource } from "@/types";

export interface UseResourcesResult {
  resources: Resource[];
  loading: boolean;
  create: (input: ResourceInput) => Promise<string>;
  update: (id: string, patch: Partial<Omit<Resource, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePinned: (id: string, pinned: boolean) => Promise<void>;
  toggleFavorite: (id: string, favorite: boolean) => Promise<void>;
}

/** Live-bound resource library for a single workspace. */
export function useResources(workspaceId: string | null): UseResourcesResult {
  const raw = useLiveQuery(
    () =>
      workspaceId
        ? db.resources.where("workspaceId").equals(workspaceId).toArray()
        : Promise.resolve<Resource[]>([]),
    [workspaceId],
  );

  const create = useCallback((input: ResourceInput) => addResource(input), []);
  const update = useCallback(
    (id: string, patch: Partial<Omit<Resource, "id" | "createdAt">>) =>
      updateResource(id, patch),
    [],
  );
  const remove = useCallback((id: string) => deleteResource(id), []);
  const togglePinned = useCallback(
    (id: string, pinned: boolean) => updateResource(id, { pinned }),
    [],
  );
  const toggleFavorite = useCallback(
    (id: string, favorite: boolean) => updateResource(id, { favorite }),
    [],
  );

  return {
    resources: raw ?? [],
    loading: raw === undefined,
    create,
    update,
    remove,
    togglePinned,
    toggleFavorite,
  };
}
