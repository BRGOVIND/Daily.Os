"use client";

import { useState } from "react";
import { Pin, Plus, StickyNote } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { noteChecklist, notePreview } from "@/workspace";
import { cn } from "@/lib/utils";
import { NoteEditor } from "./NoteEditor";
import { EmptyState } from "./EmptyState";

interface NotesTabProps {
  workspaceId: string;
}

/** Module 2 — the workspace's notes: a list that opens into the block editor. */
export function NotesTab({ workspaceId }: NotesTabProps) {
  const { notes, create, remove, setTitle, setPinned, setBlocks } = useNotes(workspaceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const handleCreate = async () => {
    const id = await create();
    if (id) setSelectedId(id);
  };

  if (selected) {
    return (
      <NoteEditor
        note={selected}
        onBack={() => setSelectedId(null)}
        onSetTitle={(t) => setTitle(selected.id, t)}
        onSetBlocks={(b) => setBlocks(selected.id, b)}
        onSetPinned={(p) => setPinned(selected.id, p)}
        onDelete={() => {
          void remove(selected.id);
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </h4>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" /> New note
        </button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="h-8 w-8" />}
          title="No notes yet."
          hint="Capture ideas, drafts and references — headings, lists, checkboxes, quotes and code, all offline."
          actionLabel="Write your first note"
          onAction={handleCreate}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {notes.map((note) => {
            const check = noteChecklist(note);
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className="flex w-full flex-col gap-1 rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-ink/20"
                >
                  <div className="flex items-center gap-2">
                    {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor" />}
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {note.title || "Untitled note"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[13px] text-ink-muted">{notePreview(note)}</p>
                  {check.total > 0 && (
                    <span
                      className={cn(
                        "mt-1 self-start rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium",
                        check.done === check.total ? "text-success" : "text-ink-muted",
                      )}
                    >
                      {check.done}/{check.total} done
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
