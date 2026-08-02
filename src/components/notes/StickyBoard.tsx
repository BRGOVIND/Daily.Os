"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useStickyNotes } from "@/hooks/useStickyNotes";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { STICKY_COLORS, STICKY_COLOR_KEYS } from "@/lib/constants";
import type { StickyNote } from "@/types";

interface StickyBoardProps {
  open: boolean;
  onClose: () => void;
}

const MIN_W = 168;
const MIN_H = 120;

/**
 * A pinboard overlay of sticky notes. Each note is dragged by its header and
 * resized from the corner using pointer events (precise, no transform residue),
 * can collapse to a title bar, and persists position, size and collapsed state.
 */
export function StickyBoard({ open, onClose }: StickyBoardProps) {
  const { notes, add, update, remove } = useStickyNotes();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Sticky notes board"
        >
          {/* Dim, click-through-nowhere backdrop so the board reads as a layer */}
          <div className="absolute inset-0 bg-scrim/10 backdrop-blur-[1px]" onClick={onClose} />

          {/* Toolbar */}
          <div className="absolute left-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card px-2 py-1.5 shadow-lift">
            <span className="px-2 text-xs font-medium text-ink-muted">
              {notes.length} sticky{notes.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => void add()}
              className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close board"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.06] hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-ink-muted">Add a sticky to get started.</p>
            </div>
          )}

          {notes.map((note) => (
            <StickyCard
              key={note.id}
              note={note}
              onChange={(patch) => void update(note.id, patch)}
              onDelete={() => void remove(note.id)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StickyCard({
  note,
  onChange,
  onDelete,
}: {
  note: StickyNote;
  onChange: (patch: Partial<Omit<StickyNote, "id" | "createdAt">>) => void;
  onDelete: () => void;
}) {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ w: note.width, h: note.height });
  const [body, setBody] = useState(note.body);
  const [showColors, setShowColors] = useState(false);
  const interacting = useRef(false);
  const debouncedSave = useDebouncedCallback(
    (b: string) => onChange({ body: b }),
    350,
  );
  const theme = STICKY_COLORS[note.color];

  // Sync external updates while not mid-gesture.
  useEffect(() => {
    if (!interacting.current) {
      setPos({ x: note.x, y: note.y });
      setSize({ w: note.width, h: note.height });
    }
  }, [note.x, note.y, note.width, note.height]);
  useEffect(() => setBody(note.body), [note.body]);

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    interacting.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = pos.x;
    const baseY = pos.y;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 40;

    const move = (ev: PointerEvent) => {
      const nx = Math.min(maxX, Math.max(0, baseX + (ev.clientX - startX)));
      const ny = Math.min(maxY, Math.max(0, baseY + (ev.clientY - startY)));
      setPos({ x: nx, y: ny });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      interacting.current = false;
      const nx = Math.min(maxX, Math.max(0, baseX + (ev.clientX - startX)));
      const ny = Math.min(maxY, Math.max(0, baseY + (ev.clientY - startY)));
      onChange({ x: nx, y: ny });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    interacting.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const baseW = size.w;
    const baseH = size.h;

    const move = (ev: PointerEvent) => {
      setSize({
        w: Math.max(MIN_W, baseW + (ev.clientX - startX)),
        h: Math.max(MIN_H, baseH + (ev.clientY - startY)),
      });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      interacting.current = false;
      onChange({
        width: Math.max(MIN_W, baseW + (ev.clientX - startX)),
        height: Math.max(MIN_H, baseH + (ev.clientY - startY)),
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className="absolute flex flex-col overflow-hidden rounded-2xl border shadow-lift"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: note.collapsed ? undefined : size.h,
        backgroundColor: theme.bg,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      {/* Header / drag handle */}
      <div
        onPointerDown={startDrag}
        className="flex touch-none items-center gap-1 px-2 py-1.5"
        style={{ cursor: "grab" }}
      >
        <GripHorizontal className="h-4 w-4 opacity-50" />
        <div className="relative">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowColors((v) => !v)}
            aria-label="Change colour"
            className="flex h-6 w-6 items-center justify-center"
          >
            <span
              className="h-3.5 w-3.5 rounded-full ring-1 ring-fill/10"
              style={{ backgroundColor: theme.accent }}
            />
          </button>
          {showColors && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-0 top-7 z-10 flex gap-1 rounded-full bg-card p-1.5 shadow-lift"
            >
              {STICKY_COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={STICKY_COLORS[c].label}
                  onClick={() => {
                    onChange({ color: c });
                    setShowColors(false);
                  }}
                  className="h-4 w-4 rounded-full ring-1 ring-fill/10"
                  style={{ backgroundColor: STICKY_COLORS[c].accent }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange({ collapsed: !note.collapsed })}
            aria-label={note.collapsed ? "Expand" : "Collapse"}
            className="flex h-6 w-6 items-center justify-center opacity-60 hover:opacity-100"
          >
            {note.collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            aria-label="Delete sticky"
            className="flex h-6 w-6 items-center justify-center opacity-60 hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!note.collapsed && (
        <>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              debouncedSave(e.target.value);
            }}
            onBlur={() => onChange({ body })}
            placeholder="Write…"
            className="w-full flex-1 resize-none bg-transparent px-3 pb-3 text-sm leading-relaxed outline-none placeholder:opacity-40"
            style={{ color: theme.text }}
          />
          {/* Resize handle */}
          <div
            onPointerDown={startResize}
            className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize touch-none"
            aria-hidden
          >
            <span
              className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2"
              style={{ borderColor: theme.text, opacity: 0.4 }}
            />
          </div>
        </>
      )}
    </div>
  );
}
