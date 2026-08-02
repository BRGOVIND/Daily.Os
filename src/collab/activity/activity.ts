/**
 * Activity feed helpers (Module 7) — pure formatting over Activity records.
 */

import type { Activity, ActivityKind } from "@/types";

export const ACTIVITY_VERB: Record<ActivityKind, string> = {
  created: "created",
  completed: "completed",
  edited: "edited",
  archived: "archived",
  invited: "invited",
  joined: "joined",
  commented: "commented on",
  assigned: "assigned",
  "role-changed": "changed the role of",
};

export const ACTIVITY_ICON: Record<ActivityKind, string> = {
  created: "✨",
  completed: "✅",
  edited: "✏️",
  archived: "📦",
  invited: "✉️",
  joined: "👋",
  commented: "💬",
  assigned: "🎯",
  "role-changed": "🛡️",
};

/** Newest activity first. */
export function sortActivity(items: Activity[]): Activity[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

/** A one-line human sentence for an activity entry. */
export function describeActivity(a: Activity): string {
  if (a.summary) return `${a.actorName} ${a.summary}`;
  return `${a.actorName} ${ACTIVITY_VERB[a.kind]} ${a.targetType}`;
}
