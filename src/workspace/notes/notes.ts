/**
 * Note helpers — a lightweight block model. A note is an ordered list of typed
 * blocks (heading / text / bullet / checkbox / quote / code). No Markdown
 * parsing, no external editor: just plain, autosave-friendly data.
 */

import type { NoteBlock, NoteBlockType, WorkspaceNote } from "@/types";
import { createId } from "@/lib/utils";

/** A fresh block of the given type. */
export function makeBlock(type: NoteBlockType = "text", text = ""): NoteBlock {
  return type === "checkbox"
    ? { id: createId(), type, text, checked: false }
    : { id: createId(), type, text };
}

/** Flatten a note's blocks into plain text (for search & previews). */
export function notePlainText(note: WorkspaceNote): string {
  return note.blocks.map((b) => b.text).join(" ");
}

/** The first non-empty line of body text, for a card preview. */
export function notePreview(note: WorkspaceNote): string {
  const firstText = note.blocks.find((b) => b.text.trim().length > 0);
  return firstText ? firstText.text.trim() : "Empty note";
}

/** Word count across all blocks. */
export function noteWordCount(note: WorkspaceNote): number {
  const words = notePlainText(note).trim();
  return words.length === 0 ? 0 : words.split(/\s+/).length;
}

/** Checkbox progress within a note: {done, total}. */
export function noteChecklist(note: WorkspaceNote): { done: number; total: number } {
  const boxes = note.blocks.filter((b) => b.type === "checkbox");
  return {
    done: boxes.filter((b) => b.checked).length,
    total: boxes.length,
  };
}
