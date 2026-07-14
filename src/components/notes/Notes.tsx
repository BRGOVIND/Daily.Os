"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, NotebookPen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

interface NotesProps {
  value: string;
  onChange: (notes: string) => void;
}

/** A plain markdown-friendly note that autosaves as you type. */
export function Notes({ value, onChange }: NotesProps) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExternal = useRef(value);

  // Reconcile when the underlying day changes (e.g. switching days).
  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setDraft(value);
    }
  }, [value]);

  const persist = useDebouncedCallback((next: string) => {
    onChange(next);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  }, 500);

  return (
    <section aria-label="Notes">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <NotebookPen className="h-4 w-4" />
          Notes
        </h3>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-success"
            >
              <Check className="h-3 w-3" /> Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          lastExternal.current = e.target.value;
          persist(e.target.value);
        }}
        rows={5}
        placeholder="Capture a thought, a reflection, a plan… Markdown welcome."
        className="min-h-[132px] bg-card"
      />
    </section>
  );
}
