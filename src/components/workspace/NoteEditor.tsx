"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Pin, Plus, Trash2 } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { makeBlock } from "@/workspace";
import { NOTE_BLOCK_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NoteBlock, NoteBlockType, WorkspaceNote } from "@/types";

interface NoteEditorProps {
  note: WorkspaceNote;
  onBack: () => void;
  onSetTitle: (title: string) => void;
  onSetBlocks: (blocks: NoteBlock[]) => void;
  onSetPinned: (pinned: boolean) => void;
  onDelete: () => void;
}

/**
 * Module 2 — the block editor. A note is an ordered list of typed blocks; the
 * editor keeps them in local state and autosaves (debounced). Enter splits into
 * a new block, Backspace on an empty block removes it — a calm, offline writing
 * surface with no Markdown to learn.
 */
export function NoteEditor({
  note,
  onBack,
  onSetTitle,
  onSetBlocks,
  onSetPinned,
  onDelete,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [blocks, setBlocks] = useState<NoteBlock[]>(note.blocks);
  const noteId = useRef(note.id);
  const focusId = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTextAreaElement>());

  // Reconcile when a different note is opened.
  useEffect(() => {
    if (noteId.current !== note.id) {
      noteId.current = note.id;
      setTitle(note.title);
      setBlocks(note.blocks);
    }
  }, [note.id, note.title, note.blocks]);

  const persistBlocks = useDebouncedCallback((next: NoteBlock[]) => onSetBlocks(next), 500);
  const persistTitle = useDebouncedCallback((next: string) => onSetTitle(next), 500);

  const commit = useCallback(
    (next: NoteBlock[]) => {
      setBlocks(next);
      persistBlocks(next);
    },
    [persistBlocks],
  );

  // Focus a freshly-inserted block after render.
  useLayoutEffect(() => {
    if (focusId.current) {
      rowRefs.current.get(focusId.current)?.focus();
      focusId.current = null;
    }
  });

  const updateText = (id: string, text: string) =>
    commit(blocks.map((b) => (b.id === id ? { ...b, text } : b)));

  const setType = (id: string, type: NoteBlockType) =>
    commit(
      blocks.map((b) =>
        b.id === id
          ? { ...b, type, checked: type === "checkbox" ? (b.checked ?? false) : undefined }
          : b,
      ),
    );

  const toggleCheck = (id: string) =>
    commit(blocks.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b)));

  const insertAfter = (id: string, type: NoteBlockType) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const block = makeBlock(type);
    focusId.current = block.id;
    commit([...blocks.slice(0, idx + 1), block, ...blocks.slice(idx + 1)]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      commit([makeBlock("text")]);
      return;
    }
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx > 0) focusId.current = blocks[idx - 1].id;
    commit(blocks.filter((b) => b.id !== id));
  };

  const onKeyDown = (e: React.KeyboardEvent, block: NoteBlock) => {
    const singleLine = block.type === "heading" || block.type === "bullet" || block.type === "checkbox";
    if (e.key === "Enter" && !e.shiftKey && singleLine) {
      e.preventDefault();
      insertAfter(block.id, block.type === "checkbox" ? "checkbox" : block.type === "bullet" ? "bullet" : "text");
    } else if (e.key === "Backspace" && block.text.length === 0) {
      e.preventDefault();
      removeBlock(block.id);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> Notes
        </button>
        <div className="flex-1" />
        <button
          type="button"
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          aria-pressed={note.pinned}
          onClick={() => onSetPinned(!note.pinned)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            note.pinned ? "text-accent" : "text-ink-muted/60 hover:bg-canvas hover:text-ink",
          )}
        >
          <Pin className="h-4 w-4" fill={note.pinned ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label="Delete note"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted/60 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          persistTitle(e.target.value);
        }}
        placeholder="Note title"
        className="w-full bg-transparent font-display text-2xl font-light text-ink placeholder:text-ink-muted/50 focus:outline-none"
      />

      <div className="flex flex-col gap-0.5">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            registerRef={(el) => {
              if (el) rowRefs.current.set(block.id, el);
              else rowRefs.current.delete(block.id);
            }}
            onText={(t) => updateText(block.id, t)}
            onType={(t) => setType(block.id, t)}
            onToggleCheck={() => toggleCheck(block.id)}
            onKeyDown={(e) => onKeyDown(e, block)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => insertAfter(blocks[blocks.length - 1]?.id ?? "", "text")}
        className="mt-1 flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-[13px] text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <Plus className="h-4 w-4" /> Add block
      </button>
    </div>
  );
}

const BLOCK_STYLE: Record<NoteBlockType, string> = {
  heading: "font-display text-lg font-medium text-ink",
  text: "text-[14px] text-ink",
  bullet: "text-[14px] text-ink",
  checkbox: "text-[14px] text-ink",
  quote: "text-[14px] italic text-ink-muted",
  code: "font-mono text-[13px] text-ink",
};

function BlockRow({
  block,
  registerRef,
  onText,
  onType,
  onToggleCheck,
  onKeyDown,
}: {
  block: NoteBlock;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onText: (text: string) => void;
  onType: (type: NoteBlockType) => void;
  onToggleCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow the textarea to its content.
  const resize = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useLayoutEffect(resize, [block.text, block.type, resize]);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 rounded-lg px-1 py-0.5 hover:bg-canvas/60",
        block.type === "quote" && "border-l-2 border-accent/40 pl-3",
        block.type === "code" && "bg-canvas/70",
      )}
    >
      {/* Leading marker */}
      <div className="flex h-6 shrink-0 items-center">
        {block.type === "bullet" && <span className="text-ink-muted">•</span>}
        {block.type === "checkbox" && (
          <button
            type="button"
            onClick={onToggleCheck}
            aria-pressed={block.checked}
            aria-label={block.checked ? "Uncheck" : "Check"}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              block.checked
                ? "border-success bg-success text-white"
                : "border-line text-transparent hover:border-accent",
            )}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </button>
        )}
        {(block.type === "heading" || block.type === "text" || block.type === "quote" || block.type === "code") && (
          <button
            type="button"
            aria-label="Change block type"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-5 w-4 items-center justify-center text-ink-muted/0 transition-colors group-hover:text-ink-muted/50"
          >
            ⋮
          </button>
        )}
      </div>

      <textarea
        ref={(el) => {
          areaRef.current = el;
          registerRef(el);
        }}
        value={block.text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={block.type === "heading" ? "Heading" : "Type…"}
        className={cn(
          "flex-1 resize-none bg-transparent py-0.5 placeholder:text-ink-muted/40 focus:outline-none",
          BLOCK_STYLE[block.type],
          block.type === "checkbox" && block.checked && "text-ink-muted line-through",
        )}
      />

      {/* Type menu */}
      <div className="relative">
        <button
          type="button"
          aria-label="Block type"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-6 items-center rounded px-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted/0 transition-colors group-hover:text-ink-muted/60 hover:text-ink"
        >
          {block.type}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-lift">
              {NOTE_BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    onType(opt.type);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col px-3 py-1.5 text-left transition-colors hover:bg-canvas",
                    block.type === opt.type && "bg-canvas",
                  )}
                >
                  <span className="text-[13px] text-ink">{opt.label}</span>
                  <span className="text-[11px] text-ink-muted">{opt.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
