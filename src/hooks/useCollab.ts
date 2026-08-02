"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addActivity,
  addComment,
  addMember,
  db,
  deleteComment,
  removeMember,
  updateMember,
  type CommentInput,
  type MemberInput,
} from "@/lib/db";
import { useIdentity } from "@/hooks/useIdentity";
import {
  can,
  parseMentions,
  sortActivity,
  sortComments,
  type Capability,
} from "@/collab";
import { createId } from "@/lib/utils";
import type {
  Activity,
  Comment,
  CommentTargetType,
  Member,
  Role,
} from "@/types";

/**
 * Live collaboration state for a workspace: members, the current user's role &
 * capabilities, and mutation helpers (invite, role change, comment, activity).
 * In personal mode there are no members, so the local user is treated as
 * `owner` and every capability check passes — nothing about single-user changes.
 */
export function useCollab(workspaceId: string | null) {
  const { identity } = useIdentity();

  const members = useLiveQuery<Member[]>(
    () =>
      workspaceId
        ? db.members.where("workspaceId").equals(workspaceId).toArray()
        : Promise.resolve<Member[]>([]),
    [workspaceId],
  );

  const list = members ?? [];
  const me = list.find((m) => m.actorId === identity.actorId) ?? null;
  // No membership row ⇒ you own your own (personal) workspace.
  const myRole: Role = me?.role ?? "owner";
  const isShared = list.length > 1;

  const capable = useCallback((cap: Capability) => can(myRole, cap), [myRole]);

  const logActivity = useCallback(
    (
      kind: Activity["kind"],
      targetType: Activity["targetType"],
      targetId: string,
      summary: string,
    ) => {
      if (!workspaceId) return Promise.resolve();
      return addActivity({
        workspaceId,
        kind,
        actorId: identity.actorId,
        actorName: identity.name,
        targetType,
        targetId,
        summary,
      });
    },
    [workspaceId, identity],
  );

  const invite = useCallback(
    async (name: string, role: Role) => {
      if (!workspaceId || !can(myRole, "invite")) return;
      const input: MemberInput = {
        workspaceId,
        actorId: `invited-${createId()}`,
        name,
        role,
        status: "invited",
        inviteCode: createId().slice(0, 8).toUpperCase(),
      };
      await addMember(input);
      await logActivity("invited", "member", input.actorId, `invited ${name} as ${role}`);
    },
    [workspaceId, myRole, logActivity],
  );

  const changeRole = useCallback(
    async (member: Member, role: Role) => {
      if (!can(myRole, "manage-roles")) return;
      await updateMember(member.id, { role });
      await logActivity("role-changed", "member", member.actorId, `made ${member.name} ${role}`);
    },
    [myRole, logActivity],
  );

  const kick = useCallback(
    async (member: Member) => {
      if (!can(myRole, "remove-member")) return;
      await removeMember(member.id);
    },
    [myRole],
  );

  /** Turn the local user into an active member so the workspace becomes shared. */
  const ensureSelfMember = useCallback(async () => {
    if (!workspaceId || me) return;
    await addMember({
      workspaceId,
      actorId: identity.actorId,
      name: identity.name,
      role: "owner",
      status: "active",
    });
  }, [workspaceId, me, identity]);

  return {
    members: list,
    me,
    myRole,
    isShared,
    can: capable,
    invite,
    changeRole,
    kick,
    ensureSelfMember,
    logActivity,
  };
}

/** A live, chronological comment thread for one target. */
export function useComments(
  workspaceId: string | null,
  targetType: CommentTargetType,
  targetId: string | null,
) {
  const { identity } = useIdentity();
  const raw = useLiveQuery<Comment[]>(
    () =>
      workspaceId && targetId
        ? db.comments
            .where("[targetType+targetId]")
            .equals([targetType, targetId])
            .toArray()
        : Promise.resolve<Comment[]>([]),
    [workspaceId, targetType, targetId],
  );

  const comments = useMemo(() => sortComments(raw ?? []), [raw]);

  const post = useCallback(
    async (body: string) => {
      if (!workspaceId || !targetId || !body.trim()) return;
      const input: CommentInput = {
        workspaceId,
        targetType,
        targetId,
        authorId: identity.actorId,
        authorName: identity.name,
        body: body.trim(),
        mentions: parseMentions(body),
      };
      await addComment(input);
      await addActivity({
        workspaceId,
        kind: "commented",
        actorId: identity.actorId,
        actorName: identity.name,
        targetType,
        targetId,
        summary: `commented on a ${targetType}`,
      });
    },
    [workspaceId, targetType, targetId, identity],
  );

  const remove = useCallback((id: string) => deleteComment(id), []);

  return { comments, post, remove };
}

/** A live workspace activity feed, newest first. */
export function useActivity(workspaceId: string | null, limit = 50) {
  const raw = useLiveQuery<Activity[]>(
    () =>
      workspaceId
        ? db.activity.where("workspaceId").equals(workspaceId).toArray()
        : Promise.resolve<Activity[]>([]),
    [workspaceId],
  );
  return useMemo(() => sortActivity(raw ?? []).slice(0, limit), [raw, limit]);
}
