"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, ChevronLeft } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { UTILITY_TOOLS, type UtilityTool } from "@/components/utilities/tools";

/**
 * A slide-out drawer of lightweight offline tools. On desktop it reveals on
 * hover of the edge handle (or click); on touch the handle is a 44px tap
 * target. Each tool opens as a lightweight overlay, never a full page.
 */
export function DailyUtilitiesPanel() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<UtilityTool | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  };

  useEffect(() => () => cancelClose(), []);

  return (
    <>
      {/* Edge handle — hover to open (desktop), tap to toggle (touch) */}
      <div
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Daily utilities"
          aria-expanded={open}
          className="flex h-16 w-8 items-center justify-center rounded-l-2xl bg-card text-ink-muted shadow-lift transition-colors hover:text-accent"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-scrim/10 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="fixed right-0 top-0 z-50 flex h-dvh w-[85vw] max-w-xs flex-col bg-card shadow-lift pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
              aria-label="Daily utilities"
            >
              <div className="flex items-center gap-2 px-5 pt-5">
                <LayoutGrid className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-ink">Utilities</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
              <p className="px-5 pb-3 pt-1 text-xs text-ink-muted">
                Small, fast, offline tools.
              </p>

              <div className="grid grid-cols-2 gap-2.5 overflow-y-auto px-5 pb-6">
                {UTILITY_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActive(tool)}
                    className="flex min-h-[92px] flex-col items-start gap-2 rounded-2xl bg-fill/[0.03] p-3.5 text-left transition-colors hover:bg-fill/[0.06]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-accent shadow-sm">
                      <tool.Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-sm font-medium leading-tight text-ink">
                      {tool.name}
                    </span>
                    <span className="text-[11px] text-ink-muted">{tool.hint}</span>
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Tool overlay */}
      <Modal
        open={active !== null}
        onOpenChange={(o) => !o && setActive(null)}
        title={active?.name ?? "Utility"}
        variant="sheet"
        className="max-w-sm"
      >
        {active && (
          <div className="px-5 pb-7 pt-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <active.Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">{active.name}</h2>
                <p className="text-xs text-ink-muted">{active.hint}</p>
              </div>
            </div>
            <active.Component />
          </div>
        )}
      </Modal>
    </>
  );
}
