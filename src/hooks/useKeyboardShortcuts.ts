"use client";

import { useEffect } from "react";

export interface ShortcutHandlers {
  onNewTask: () => void;
  onSearch: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSave: () => void;
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
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+S works everywhere.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlers.onSave();
        return;
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
  }, [handlers, active]);
}
