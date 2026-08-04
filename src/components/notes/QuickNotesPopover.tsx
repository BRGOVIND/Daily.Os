"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { Pin, PinOff, Plus, Search, Trash2, X, StickyNote } from "lucide-react";
import { useQuickNotes } from "@/hooks/useQuickNotes";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { Markdown } from "@/components/ui/Markdown";
import { STICKY_COLORS, STICKY_COLOR_KEYS } from "@/lib/constants";
import type { QuickNote } from "@/types";
import { cn } from "@/lib/utils";

interface QuickNotesPopoverProps {
  open: boolean;
  dateKey: string;
  onClose: () => void;
}

/**
 * A small, instantly-autosaving quick-notes popup — day-scoped by default, with
 * global pinning, colour themes, Markdown preview and a search across all notes.
 */
export function QuickNotesPopover({ open, dateKey, onClose }: QuickNotesPopoverProps) {
  const { visible, all, add, update, togglePin, remove } = useQuickNotes(dateKey);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearching(false);
      setEditingId(null);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q
    ? all.filter((n) => n.body.toLowerCase().includes(q))
    : visible;

  const handleAdd = async () => {
    const id = await add();
    setEditingId(id);
    setSearching(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Click-away layer */}
          <motion.div
            className="fixed inset-0 z-40 bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-label="Quick notes"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={spring.soft}
            className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[70dvh] w-auto max-w-sm flex-col rounded-3xl bg-card shadow-lift sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[22rem] pb-[env(safe-area-inset-bottom)]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4">
              <StickyNote className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">Quick Notes</h2>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSearching((v) => !v)}
                  aria-label="Search notes"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-fill/[0.05]",
                    searching ? "text-accent" : "text-ink-muted",
                  )}
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  aria-label="New note"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {searching && (
              <div className="px-4 pt-3">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search all notes…"
                  className="w-full rounded-xl bg-fill/[0.04] px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:ring-2 focus:ring-accent/30"
                />
              </div>
            )}

            {/* Notes */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {list.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-muted">
                  {q ? "No notes match." : "No notes yet. Tap + to jot one down."}
                </p>
              ) : (
                list.map((note) => (
                  <QuickNoteCard
                    key={note.id}
                    note={note}
                    editing={editingId === note.id}
                    onEdit={() => setEditingId(note.id)}
                    onBlur={() => setEditingId((cur) => (cur === note.id ? null : cur))}
                    onChange={(body) => void update(note.id, { body })}
                    onColor={(color) => void update(note.id, { color })}
                    onTogglePin={() => void togglePin(note.id)}
                    onDelete={() => void remove(note.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickNoteCard({
  note,
  editing,
  onEdit,
  onBlur,
  onChange,
  onColor,
  onTogglePin,
  onDelete,
}: {
  note: QuickNote;
  editing: boolean;
  onEdit: () => void;
  onBlur: () => void;
  onChange: (body: string) => void;
  onColor: (color: QuickNote["color"]) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const [body, setBody] = useState(note.body);
  const [showColors, setShowColors] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const debouncedSave = useDebouncedCallback(onChange, 350);
  const theme = STICKY_COLORS[note.color];

  // Sync in external updates when not actively editing.
  useEffect(() => {
    if (!editing) setBody(note.body);
  }, [note.body, editing]);

  useEffect(() => {
    if (editing && taRef.current) {
      const el = taRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  return (
    <div
      className="rounded-2xl border p-3 transition-shadow"
      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
    >
      {editing ? (
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            debouncedSave(e.target.value);
          }}
          onBlur={() => {
            onChange(body);
            onBlur();
          }}
          rows={Math.min(10, Math.max(2, body.split("\n").length))}
          placeholder="Write a note… (Markdown supported)"
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-50"
          style={{ color: theme.text }}
        />
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="w-full text-left text-sm leading-relaxed"
        >
          {note.body.trim() ? (
            <Markdown text={note.body} />
          ) : (
            <span className="opacity-50">Empty note — tap to edit</span>
          )}
        </button>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center gap-1 border-t border-current/10 pt-2">
        <button
          type="button"
          onClick={() => setShowColors((v) => !v)}
          aria-label="Change colour"
          className="flex h-7 w-7 items-center justify-center rounded-full"
        >
          <span
            className="h-3.5 w-3.5 rounded-full ring-1 ring-fill/10"
            style={{ backgroundColor: theme.accent }}
          />
        </button>

        {showColors && (
          <div className="flex items-center gap-1">
            {STICKY_COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={STICKY_COLORS[c].label}
                onClick={() => {
                  onColor(c);
                  setShowColors(false);
                }}
                className="h-4 w-4 rounded-full ring-1 ring-fill/10"
                style={{ backgroundColor: STICKY_COLORS[c].accent }}
              />
            ))}
          </div>
        )}

        <span className="ml-auto text-[11px] opacity-60">
          {note.pinned ? "Pinned" : ""}
        </span>

        <button
          type="button"
          onClick={onTogglePin}
          aria-label={note.pinned ? "Unpin" : "Pin globally"}
          className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 hover:opacity-100"
        >
          {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete note"
          className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
