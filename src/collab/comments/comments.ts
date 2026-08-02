/**
 * Comment helpers (Modules 5 & 6) — mention parsing and ordering. Pure.
 */

import type { Comment } from "@/types";

const MENTION_RE = /@([a-z0-9_][a-z0-9_.-]*)/gi;

/** Extract distinct @mentions (without the @) from a comment body. */
export function parseMentions(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(MENTION_RE)) found.add(m[1].toLowerCase());
  return [...found];
}

/** Split a body into text/mention tokens for rich rendering. */
export interface CommentToken {
  type: "text" | "mention";
  value: string;
}

export function tokenizeComment(body: string): CommentToken[] {
  const tokens: CommentToken[] = [];
  let last = 0;
  for (const m of body.matchAll(MENTION_RE)) {
    const start = m.index ?? 0;
    if (start > last) tokens.push({ type: "text", value: body.slice(last, start) });
    tokens.push({ type: "mention", value: m[0] });
    last = start + m[0].length;
  }
  if (last < body.length) tokens.push({ type: "text", value: body.slice(last) });
  return tokens;
}

/** Oldest comment first (chronological thread). */
export function sortComments(items: Comment[]): Comment[] {
  return [...items].sort((a, b) => a.createdAt - b.createdAt);
}
