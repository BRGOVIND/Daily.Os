/**
 * Role-based access control (Modules 2 & 10).
 *
 * A pure capability matrix: given a role, which actions are allowed. Every
 * mutating collaboration action is checked through `can()`. In personal mode the
 * local user is the workspace `owner`, so every check passes and nothing changes.
 *
 * NOTE: client-side checks are a UX guardrail, not a security boundary. A real
 * shared backend must re-validate every mutation server-side (see the security
 * model in docs/COLLABORATION.md).
 */

import type { Role } from "@/types";

export type Capability =
  | "view"
  | "comment"
  | "edit-content" // tasks, notes, missions, journal, resources
  | "assign"
  | "invite"
  | "manage-roles"
  | "remove-member"
  | "delete-workspace"
  | "transfer-ownership";

/** Higher rank = more privilege. Used to prevent privilege escalation. */
export const ROLE_RANK: Record<Role, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
  viewer: 0,
};

const CAPS: Record<Role, Capability[]> = {
  viewer: ["view", "comment"],
  editor: ["view", "comment", "edit-content", "assign"],
  admin: ["view", "comment", "edit-content", "assign", "invite", "manage-roles", "remove-member"],
  owner: [
    "view",
    "comment",
    "edit-content",
    "assign",
    "invite",
    "manage-roles",
    "remove-member",
    "delete-workspace",
    "transfer-ownership",
  ],
};

/** Whether a role may perform a capability. */
export function can(role: Role, cap: Capability): boolean {
  return CAPS[role].includes(cap);
}

/**
 * Whether `actor` may set `target`'s role to `next`. You can never grant a role
 * at or above your own rank, and only admins/owners manage roles at all.
 */
export function canAssignRole(actor: Role, next: Role): boolean {
  if (!can(actor, "manage-roles")) return false;
  return ROLE_RANK[next] < ROLE_RANK[actor];
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

/** The roles a given actor is allowed to assign to others. */
export function assignableRoles(actor: Role): Role[] {
  return (Object.keys(ROLE_RANK) as Role[]).filter((r) => canAssignRole(actor, r));
}
