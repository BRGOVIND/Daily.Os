"use client";

import { Keyboard } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

interface KeyboardHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A calm cheat-sheet of every keyboard shortcut. Opened with `?`. */
export function KeyboardHelp({ open, onOpenChange }: KeyboardHelpProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard shortcuts"
      variant="center"
      className="max-w-md"
    >
      <div className="p-6 sm:p-8">
        <header className="mb-5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            <Keyboard className="h-3.5 w-3.5" /> Keyboard
          </p>
          <h2 className="mt-1 font-display text-2xl font-light tracking-tight text-ink">
            Shortcuts
          </h2>
        </header>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted/70">
                {group.title}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-4">
                    <span className="text-[14px] text-ink">{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="min-w-[1.6rem] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-center text-[12px] font-medium text-ink-muted"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
