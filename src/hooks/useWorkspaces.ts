"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addWorkspace,
  db,
  deleteWorkspace,
  saveSettings,
  updateWorkspace,
  type WorkspaceInput,
} from "@/lib/db";
import { DEFAULT_WORKSPACE_ID } from "@/lib/constants";
import type { Workspace } from "@/types";

export interface UseWorkspacesResult {
  workspaces: Workspace[];
  active: Workspace | null;
  activeId: string;
  loading: boolean;
  create: (input: WorkspaceInput) => Promise<string>;
  update: (id: string, patch: Partial<Omit<Workspace, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
}

/**
 * Live-bound workspace list plus CRUD and the currently-focused workspace. The
 * active id is persisted in settings so it survives reloads; it falls back to
 * the default workspace whenever the stored id is missing or archived.
 */
export function useWorkspaces(): UseWorkspacesResult {
  const raw = useLiveQuery(() => db.workspaces.toArray(), []);
  const settings = useLiveQuery(() => db.settings.get("app"), []);

  const workspaces = (raw ?? [])
    .slice()
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt - b.createdAt;
    });

  const storedId = settings?.activeWorkspaceId ?? null;
  const selectable = workspaces.filter((w) => !w.archived);
  const active =
    selectable.find((w) => w.id === storedId) ??
    selectable.find((w) => w.id === DEFAULT_WORKSPACE_ID) ??
    selectable[0] ??
    null;
  const activeId = active?.id ?? DEFAULT_WORKSPACE_ID;

  const create = useCallback((input: WorkspaceInput) => addWorkspace(input), []);
  const update = useCallback(
    (id: string, patch: Partial<Omit<Workspace, "id" | "createdAt">>) =>
      updateWorkspace(id, patch),
    [],
  );
  const remove = useCallback((id: string) => deleteWorkspace(id), []);
  const setActive = useCallback(
    (id: string) => saveSettings({ activeWorkspaceId: id }),
    [],
  );

  return {
    workspaces,
    active,
    activeId,
    loading: raw === undefined,
    create,
    update,
    remove,
    setActive,
  };
}
