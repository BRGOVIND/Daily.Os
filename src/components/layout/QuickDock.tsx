"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "@/lib/motion";
import {
  Sparkles,
  StickyNote,
  Timer,
  Moon,
  NotebookPen,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickDockAction {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface QuickDockProps {
  onQuickNote: () => void;
  onPomodoro: () => void;
  onFocus: () => void;
  onStickies: () => void;
  onRoutines: () => void;
}

/**
 * A compact expandable dock of daily-productivity actions, sitting just above
 * the Add-task FAB. Tapping the trigger reveals mini-buttons; each is a 44px
 * touch target with a label. Keyboard users have shortcuts for the same actions.
 */
export function QuickDock({
  onQuickNote,
  onPomodoro,
  onFocus,
  onStickies,
  onRoutines,
}: QuickDockProps) {
  const [open, setOpen] = useState(false);

  const actions: QuickDockAction[] = [
    { key: "note", label: "Quick note", Icon: NotebookPen, onClick: onQuickNote },
    { key: "timer", label: "Pomodoro", Icon: Timer, onClick: onPomodoro },
    { key: "focus", label: "Focus mode", Icon: Moon, onClick: onFocus },
    { key: "sticky", label: "Sticky notes", Icon: StickyNote, onClick: onStickies },
    { key: "routine", label: "Routines", Icon: LayoutTemplate, onClick: onRoutines },
  ];

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-[calc(1.25rem+env(safe-area-inset-right))] z-40 flex flex-col items-end gap-2.5 sm:bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:right-[calc(2rem+env(safe-area-inset-right))]">
      <AnimatePresence>
        {open && (
          <motion.ul
            className="flex flex-col items-end gap-2.5"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { transition: { staggerChildren: 0.04 } },
              hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
            }}
          >
            {actions.map((a) => (
              <motion.li
                key={a.key}
                className="flex items-center gap-2"
                variants={{
                  hidden: { opacity: 0, y: 8, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
              >
                <span className="rounded-lg bg-scrim/80 px-2 py-1 text-xs font-medium text-white shadow-sm">
                  {a.label}
                </span>
                <button
                  type="button"
                  onClick={() => run(a.onClick)}
                  aria-label={a.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-lift transition-colors hover:text-accent"
                >
                  <a.Icon className="h-[18px] w-[18px]" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Daily tools"
        aria-expanded={open}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lift transition-colors",
          open ? "text-accent" : "text-ink-muted hover:text-ink",
        )}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={spring.snappy}>
          <Sparkles className="h-5 w-5" />
        </motion.span>
      </motion.button>
    </div>
  );
}
