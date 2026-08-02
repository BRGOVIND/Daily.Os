"use client";

import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useComments } from "@/hooks/useCollab";
import { useIdentity } from "@/hooks/useIdentity";
import { tokenizeComment } from "@/collab";
import { cn } from "@/lib/utils";
import type { CommentTargetType } from "@/types";

interface CommentsThreadProps {
  workspaceId: string;
  targetType: CommentTargetType;
  targetId: string;
  /** Whether the current user may post (permission-gated by the caller). */
  canComment?: boolean;
  compact?: boolean;
}

/**
 * A reusable, live comment thread (Modules 5 & 6). Drop it onto any target —
 * task, mission, workspace or journal — by passing the target type and id; it
 * shares the same `useComments` hook and Dexie table, so threads sync live
 * across windows automatically.
 */
export function CommentsThread({
  workspaceId,
  targetType,
  targetId,
  canComment = true,
  compact = false,
}: CommentsThreadProps) {
  const { identity } = useIdentity();
  const { comments, post, remove } = useComments(workspaceId, targetType, targetId);
  const [draft, setDraft] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await post(draft);
    setDraft("");
  };

  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      {!compact && (
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <MessageSquare className="h-3.5 w-3.5" /> Discussion
          {comments.length > 0 && (
            <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium">
              {comments.length}
            </span>
          )}
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-[13px] text-ink-muted/70">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="group rounded-xl border border-line bg-card p-3">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">{c.authorName}</span>
                <span className="text-[11px] text-ink-muted/70">{timeAgo(c.createdAt)}</span>
                {c.authorId === identity.actorId && (
                  <button
                    type="button"
                    aria-label="Delete comment"
                    onClick={() => remove(c.id)}
                    className="ml-auto text-ink-muted/0 transition-colors hover:text-accent group-hover:text-ink-muted/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[13px] leading-relaxed text-ink">
                {tokenizeComment(c.body).map((t, i) =>
                  t.type === "mention" ? (
                    <span key={i} className="font-medium text-accent">{t.value}</span>
                  ) : (
                    <span key={i}>{t.value}</span>
                  ),
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…  @mention someone"
            className="h-9 flex-1 rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink placeholder:text-ink-muted/60 focus:border-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Post comment"
            disabled={!draft.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-[12px] text-ink-muted/60">You have view-only access.</p>
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
