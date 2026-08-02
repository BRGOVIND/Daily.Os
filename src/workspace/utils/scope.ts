/**
 * Scoping — the single rule for "does this belong to workspace X?".
 *
 * Pre-Phase-5 tasks, missions and journal entries carry a null `workspaceId`.
 * We treat null as "the default workspace", so legacy data has a home the
 * instant Workspace OS turns on and nothing is ever orphaned.
 */

import { DEFAULT_WORKSPACE_ID } from "@/lib/constants";
import type { WorkspaceSnapshot } from "@/workspace/models/types";

/** True if an entity's workspaceId resolves to `scope`. */
export function belongsTo(
  workspaceId: string | null | undefined,
  scope: string,
): boolean {
  return (workspaceId ?? DEFAULT_WORKSPACE_ID) === scope;
}

/** Narrow a full snapshot down to a single workspace's slice. */
export function scopeSnapshot(
  snapshot: WorkspaceSnapshot,
  workspaceId: string,
): WorkspaceSnapshot {
  return {
    ...snapshot,
    tasks: snapshot.tasks.filter((t) => belongsTo(t.task.workspaceId, workspaceId)),
    missions: snapshot.missions.filter((m) => belongsTo(m.workspaceId, workspaceId)),
    notes: snapshot.notes.filter((n) => belongsTo(n.workspaceId, workspaceId)),
    resources: snapshot.resources.filter((r) => belongsTo(r.workspaceId, workspaceId)),
    journal: snapshot.journal.filter((e) => belongsTo(e.workspaceId, workspaceId)),
  };
}
