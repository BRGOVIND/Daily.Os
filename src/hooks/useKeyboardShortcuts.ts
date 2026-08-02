"use client";

import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  onNewTask: () => void;
  onSearch: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSave: () => void;
  /** Ctrl/⌘+K — universal command palette. Works everywhere. */
  onCommand: () => void;
  /** T / Ctrl+1 — open today's workspace. */
  onOpenToday: () => void;
  /** W — open the Workspace OS hub. */
  onOpenWorkspaces: () => void;
  /** ? — show the keyboard shortcuts cheat-sheet. */
  onHelp: () => void;
  /** Ctrl/⌘+Shift+Space — quick capture a task. */
  onQuickCapture: () => void;
  /** Ctrl/⌘+Alt/⌥+N — open quick notes. */
  onQuickNote: () => void;
  /** Ctrl/⌘+2 — jump to the agenda. */
  onAgenda: () => void;
  /** Ctrl/⌘+3 — enter focus mode. */
  onFocusMode: () => void;
}

/** True when focus is in a text-entry field, where global keys should pass through. */
function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Global shortcuts:
 *   N        new task
 *   /        search
 *   ← / →    navigate months
 *   Ctrl/⌘+S save (everything autosaves; this surfaces confirmation)
 *
 * `active` gates the single-key shortcuts so they don't fire while a modal or
 * text field is engaged. Esc is handled by Radix within each modal.
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  active: boolean,
): void {
  // Keep the latest handlers in a ref so the global listener is bound once (per
  // `active` change) instead of being torn down and re-added on every render —
  // callers pass a fresh handlers object each render and that's fine.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Read the freshest handlers on each event.
      const handlers = handlersRef.current;
      // Ctrl/Cmd+S works everywhere.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlers.onSave();
        return;
      }

      // Ctrl/Cmd+K — command palette — works everywhere too.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onCommand();
        return;
      }

      // Chord shortcuts (with modifiers) work globally, like ⌘K/⌘S.
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/⌘+Shift+Space — quick capture.
      if (mod && e.shiftKey && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        handlers.onQuickCapture();
        return;
      }

      // Ctrl/⌘+Alt/⌥+N — quick note.
      if (mod && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handlers.onQuickNote();
        return;
      }

      // Ctrl/⌘+1 / 2 / 3 — today / agenda / focus mode.
      if (mod && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          handlers.onOpenToday();
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          handlers.onAgenda();
          return;
        }
        if (e.key === "3") {
          e.preventDefault();
          handlers.onFocusMode();
          return;
        }
      }

      if (!active || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          handlers.onNewTask();
          break;
        case "/":
          e.preventDefault();
          handlers.onSearch();
          break;
        case "t":
        case "T":
          e.preventDefault();
          handlers.onOpenToday();
          break;
        case "w":
        case "W":
          e.preventDefault();
          handlers.onOpenWorkspaces();
          break;
        case "?":
          e.preventDefault();
          handlers.onHelp();
          break;
        case "ArrowLeft":
          handlers.onPrevMonth();
          break;
        case "ArrowRight":
          handlers.onNextMonth();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
